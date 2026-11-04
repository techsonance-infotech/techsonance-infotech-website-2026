# FD-3 Approval and notification

This document settles how the admin is asked to decide, how a decision is made safe against replay and email scanners, and how a decision changes post state.

## 1. Purpose and traceability

| Item | Value |
| --- | --- |
| Requirements | FR-4 (approval email), FR-5 (approve and reject), FR-6 (improve), FR-9 (admin page), NFR-1 (safe links) |
| Owner component | Approval service and email sender |
| Inputs | A post version in `PENDING_APPROVAL` |
| Output | A decision stored on `approval_requests`, and a state change on the post |

## 2. Decisions

| Decision | Options considered | Choice | Why |
| --- | --- | --- | --- |
| Action from email | Links that act on GET; links to a confirm page | Confirm page, action on POST | Mail scanners and previews open links; a GET must never publish |
| Token | JWT; random token stored hashed | Random 32 bytes, hash stored, single-use | Easy to revoke, nothing useful leaks from a database read |
| Token scope | Per post; per post version | Per post version | An old email cannot approve a newer rewrite |
| Who may decide | Anyone with the link; link plus login | Link alone for low-risk sites, link plus login when `require_login_to_approve` is on | Speed for the pilot, stronger control for production |
| Multiple admins | All must approve; first decision wins | First decision wins, others see who decided | One admin is enough for a blog |
| Email transport | Personal SMTP; transactional service | Transactional service with SPF, DKIM, DMARC | Deliverability and delivery status |
| Second channel | Email only; email plus admin page | Both. Admin page lists every pending post | Email can fail or be missed |

## 3. Structure

| Part | Responsibility |
| --- | --- |
| Request creator | Makes the approval row, token and expiry when a post enters `PENDING_APPROVAL` |
| Mail builder | Renders HTML and plain-text email from the post and a thumbnail preview |
| Mail sender | Sends, records message id and delivery status, retries with backoff |
| Decision endpoint | Validates the token, applies the decision in one database transaction |
| Reminder job | Sends a reminder at 24 hours, expires at 72 hours |
| Publisher | Sets `PUBLISHED`, purges site cache, optionally pings search engines and the sitemap |

## 4. Flow

1. FD-1 saves version n as `PENDING_APPROVAL`. The request creator makes an `approval_requests` row with `post_version = n`.
2. The mail sender sends the email to every address in `approver_emails`. Status moves to `SENT`, then `DELIVERED` or `BOUNCED`.
3. The admin clicks a button and lands on the confirm page, which shows the post and a single confirm button.
4. The decision endpoint opens a transaction, checks token hash, expiry, unused, and `post_version` equal to the current version, then applies the decision and marks the token used.
5. **Approve:** post `PUBLISHED`, `published_at` set, cache purged. **Reject:** post `REJECTED`, reason stored. **Improve:** post `NEEDS_IMPROVEMENT`, feedback stored, FD-5 queues version n+1.
6. A decision email or admin notification confirms the result. Later clicks show who decided and when.

## 5. Implementation

```ts
async function decide(token: string, decision: Decision, feedback?: string) {
  return db.tx(async (tx) => {
    const req = await tx.approval.findByHashForUpdate(sha256(token));
    if (!req || req.usedAt || req.expiresAt < now()) throw new Gone();
    const post = await tx.posts.get(req.postId);
    if (post.version !== req.postVersion) throw new Stale();
    await tx.approval.markUsed(req.id, decision, feedback);
    await tx.posts.transition(post.id, nextStatus(decision));
    await tx.audit.log({ actor: 'approver', action: decision, entity: 'post', id: post.id });
    if (decision === 'improve') await tx.jobs.enqueueRevision(post.id, feedback);
  });
}
```

All status changes go through one `transition()` function that only allows the edges drawn in the lifecycle diagram of the Master design; any other change throws.

## 6. Advanced control

| Setting | Default | Effect |
| --- | --- | --- |
| `approver_emails` | One address | Who receives requests |
| `approval_expiry_hours` | 72 | Link lifetime |
| `reminder_after_hours` | 24 | First reminder |
| `require_login_to_approve` | Off in pilot, on in production | Link plus admin login |
| `auto_publish_mode` | Off | See FD-7 for the optional trust-based mode |
| `publish_schedule` | Immediately | Or at the next slot, for example 09:00 local |

Admin page actions: approve, reject, improve with feedback, edit the post by hand then approve, resend email, extend expiry.

## 7. Automation hooks

- Events `approval.requested`, `approval.reminded`, `approval.decided` are published on the internal event bus.
- Slack, WhatsApp or a push channel can be added as a second notifier by subscribing to `approval.requested`, with no change to the decision logic.
- A decision can also come from a signed webhook, so another tool can approve on the admin's behalf, as long as it uses the same decide function.

## 8. Failure modes and acceptance

| Failure | Handling |
| --- | --- |
| Email not delivered | Retry with backoff, then alert and rely on the admin page |
| Link opened by a scanner | Only the confirm page loads; nothing changes |
| Link reused or expired | Clear message, option to request a fresh email |
| Two admins decide at once | Row lock; the second sees the first decision |
| Newer version exists | Old link shows "superseded" and offers the new one |

**Acceptance:** replaying a used link fails; an old-version link cannot publish; a GET never changes data; approve makes the post visible on the public site within one minute.
