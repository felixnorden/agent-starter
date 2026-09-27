# AGENTS.md

This is a [Flue](https://flueframework.com) project: agents are TypeScript functions.

It is the `agents` package of a pnpm + Turborepo monorepo. The sibling
`packages/app` Worker reaches this Worker through the `AGENT` service
binding; this Worker is deployed first so that binding resolves.

Repo-wide setup and commands are in `../../README.md` and `../../AGENTS.md`.
The commands below run from inside `packages/agents`.

## Layout

- `src/agents/` — agent modules. A module whose first line is the `'use agent'` directive exports agents: every exported capitalized function is one, and the function name is its durable identity.
- `src/app.ts` — the route map; every route is mounted here explicitly.
- `src/cloudflare.ts` — Worker-level exports and non-HTTP handlers.
- `wrangler.jsonc` — Worker config; every agent needs a Durable Object migration entry.

## Commands

- `npx flue run src/agents/assistant.ts --message "Hi"` — run an agent locally, no server.
- `pnpm run dev` — start the dev server.
- `pnpm run deploy` — build and deploy the Worker.
- `pnpm run check:types` — typecheck.
- `pnpm run lint` — lint with oxlint.
- `pnpm run fmt` — rewrite files with oxfmt.
- `pnpm run fmt:check` — fail when a file is not formatted.
- `npx flue docs search <query>` — search the Flue docs from the terminal (then `flue docs read <path>`).
- `npx flue add` — list blueprints for adding channels, sandboxes, and databases.

The lint and format commands read `oxlint.config.ts` and `oxfmt.config.ts` at
the monorepo root.
