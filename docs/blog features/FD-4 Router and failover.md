# FD-4 Provider router and failover

This document settles how every AI call picks an account and model, and how the system switches when quota, rate limits or keys fail.

## 1. Purpose and traceability

| Item            | Value                                                                           |
| --------------- | ------------------------------------------------------------------------------- |
| Requirements    | FR-7 (automatic account and model switching), NFR-3 (key safety), NFR-4 (audit) |
| Owner component | Provider router, a library used by the worker                                   |
| Inputs          | A capability (`text` or `image`), a step name, the prompt                       |
| Output          | The model result, or a classified failure that tells the worker what to do next |

Provider terms: free tiers usually forbid or limit running several accounts to avoid quotas. Treat multi-account switching as a feature to enable only where each provider allows it, and design the pool so paid keys and extra models can be added later with no code change.

## 2. Decisions

| Decision              | Options considered                                 | Choice                                                                              | Why                                          |
| --------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------- |
| Where switching lives | Inside each agent; one shared router               | One router in front of every call                                                   | One place for quota rules, logs and tests    |
| Provider abstraction  | Call each SDK directly; one adapter interface      | Adapter per provider behind one interface                                           | New provider is one file                     |
| Switch order          | Round robin; fixed priority; scored                | Scored: capability match, health, remaining quota, priority, then preferred model   | Spreads load and avoids dead accounts        |
| Quota knowledge       | Wait for errors; track usage ourselves plus errors | Both. Local counters pre-empt, provider errors are the truth                        | Avoids wasted failing calls                  |
| Reset times           | Guess; read headers; fixed schedule per provider   | Use provider headers when present, else configured reset (for example midnight UTC) | Needed to set `resume_at`                    |
| Failure memory        | None; circuit breaker                              | Circuit breaker per account and per model                                           | Stops hammering a dead target                |
| Key storage           | Environment file; encrypted table                  | Encrypted `provider_accounts`, master key from a secrets manager                    | Rotatable from the admin page, never in logs |

## 3. Structure

| Part          | Responsibility                                                                |
| ------------- | ----------------------------------------------------------------------------- |
| Adapter       | Translates one provider's request, response and errors to the common shape    |
| Registry      | Loads `provider_accounts`, models and limits into memory, refreshed on change |
| Scorer        | Ranks eligible leases for a call                                              |
| Lease manager | Reserves an account and model for one call, records usage                     |
| Classifier    | Maps provider errors to the error classes in the Master design, section 7.2   |
| Breaker       | Opens, half-opens and closes per account and model                            |
| Reporter      | Writes `usage_events` and `audit_log`, raises alerts                          |

## 4. Flow

1. The worker calls `router.run(step, input, opts)` with a capability.
2. The registry returns eligible leases: right capability, `ACTIVE`, not in cooldown, breaker closed, local quota left.
3. The scorer picks the best lease. The lease manager reserves it and the adapter makes the call.
4. Success: usage is recorded and the result returns.
5. Failure: the classifier decides the action.
   - Rate limit: cooldown for the retry-after time, next lease now.
   - Quota exhausted: account `EXHAUSTED` until `reset_at`, next lease.
   - Bad key: account `DISABLED`, alert, next lease.
   - Server error or timeout: two retries with backoff, then next model, then next provider.
   - Output invalid: one retry, then next model.
6. The same step is retried with the new lease. The prompt and idempotency key are unchanged, so the result is the same kind of output.
7. No lease left: the router throws `NoCapacity(resumeAt)`. FD-5 parks the job as `WAITING_QUOTA`.

## 5. Implementation

```ts
interface ProviderAdapter {
  name: string;
  capabilities: Array<"text" | "image">;
  call(req: AdapterRequest, key: string, model: string): Promise<AdapterResponse>;
  classify(err: unknown): ErrorClass; // RATE_LIMIT | QUOTA | AUTH | SERVER | CONTEXT | SAFETY | BAD_OUTPUT
}

async function run(step, input, opts) {
  for (let hops = 0; hops < MAX_SWITCHES; hops++) {
    const lease = await leases.acquire(step.capability, opts.exclude);
    if (!lease) throw new NoCapacity(await registry.earliestReset(step.capability));
    try {
      const res = await lease.adapter.call(build(step, input), lease.key, lease.model);
      await usage.record(lease, res, "ok");
      return parse(step.schema, res);
    } catch (e) {
      const cls = lease.adapter.classify(e);
      await health.apply(lease, cls, e); // cooldown, exhausted, disabled, breaker
      opts.exclude.push(lease.id);
    }
  }
  throw new SwitchLimit();
}
```

The account row carries the state the scorer needs:

| Column                                   | Meaning                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| `status`                                 | `ACTIVE`, `COOLDOWN`, `EXHAUSTED`, `DISABLED`                           |
| `cooldown_until`, `reset_at`             | When the router may use it again                                        |
| `daily_limit`, `used_today`, `rpm_limit` | Local pre-checks                                                        |
| `models`                                 | Ordered list with context size and capability per model                 |
| `priority`, `tier`                       | `free` or `paid`, used to prefer free first and paid as the last resort |

## 6. Advanced control

| Control                    | Where                            | Effect                                             |
| -------------------------- | -------------------------------- | -------------------------------------------------- |
| Add, disable, rotate a key | Admin page, providers tab        | Pool changes at once, no deploy                    |
| Model order per step       | `site_settings.model_preference` | Cheap model for outline, stronger one for sections |
| `prefer_free_first`        | Setting                          | Paid accounts are used only when free ones are out |
| `monthly_budget_cap`       | Setting                          | Paid spend stops at the cap; jobs wait instead     |
| `max_switches_per_job`     | Setting, default 8               | Prevents endless loops                             |
| Manual cooldown or reset   | Admin button                     | Overrides health state after a provider incident   |
| Dry-run test call          | Admin button                     | One tiny call to confirm a key works               |

## 7. Automation hooks

- Event `provider.exhausted` and `provider.recovered` let FD-7 pause or resume scheduled generation.
- A health probe job sends one tiny call to each cooled-down account when its `reset_at` passes, so accounts return to `ACTIVE` without waiting for a real job.
- Usage events feed a daily report: tokens per account, switches per job, cost per published post.

## 8. Failure modes and acceptance

| Failure                                         | Handling                                                          |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| Provider returns quota error with no reset time | Use the configured reset rule and mark `reset_estimated`          |
| Provider changes a model name                   | Call fails as `NOT_FOUND`; model is disabled and an alert is sent |
| All free accounts exhausted                     | `NoCapacity`; job waits, or uses a paid key if allowed            |
| Local counter wrong                             | Provider error corrects it; counters self-heal on reset           |

**Acceptance:** with a mock provider scripted to fail with 429, quota, 401 and 500 in turn, the router switches each time, the job still finishes, and every switch appears in `audit_log` with account, model and reason.
