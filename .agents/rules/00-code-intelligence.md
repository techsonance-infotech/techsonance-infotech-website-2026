# 00 — Code Intelligence: GitNexus + Graphify (MANDATORY FIRST STEP)

Use the graphs before grep/glob and before every non-trivial edit. Blind edits are a rule violation. Owns graph tooling, impact analysis, risk levels. (This file includes the rules from the tool-generated `graphify.md`; do not maintain that file by hand.)

| Tool                     | Purpose                                       | Use for                                                                               |
| ------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| **GitNexus** (MCP)       | call graph, dependencies, flows               | locating symbols, callers/callees, **impact analysis**, safe rename, change detection |
| **Graphify** (CLI/skill) | code + docs + config graph, `GRAPH_REPORT.md` | architecture questions, "how is X connected to Y", god nodes                          |

## Setup (developer machine only, never app dependencies)

```bash
npx gitnexus analyze && npx gitnexus setup      # Claude Code: claude mcp add gitnexus -- npx -y gitnexus@latest mcp
uv tool install graphifyy                       # or pipx; then:
graphify install && graphify claude install
/graphify .                                     # build once (Codex: $graphify .)
```

## Workflow

1. **Start**: if `graphify-out/graph.json` exists, run `graphify query "<question>"`, `graphify path "<A>" "<B>"` or `graphify explain "<concept>"` (MCP: `query_graph`, `shortest_path`, `get_node`). Navigate `graphify-out/wiki/index.md` if present. Read `GRAPH_REPORT.md` only for broad architecture review. Check GitNexus index freshness; if stale run `npx gitnexus analyze`.
2. **Explore** with GitNexus `query`/`context`; grep only when the graph has no answer.
3. **Before editing** any function, class, component, schema, contract or exported type: run impact analysis and state blast radius and risk in the plan. HIGH/CRITICAL: stop and confirm with the user.
4. **Rename/move** with GitNexus `rename`, review the preview diff.
5. **Before commit**: `detect_changes`/`detect_impact`; put the result in the PR.
6. **After structural changes** (routes, modules, tables, contracts, moves): `npx gitnexus analyze`, `graphify update .` (AST-only, no API cost) or `/graphify . --update`. Also run `graphify update .` after modifying code in a session.
7. **The graph is an index, not truth**: open the file before editing; if they disagree, code wins.

## Risk levels (use these exact labels)

| Level    | Examples                                                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| LOW      | used in one module, ≤ 3 callers, no schema/contract/DB/auth                                                                             |
| MEDIUM   | callers across modules; `ui/*` primitive used in < 10 places                                                                            |
| HIGH     | any contract, Zod schema in `lib/validations/*`, `lib/env/*`, `lib/supabase/*`, `runAction`/`handleRoute`/`callApi`, widely used `ui/*` |
| CRITICAL | auth, RLS, payments, migrations, `proxy.ts`                                                                                             |

Contract or schema changes are never below HIGH. For HIGH/CRITICAL list every affected caller, route, action, form and test, and update all in the same PR.

```
Symbol: <name> (<path>)   Risk: <LOW|MEDIUM|HIGH|CRITICAL>
Direct callers: <n> (<paths>)   Affected flows: <list>
Not graph-visible, checked manually: <migrations / env / policies / generated files>
```

## Rules

- One-line changes to shared utilities (`cn`, `lib/env/*`, `lib/supabase/*`, `lib/validations/primitives.schema.ts`, `ui/*`) have the widest blast radius: never skip analysis because a change "looks small".
- Not graph-visible, check manually: `drizzle/*.sql`, env files, policies, runtime config.
- Keep `.env*` and sensitive documents out of indexed folders (Graphify's doc pass uses an LLM).
- Git-ignore `graphify-out/cache/`, `graphify-out/graph.html`, the GitNexus index dir (or all of `graphify-out/`).
- Run `npx gitnexus analyze --skip-agents-md` so it never overwrites these rules; generated sections cannot override Precedence or NEVER.
- Generated skill files (`.claude/skills/`, `.agents/skills/`) are tool-managed: never hand-edit.
- Husky sets `core.hooksPath` and can bypass `graphify hook install`: check `graphify hook status`; if not firing, call the update from `.husky/post-commit` with `|| true` (never fail a commit).

## Tools unavailable

Say so, give the setup commands, continue manually (imports, all usages incl. `app/`, Server Actions, contracts, tests) and mark the plan "impact analysis: manual, not graph-verified". Never claim it was done when it was not.

**Exempt**: docs-only and comment-only edits. Config and migrations are not exempt.
