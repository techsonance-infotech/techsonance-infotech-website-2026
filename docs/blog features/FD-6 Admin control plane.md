# FD-6 Admin control plane

This document settles what an admin can see and change at runtime, without a code deploy, and who is allowed to do it.

## 1. Purpose and traceability

| Item            | Value                                                                                   |
| --------------- | --------------------------------------------------------------------------------------- |
| Requirements    | FR-9 (admin page), FR-10 (schedule and caps), NFR-3 (keys never exposed), NFR-4 (audit) |
| Owner component | Admin web app and its API                                                               |
| Inputs          | Admin actions and settings edits                                                        |
| Output          | Changes to settings, jobs, providers and posts, each written to `audit_log`             |

The principle: **everything the automation does must be visible and changeable by an admin without touching code.**

## 2. Decisions

| Decision        | Options considered                       | Choice                                                                        | Why                                                                            |
| --------------- | ---------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Configuration   | Environment variables; database settings | Database `site_settings`, with a few secrets in the environment               | Admins change behaviour at runtime                                             |
| Setting changes | Edit in place; versioned                 | Versioned with who, when, old and new value                                   | Roll back a bad change in one click                                            |
| Roles           | One admin; roles                         | Three roles: `owner`, `editor`, `viewer`                                      | Owner manages keys and settings; editor reviews posts; viewer reads dashboards |
| Login           | Password only; password and 2FA          | Password and 2FA for owner and editor                                         | Admin can publish to the public site                                           |
| Kill switch     | None; global pause                       | One global pause that stops new jobs and sends, and lets running steps finish | Fast response to a bad output or a provider incident                           |
| Key display     | Show keys; masked                        | Masked after save, rotate instead of reveal                                   | Prevents leaks through screenshots                                             |

## 3. Structure

| Area      | What the admin sees                                                                           | Who           |
| --------- | --------------------------------------------------------------------------------------------- | ------------- |
| Posts     | Table by status, preview, edit, approve, reject, improve, resend email, regenerate image      | owner, editor |
| Jobs      | Live list with step, attempts, switches, errors; pause, resume, cancel, retry from step       | owner, editor |
| Providers | Accounts and models with status, cooldown, used today, last error; add, rotate, disable, test | owner         |
| Topics    | Queue, suggestions, blocked topics; reorder, accept, reject                                   | owner, editor |
| Prompts   | Template versions, active version, diff, rollback                                             | owner         |
| Settings  | Every setting in the other documents, with history                                            | owner         |
| Schedules | Cron-style rules, daily and weekly caps, pause window                                         | owner         |
| Audit     | Searchable log of every change                                                                | owner, viewer |
| Dashboard | Health and cost overview                                                                      | all roles     |

## 4. Flow

1. The admin signs in with 2FA. The API checks the role on every call, not only in the page.
2. A settings edit is validated against a schema, saved as a new version, and published as a `settings.changed` event. Workers reload it within one minute.
3. A job action (pause, retry from step 4) writes a command row. The worker reads it at its next heartbeat and obeys.
4. A provider change updates `provider_accounts`; the router registry refreshes and waiting jobs wake up.
5. Every action writes an audit row: who, what, before, after, time, IP.
6. The global pause sets `system_state.paused = true`. Schedulers and mail senders check it before each action.

## 5. Implementation

```ts
// every admin route
router.post(
  "/api/admin/settings/:key",
  requireAuth,
  requireRole("owner"),
  validate(settingSchema),
  async (req, res) => {
    const before = await settings.get(req.params.key);
    const after = await settings.set(req.params.key, req.body.value, { by: req.user.id });
    await audit.log({
      actor: req.user.id,
      action: "setting.update",
      entity: req.params.key,
      before,
      after,
    });
    events.publish("settings.changed", { key: req.params.key });
    res.json(after);
  },
);
```

| Table                   | Added for this feature | Key fields                                           |
| ----------------------- | ---------------------- | ---------------------------------------------------- |
| `site_settings`         | Current values         | key, value (JSON), version, updated\_by, updated\_at |
| `site_settings_history` | Every change           | key, value, version, changed\_by, changed\_at        |
| `admin_commands`        | Job controls           | job\_id, command, issued\_by, handled\_at            |
| `system_state`          | Global flags           | paused, paused\_by, reason                           |
| `users`                 | Admins                 | email, role, totp\_secret\_encrypted, active         |

## 6. Advanced control

The controls that matter most, grouped by the question the admin is asking:

| Question                             | Control                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------ |
| "Stop everything now."               | Global pause with a required reason                                      |
| "Write less or more."                | `target_words`, `daily_post_cap`, `weekly_post_cap`                      |
| "Spend nothing."                     | `prefer_free_first`, `monthly_budget_cap = 0`                            |
| "Why did this post look like that?"  | Post detail shows prompt version, models used, account, scores, switches |
| "Trust the automation more or less." | Autonomy level (FD-7)                                                    |
| "Undo the last change."              | Settings and prompt rollback; post version restore                       |

## 7. Automation hooks

- Everything in the admin app is also an API, so another agent or script can act with an API token scoped to a role (for example a `viewer` token for reporting).
- Scheduled reports: a weekly email with posts approved, rejected, waiting, cost per post, switches and failures.
- Alert rules are data: an admin can add a rule such as "notify me if any job waits over 6 hours" without code.

## 8. Failure modes and acceptance

| Failure                         | Handling                                                     |
| ------------------------------- | ------------------------------------------------------------ |
| Admin sets an invalid value     | Schema validation rejects it with a message                  |
| A bad setting breaks generation | Version history; rollback restores the previous value        |
| Admin account compromised       | Revoke sessions, rotate keys, global pause, review audit log |
| Two admins edit at once         | Optimistic version check; the second save asks to reload     |

**Acceptance:** a viewer cannot change anything; an owner changes `target_words` and the next job uses it with no deploy; global pause stops new jobs within one minute; every change is in the audit log with before and after.
