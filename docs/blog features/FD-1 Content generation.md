# FD-1 Content generation agent

This document settles how the writing agent turns a topic into a validated draft, and how it takes admin feedback into a new version.

## 1. Purpose and traceability

| Item            | Value                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------- |
| Requirements    | FR-1 (generate text), FR-3 (save as pending), FR-6 (improve loop), NFR-6 (quality checks)   |
| Owner component | Writer agent inside the worker (see Master design, section 5)                               |
| Inputs          | Topic, keyword, site settings, brand voice profile, optional admin feedback                 |
| Output          | A validated post version in `posts` and its steps in `job_steps`, status `PENDING_APPROVAL` |

## 2. Decisions

| Decision               | Options considered                          | Choice                                                                                              | Why                                                                                                 |
| ---------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Generation strategy    | One long call; outline then sections        | Outline, then one call per section                                                                  | A quota failure loses one section, not the article. Each section is a checkpoint                    |
| Output format          | Free text; strict JSON for everything       | JSON for metadata, markdown for section bodies                                                      | JSON is checkable by schema; long prose in JSON breaks easily                                       |
| Prompt storage         | In code; in the database                    | Versioned `prompt_templates` table                                                                  | Admin tunes tone and rules without a deploy, and every post records the prompt version that made it |
| Facts and claims       | Trust the model; ban all claims             | Writer marks unverifiable claims as `needs_source`; validator blocks invented statistics and quotes | Keeps posts useful without fabricated numbers                                                       |
| Duplicate control      | Title match only; embeddings                | Title and keyword trigram match in v1, embedding similarity later                                   | Cheap and good enough at low volume                                                                 |
| Pre-admin quality gate | Send everything to admin; self-review first | Critic agent scores the draft; one automatic rewrite if below threshold                             | Admin sees fewer weak drafts. Capped at one rewrite to protect free quota                           |
| Improve behaviour      | Always regenerate everything; patch         | Regenerate only the sections the feedback names; full rewrite when feedback is general              | Saves tokens and keeps what the admin already liked                                                 |

## 3. Structure

| Part           | Responsibility                                                    | Reads                               | Writes                               |
| -------------- | ----------------------------------------------------------------- | ----------------------------------- | ------------------------------------ |
| Topic planner  | Picks the next topic, rejects duplicates                          | `topics`, published titles          | `topics`, job row                    |
| Prompt builder | Fills the template with topic, voice profile, limits and feedback | `prompt_templates`, `site_settings` | Prompt text, prompt version          |
| Writer agent   | Produces outline, then each section                               | Prompt, previous sections           | `job_steps` (`outline`, `section_n`) |
| Metadata agent | Title, slug, excerpt, tags, SEO fields, image prompt              | Full draft                          | `job_steps` (`meta`)                 |
| Validator      | Rule checks in code, no AI                                        | Assembled post                      | Pass or a list of violations         |
| Critic agent   | Scores clarity, depth, originality, tone against a rubric         | Assembled post                      | Score and short notes                |
| Version store  | Keeps every version and its feedback                              | All of the above                    | `posts`, `post_versions`             |

## 4. Flow

1. The planner claims a topic and the job starts at step `outline`.
2. The prompt builder loads the active template version and site settings, then the writer returns an outline as JSON (headings, key points, target words per section).
3. For each outline item the writer returns the section markdown. Each section is saved before the next call.
4. The assembler joins sections and the metadata agent adds title, slug, excerpt, tags and the image prompt.
5. The validator runs. Violations that code can fix (slug clash, heading level) are fixed in code; the rest go back to the writer once.
6. The critic scores the post. Below the threshold, the writer rewrites the weakest sections once, then the post continues regardless and the score is shown to the admin.
7. The post is saved as `PENDING_APPROVAL` and FD-3 sends the approval request.
8. On Improve, steps 2 to 7 run again for the sections named in the feedback, creating version n+1.

## 5. Implementation

Every agent call goes through the router in FD-4, never straight to a provider. A step is a plain object, so adding a step is adding a file.

```ts
interface AgentStep<I, O> {
  name: string; // 'outline' | 'section' | 'meta' | 'critic'
  capability: "text";
  schema: z.ZodType<O>; // output is rejected unless it parses
  build(input: I, ctx: JobContext): Prompt;
}

const out = await router.run(step, input, {
  jobId,
  idempotencyKey: `${jobId}:${step.name}:${version}`,
});
```

The prompt template stores these fields, so one row fully reproduces a post:

| Field                  | Example                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `version`              | 7                                                              |
| `system`               | Role, voice rules, banned patterns                             |
| `outline_instructions` | Heading count, target length, audience                         |
| `section_instructions` | Per-section rules, no invented facts                           |
| `model_preference`     | Per step: cheap model for outline, stronger model for sections |
| `active`               | Only one active version per site                               |

## 6. Advanced control

All values live in `site_settings` and are editable from the admin page (FD-6) without a deploy.

| Setting                          | Default                              | Effect                                      |
| -------------------------------- | ------------------------------------ | ------------------------------------------- |
| `target_words`                   | 900 to 1400                          | Validator range and prompt length hint      |
| `language`, `audience`, `tone`   | English, general, clear and friendly | Goes into the system prompt                 |
| `blocked_topics`, `banned_terms` | Empty lists                          | Planner and validator reject matches        |
| `critic_threshold`               | 7 of 10                              | Below it, one automatic rewrite             |
| `max_improve_rounds`             | 3                                    | After that the admin edits by hand          |
| `prompt_version_pin`             | Latest active                        | Pin to roll back a bad prompt               |
| `require_sources_for_claims`     | On                                   | Unsourced claims are flagged in the preview |

## 7. Automation hooks

- Events emitted: `draft.step_completed`, `draft.validation_failed`, `draft.ready_for_approval`. FD-7 subscribes to these.
- Planner can propose new topics from gaps in published categories and from rejected-post reasons, stored in `topics` as `SUGGESTED` for admin accept or auto-accept (FD-7 policy).
- Internal link suggestions are added by matching the draft against published titles; this is a step, not a rewrite.

## 8. Failure modes and acceptance

| Failure                                    | Handling                                                     |
| ------------------------------------------ | ------------------------------------------------------------ |
| Output does not parse as the schema        | One retry on the same model, then FD-4 switches model        |
| Section too short or off-topic             | Regenerate that section only                                 |
| Critic or validator unavailable (no quota) | Skip the critic, flag `critic_skipped`, continue to approval |
| Same topic queued twice                    | Planner rejects the second                                   |

**Acceptance:** 10 consecutive topics produce posts inside the word range with zero schema failures reaching the admin; an Improve on one section changes that section only.
