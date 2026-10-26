# AGENTS.md

`packages/app` is the RedwoodSDK Worker. It renders HTML and calls the agents
Worker through the `AGENT` service binding.

Read `../../README.md` for setup, commands, and the route contract.

## Read the framework docs locally

The installed packages carry their own agent docs, so they match the pinned
versions. Read them there, not from a website.

`rwsdk/llms` exports the RedwoodSDK rules, each with the file globs it applies
to. List them from `packages/app`:

```sh
node --input-type=module -e "import r from 'rwsdk/llms'; for (const x of r) console.log(x.name, '|', x.globs.join(', '))"
```

Read one rule's markdown with `console.log(x.rule)`.

| Rule                     | Read it for                              |
| ------------------------ | ---------------------------------------- |
| `rwsdk-react`            | Components, server and client boundaries |
| `rwsdk-request-response` | Request handling and response building   |
| `rwsdk-interruptors`     | Guards and redirects in `worker.tsx`     |
| `rwsdk-middleware`       | Middleware                               |

Agent client types: `node_modules/@flue/sdk/dist/index.d.mts`.

## Rules

- Import global CSS with `?url` and link it. A plain `import "./styles.css"` in
  a server component emits no stylesheet.
- Add Tailwind v4 tokens to `@theme` in `src/app/styles.css`. There is no
  `tailwind.config.js`.
- Keep `cloudflare()` before `redwood()` in `vite.config.mts`, and
  `@tailwindcss/vite` after `redwood()`.
- Parse query strings with the Schemas in `src/lib/agent-query.ts`, never by
  hand. A bad parameter then fails at the app edge with 400.
