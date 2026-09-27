# AGENTS.md

`packages/app` — the RedwoodSDK Worker. It renders HTML and forwards chat
traffic to the `agents` package over the `AGENT` service binding.

Repo setup, ports, and the `.env` contract are in `../../README.md`.
Commands are in `../../AGENTS.md`.

## Read the docs locally

The docs ship inside the installed packages, so they match the pinned versions
exactly. Read them there instead of guessing from a website.

### RedwoodSDK — the framework this app is built on

`rwsdk/llms` exports the framework's own agent rules: markdown plus the file
globs each rule applies to. Run this from `packages/app`:

```sh
node --input-type=module -e "
import rules from 'rwsdk/llms';
for (const r of rules) console.log(r.name, '|', r.globs.join(', '));
"
```

Print a rule's markdown with `console.log(r.rule)`.

| Rule                     | Read it when                                                                 |
| ------------------------ | ---------------------------------------------------------------------------- |
| `rwsdk-react`            | Writing components. Covers server vs client components and server functions. |
| `rwsdk-request-response` | Handling requests and building responses.                                    |
| `rwsdk-interruptors`     | Guarding or redirecting requests in `worker.tsx`.                            |
| `rwsdk-middleware`       | Writing middleware.                                                          |

More RedwoodSDK sources:

- `node_modules/rwsdk/README.md` — framework overview.
- `node_modules/rwsdk/dist/runtime/entries/*.d.ts` — the exported API, per entry point.
- `node_modules/rwsdk/dist/scripts/*.mjs` — what each `rw-scripts` subcommand does.

### Everything else

| Path                                       | Holds                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `worker-configuration.d.ts`                | **Generated.** What `env` contains, such as `AGENT`. Never edit by hand — run `pnpm gen`.     |
| `node_modules/@flue/sdk/dist/index.d.mts`  | The agent client: `createFlueClient`, `send`, `read`, `history`, `observe`, `abort`.          |
| `node_modules/wrangler/config-schema.json` | Every valid `wrangler.jsonc` key.                                                             |
| `node_modules/@cloudflare/workers-types/`  | Worker runtime globals.                                                                       |
| `../../.agents/skills/`                    | Cloudflare skills. Gitignored and machine-local: `wrangler`, `durable-objects`, `cloudflare`. |

## How the code is arranged

- `src/worker.tsx` — `defineApp([...])`. Middleware and interruptors first, then
  routes. `/api/agent/:conversationId` talks to the Assistant agent.
- `src/app/pages/starter.tsx` — the landing page. `src/app/document.tsx` — the HTML shell.
- `src/app/styles.css` — global Tailwind stylesheet and design tokens.
- `src/app/headers.ts` — shared response headers.
- `@/*` resolves to `./src/*`. See `tsconfig.json` `paths`.
- `vite.config.mts` — `cloudflare()` before `redwood()`. Keep that order.

Every component is a server component unless its file starts with `"use client"`.

## Styling

Tailwind CSS v4 runs through `@tailwindcss/vite`.

- `src/app/styles.css` is the one global stylesheet. It holds
  `@import "tailwindcss";`, the `@source "../"` scan root, and the `@theme`
  design tokens.
- `document.tsx` imports it as `./styles.css?url` and links it in `<head>`.
  Import global CSS with `?url` and link it. A plain
  `import "./styles.css"` in a server component emits no stylesheet.
- `@theme static` keeps every token in the output, so `class="bg-brand"` and
  `var(--color-brand)` both work.
- The landing page uses Tailwind utilities only. CSS Modules still work: name a file `*.module.css` and import it from a component.

## Rules

- Run `pnpm gen` after any `wrangler.jsonc` change. It rewrites
  `worker-configuration.d.ts`. It needs no Cloudflare account.
- `send()` returns an admission, not the reply. Call `read(admission)` to await
  the settlement and get the reply, or `history()` for the snapshot.
- The app reaches the agents Worker only through `env.AGENT`. The URL origin
  is a placeholder; only the pathname selects a route.
- Reuse one `conversationId` to continue a conversation. A new id starts a new
  agent instance with empty history.
- The agents Worker must be running for the binding to resolve locally. `pnpm dev`
  starts both.
- Add design tokens to `@theme` in `src/app/styles.css`. Tailwind v4 configures
  in CSS: do not add `tailwind.config.js`.
- `@tailwindcss/vite` sits after `redwood()` in `vite.config.mts`. Keep
  `cloudflare()` before `redwood()`.
