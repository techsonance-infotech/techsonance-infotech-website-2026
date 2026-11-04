# FD-7 Automation and autonomy

This document settles how the whole agentic flow runs on its own: scheduling, topic planning, self-healing, and how much the system may do without a human.

## 1. Purpose and traceability

| Item | Value |
| --- | --- |
| Requirements | FR-10 (schedule and caps), FR-7 and FR-8 (self-switching and self-resuming, seen from the automation side) |
| Owner component | Orchestrator: scheduler, event bus, policy engine |
| Inputs | Events from every other feature, schedules, policies |
| Output | New jobs, pauses, resumes, notifications, and optionally an automatic publish |

FD-1 to FD-6 are the parts. This document is the **control loop that ties them together** so the system runs without someone pushing it.

## 2. Decisions

| Decision | Options considered | Choice | Why |
| --- | --- | --- | --- |
| Control style | One long agent that decides everything; fixed pipeline with agents inside steps | Fixed pipeline with agents inside steps, and a thin orchestrator on top | Predictable, testable, resumable. An agent that improvises cannot be resumed safely |
| Triggering | Cron only; events and cron | Both. Cron starts work, events react to outcomes | Reacts to quota and approvals in seconds |
| Autonomy | Always human approval; auto-publish; levels | Four levels set by policy (table below), default level 1 | Starts safe and earns trust with evidence |
| Topic supply | Admin enters every topic; planner agent proposes | Planner proposes, admin accepts, until the autonomy level allows auto-accept | Controls what is written about |
| Agent roles | One generalist; specialists | Specialist agents: planner, writer, metadata, image, critic | Cheaper models for simple steps, easier to test |
| Stop conditions | None; budgets and caps | Daily cap, weekly cap, budget cap, failure-rate stop | An automation without a stop is a risk |

## 3. Structure

| Part | Responsibility |
| --- | --- |
| Scheduler | Creates jobs from cron rules, respecting caps and the pause window |
| Event bus | Delivers events (`job.*`, `provider.*`, `approval.*`, `draft.*`) to subscribers |
| Policy engine | Evaluates rules such as "may this post auto-publish" or "should generation pause" |
| Notifier | Email, and later chat, for alerts and reports |
| Health watcher | Observes failure rate, quota state and approval delay, and applies protective actions |

## 4. Flow

1. **Plan.** At each scheduled time the scheduler checks caps, pause state and provider capacity. If clear, it takes an accepted topic, or asks the planner for suggestions, and queues a job.
2. **Produce.** The worker runs the pipeline (FD-1, FD-2) through the router (FD-4) with recovery (FD-5).
3. **Gate.** The policy engine decides what happens to the finished draft, by autonomy level (below).
4. **Decide.** Human approval through FD-3, or an automatic publish where policy allows.
5. **Learn.** Rejection reasons and improve feedback are stored and summarised into the planner and writer prompts as "avoid" notes, visible and editable by the admin.
6. **Protect.** The health watcher reacts to events: no capacity pauses the scheduler, recovery resumes it, a high rejection rate lowers the autonomy level.

| Level | Name | What runs without a human | Default |
| --- | --- | --- | --- |
| 0 | Manual | Nothing; admin starts every job |  |
| 1 | Supervised | Drafting and failover run alone; every post needs approval | Yes |
| 2 | Assisted | Topics auto-accepted from an allow-list; every post still needs approval |  |
| 3 | Trusted | Posts that pass every check and critic score of 9 or more publish after a delay window; admin can veto | Off |

## 5. Implementation

```ts
// policy rule examples, stored as data so admins can change them
const rules: Rule[] = [
  { on: 'provider.exhausted', if: (s) => s.capacity('text') === 0,    do: 'scheduler.pause', reason: 'no text capacity' },
  { on: 'provider.recovered', if: (s) => s.capacity('text') > 0,     do: 'scheduler.resume' },
  { on: 'approval.decided',   if: (s) => s.rejectRate7d > 0.4,         do: 'autonomy.lower', notify: true },
  { on: 'draft.ready_for_approval', if: (s, d) => s.level === 3 && d.criticScore >= 9 && d.validatorOk,
                                                                       do: 'publish.after', delayHours: 12 },
];

events.subscribe('*', async (e) => {
  for (const r of rules.filter((r) => r.on === e.type))
    if (r.if(await state.snapshot(), e.payload)) await actions[r.do](r, e);
});
```

Scheduler rule shape:

```json
{ "id": "weekday-posts", "cron": "0 9 * * 1-3", "timezone": "Asia/Colombo", "posts": 1,
  "categories": ["guides", "news"], "enabled": true }
```

## 6. Advanced control

| Control | Default | Effect |
| --- | --- | --- |
| `autonomy_level` | 1 | Which row of the table above applies |
| `auto_publish_delay_hours` | 12 | Level 3 veto window |
| `daily_post_cap`, `weekly_post_cap` | 1 and 3 | Hard limits on new jobs |
| `failure_rate_stop` | 30 percent over 10 jobs | Pauses the scheduler and alerts |
| `reject_rate_downgrade` | 40 percent over 7 days | Lowers autonomy by one level |
| `topic_allow_list` | Empty | Topics that Level 2 may accept alone |
| `quiet_hours` | None | No sends or publishes in these hours |
| Rules editor | Admin page | Add, disable or test a rule without code |

## 7. Automation hooks

How to grow the system without redesign:

- **New agent step:** add a step file and place it in the pipeline list; the orchestrator, retries and failover already cover it.
- **New channel:** subscribe a notifier to `approval.requested` (Slack, WhatsApp, push).
- **New content type:** add a pipeline definition (for example, newsletter) that reuses the router, jobs, approval and admin.
- **Outside control:** the admin API plus scoped tokens lets a separate agent or a script create topics, read reports or pause the system.
- **Dry run:** every rule can run in `simulate` mode that logs what it would do, so a new policy is tested before it acts.

## 8. Failure modes and acceptance

| Failure | Handling |
| --- | --- |
| Rule loop (an action triggers its own event) | Each rule has a cooldown and a per-hour action limit |
| Auto-publish of a bad post | Level 3 is off by default, has a delay window, and the reject-rate rule lowers the level |
| Scheduler keeps queuing while quota is empty | `provider.exhausted` pauses it; `provider.recovered` resumes it |
| Event lost | The recovery sweep in FD-5 re-derives state from the database, so events speed things up but are not required for correctness |

**Acceptance:** with all accounts exhausted, the scheduler pauses by itself and resumes by itself after a key is added or quota resets; at Level 1, nothing becomes public without an approval; lowering the level in the admin page takes effect on the next event.
