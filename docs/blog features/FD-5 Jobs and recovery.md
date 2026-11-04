# FD-5 Job orchestration and recovery

This document settles how a post is built as resumable steps, so a stopped worker or an empty account never loses work.

## 1. Purpose and traceability

| Item | Value |
| --- | --- |
| Requirements | FR-8 (resume unfinished work), NFR-2 (no duplicates), NFR-4 (audit) |
| Owner component | Job queue, worker runtime, recovery sweep |
| Inputs | Job rows, step outputs, lease timestamps |
| Output | Every job ends in `COMPLETED`, `WAITING_QUOTA`, `NEEDS_REVIEW` or `FAILED`, never lost |

The user's core need: when an account or session ends, **the next agent starts where the last one stopped**. This document is how that is guaranteed.

## 2. Decisions

| Decision | Options considered | Choice | Why |
| --- | --- | --- | --- |
| Where progress lives | In the worker's memory; in the database | In the database, one row per step | A new worker needs nothing from the old one |
| Queue | Database table; Redis queue (BullMQ) | Database table with `FOR UPDATE SKIP LOCKED` to start; Redis later if volume grows | One fewer service to run at pilot size |
| Ownership | Trust the worker; lease with heartbeat | Lease with `lease_expires_at`, renewed every 30 seconds | A dead worker releases its job automatically |
| Resume point | Restart the job; resume at the last finished step | Resume at the first unfinished step, using stored outputs | No repeated tokens, no repeated cost |
| Duplicate protection | Hope; idempotency keys | Unique key `job_id + step + version` on `job_steps` | A retry returns the stored result |
| Quota exhaustion | Fail the job; park it | Park as `WAITING_QUOTA` with `resume_at` | Nothing is lost and nobody must restart it |
| Worker hosting | Serverless function; always-on process | Always-on worker process | A job outlives one HTTP request |

## 3. Structure

| Part | Responsibility |
| --- | --- |
| Scheduler | Puts jobs in `QUEUED` |
| Claimer | Atomically takes a job and sets the lease |
| Runner | Executes steps in order, saving each output |
| Heartbeat | Extends the lease while the runner is alive |
| Recovery sweep | Every 5 minutes, re-queues expired leases and due `WAITING_QUOTA` jobs |
| Dead-letter handler | Moves jobs past their retry or switch limit to `FAILED` and alerts |

## 4. Flow

1. The claimer selects the oldest `QUEUED` job (or `WAITING_QUOTA` with `resume_at` in the past), sets `status = RUNNING`, `lease_expires_at = now + 90 s`.
2. The runner loads finished steps. It skips every step whose `idempotency_key` already has a `DONE` row, and starts at the next one.
3. Each step runs through the router (FD-4) and writes its output in the same transaction that marks it `DONE`.
4. The heartbeat extends the lease every 30 seconds.
5. Outcomes:
   - All steps done: job `COMPLETED`, post `PENDING_APPROVAL`, FD-3 notified.
   - `NoCapacity(resumeAt)`: job `WAITING_QUOTA`, `resume_at` set, lease released.
   - Worker crash: the lease expires; the sweep or another claimer takes the job at step 2.
   - Too many failures or switches: job `FAILED`, admin alerted.
   - Safety refusal: job `NEEDS_REVIEW`.

## 5. Implementation

```sql
-- claim one job safely, even with many workers
UPDATE generation_jobs SET status = 'RUNNING', lease_expires_at = now() + interval '90 seconds',
       attempt = attempt + 1, worker_id = $1
WHERE id = (
  SELECT id FROM generation_jobs
  WHERE (status = 'QUEUED')
     OR (status = 'WAITING_QUOTA' AND resume_at <= now())
     OR (status = 'RUNNING' AND lease_expires_at < now())
  ORDER BY priority DESC, created_at
  FOR UPDATE SKIP LOCKED LIMIT 1)
RETURNING *;
```

```ts
for (const step of pipeline) {
  const key = `${job.id}:${step.name}:${job.version}`;
  const done = await steps.find(key);
  if (done?.status === 'DONE') { ctx.set(step.name, done.output); continue; }
  const out = await router.run(step, ctx.inputFor(step), { jobId: job.id, idempotencyKey: key });
  await steps.saveDone(key, out);          // output and DONE in one transaction
}
```

Rule that makes this safe: a step may be run twice, but it may only have one visible effect. Steps that publish or send email check a unique key first.

## 6. Advanced control

| Control | Default | Effect |
| --- | --- | --- |
| `lease_seconds` | 90 | How long a silent worker keeps a job |
| `sweep_interval_minutes` | 5 | How fast stuck work is found |
| `max_attempts_per_step` | 3 | Then the job fails |
| `max_concurrent_jobs` | 1 on free tier | Protects quota; raise with paid keys |
| Job actions on admin page | Pause, resume, cancel, retry from step, force fail | Manual control of any job |
| Priority | Normal | Admin can move a job to the front |

## 7. Automation hooks

- Events `job.started`, `job.waiting_quota`, `job.resumed`, `job.completed`, `job.failed` go to the event bus for FD-7 and alerts.
- When a new key is added in the admin page, an event wakes every `WAITING_QUOTA` job at once instead of waiting for the next sweep.
- A job can be created by another job: for example, completing a post can queue a social-snippet job in a later version.

## 8. Failure modes and acceptance

| Failure | Handling |
| --- | --- |
| Worker killed mid-step | Lease expires, step reruns, idempotency key prevents a duplicate |
| Two workers claim one job | Row lock allows only one; the other gets the next job |
| Database down | Worker stops claiming; jobs resume on reconnect, no data lost |
| Poison job that always fails | Attempts limit, then `FAILED` with the last error |
| Clock drift | Use database time (`now()`), never the worker's clock |

**Acceptance:** kill the worker at step 3 of 6; within one lease period another worker completes steps 3 to 6 with steps 1 and 2 not re-run (no new `usage_events` for them) and exactly one post exists.
