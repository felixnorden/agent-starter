# app-starter

A pnpm + Turborepo monorepo with two Cloudflare Workers:

- `packages/app` is the RedwoodSDK application.
- `packages/agents` holds the [Flue](https://flueframework.com) agents.

The app Worker calls the agents Worker through the `AGENT` service binding.
No public URL sits between them.

`AGENTS.md` is the short version of this file, written for coding agents.
`packages/app/AGENTS.md` and `packages/agents/AGENTS.md` cover those two packages.

## Start here

1. **Create a repository.** Click **Use this template** on GitHub, or clone this
   repository and replace `.git` with an empty one.

2. **Install.** Node.js 22.20.0 or later and pnpm are required. `.nvmrc` pins the
   Node version, and `packageManager` in `package.json` pins pnpm, so Corepack
   installs the right one.

   ```sh
   pnpm install
   ```

3. **Rename the two Workers.** One command rewrites both `wrangler.jsonc` files,
   the three `package.json` names, the Worker names in the Markdown docs, and the
   generated types. Then it deletes itself.

   ```sh
   pnpm init:template my-app          # Workers: my-app and my-app-agents
   ```

   It leaves the Assistant agent alone. Renaming an agent changes its Durable
   Object class name, which needs a `renamed_classes` migration in
   `packages/agents/wrangler.jsonc`.

4. **Choose a model.** The default is Workers AI. It needs no API key, and it
   bills the Cloudflare account you export below. For a keyed provider instead,
   copy the env file and set `AGENT_MODEL`.

   ```sh
   cp packages/agents/.env.example packages/agents/.env
   ```

5. **Start both Workers.**

   ```sh
   pnpm dev
   ```

   App: <http://localhost:5173>. Agents: <http://localhost:5174>.

For the default Workers AI model, export your account id in every shell that runs
`pnpm dev` or a deploy. A keyed provider needs no Cloudflare account for
`pnpm dev`. See [Which credential is required](#which-credential-is-required).

```sh
export CLOUDFLARE_ACCOUNT_ID=<your account id>     # npx wrangler whoami
```

## Layout

```txt
.
├─ AGENTS.md                       # short repo summary for coding agents
├─ .github/workflows/ci.yml        # typecheck + build; needs no account
├─ .pi/settings.json               # project Pi settings; loads after trust
├─ LICENSE                         # MIT
├─ oxfmt.config.ts                 # formatter config; shared by both packages
├─ oxlint.config.ts                # linter config; shared by both packages
├─ skills-lock.json                # pinned skill sources for pnpm skills:sync
├─ scripts/
│  ├─ init-template.mjs            # renames the Workers; deletes itself
│  └─ require-account.mjs          # blocks dev/deploy without an account
├─ packages/
│  ├─ app/                         # RedwoodSDK Worker (port 5173, "app-starter")
│  │  ├─ AGENTS.md                 # where this package's docs live
│  │  ├─ src/worker.tsx            # route map; mounts /api/agent/:conversationId
│  │  └─ wrangler.jsonc            # declares the AGENT service binding
│  └─ agents/                      # Flue Worker (port 5174, "app-starter-agents")
│     ├─ .env.example              # Worker runtime vars; copy to .env
│     ├─ AGENTS.md                 # how agents work in this package
│     ├─ src/agents/assistant.ts   # the Assistant agent
│     ├─ src/app.ts                # agent route map
│     └─ wrangler.jsonc            # AI binding + Durable Object migrations
├─ turbo.json
└─ pnpm-workspace.yaml
```

## Prerequisites

- Node.js 22.20.0 or later, pinned in `.nvmrc`. The `skills` CLI requires it.
- pnpm, pinned by `packageManager` in `package.json`. Corepack reads that field.
- A Cloudflare account when the model is Workers AI, or when you deploy. The
  [quickstart](#start-here) covers both cases.

`.agents/skills/` is gitignored, so a clone has none of the design or Cloudflare
skills. See [Skills](#skills) for the check and the restore command.

To avoid needing a Cloudflare account at all, set `AGENT_MODEL` in
`packages/agents/.env` to a keyed provider and add that provider's key. See
[Which credential is required](#which-credential-is-required).

## Commands

Commands that can reach Cloudflare run `scripts/require-account.mjs` first. The
rest need no account.

| Command                     | Does                                                                  | Needs an account |
| --------------------------- | --------------------------------------------------------------------- | ---------------- |
| `pnpm dev`                  | Starts both Workers. App on 5173, agents on 5174.                     | yes              |
| `pnpm gen`                  | Regenerates `packages/app/worker-configuration.d.ts`.                 | no               |
| `pnpm build`                | Builds both Workers into `packages/*/dist`.                           | no               |
| `pnpm check`                | Typechecks, lints, and format-checks the repo.                        | no               |
| `pnpm lint`                 | Lints both packages and the root files with oxlint.                   | no               |
| `pnpm fmt`                  | Rewrites both packages and the root files with oxfmt.                 | no               |
| `pnpm fmt:check`            | Fails when a file is not formatted.                                   | no               |
| `pnpm deploy:agents`        | Deploys the agents Worker.                                            | yes              |
| `pnpm deploy:app`           | Deploys the app Worker.                                               | yes              |
| `pnpm clean`                | Removes `dist`, `.turbo`, and the Vite cache.                         | no               |
| `pnpm skills:sync`          | Restores `.agents/skills` from `skills-lock.json`.                    | no               |
| `pnpm skills:check`         | Fails when a locked skill is missing from `.agents/skills`.           | no               |
| `pnpm init:template <name>` | Renames both Workers for a new project. Run once, from a fresh clone. | no               |

To run one agent with no server, use the Flue CLI from its package:

```sh
pnpm --filter ./packages/agents exec flue run src/agents/assistant.ts --message "Hi"
```

## Skills

`.agents/` is gitignored and `skills-lock.json` is committed, so a fresh clone
has the lock file and none of the skills. Check first, then restore only when
something is missing:

```sh
pnpm skills:check     # exits 1 and names what is missing
pnpm skills:sync      # only when the check fails
```

The restore is expensive. It clones one GitHub repository per skill and submits
each one to third-party security scanners, so five skills took over a minute in
testing. `pnpm install` deliberately skips it, so installs stay fast and work
offline, and `pnpm skills:check` tells you when the restore is needed.

`skills` is a devDependency, so its version is pinned and `pnpm skills:sync`
needs no global install. Pi discovers `.agents/skills/` by itself, so nothing
else is required.

## Environment

`packages/agents/.env` is the only env file. It holds the Worker runtime
variables, and Vite loads it for `pnpm dev` and `flue run`.

| Variable             | Purpose                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `AGENT_MODEL`        | Which model the agent uses. Unset means the Workers AI fallback. |
| `OPENROUTER_API_KEY` | Key for an `openrouter/...` model.                               |
| `OPENCODE_API_KEY`   | Key for `opencode/...` and `opencode-go/...`.                    |

It is gitignored and ships a committed `.example`.

### Which credential is required

The requirement follows the configured model. `pnpm dev` and the `deploy:*`
scripts run `scripts/require-account.mjs` first, and it exits with an error when
the value that model needs is missing.

| `AGENT_MODEL`                                           | Required                                        |
| ------------------------------------------------------- | ----------------------------------------------- |
| unset, or `cloudflare/...`                              | `CLOUDFLARE_ACCOUNT_ID`, exported in your shell |
| `openrouter/...`                                        | `OPENROUTER_API_KEY`                            |
| `opencode/...`, `opencode-go/...`                       | `OPENCODE_API_KEY`                              |
| `anthropic/...`, `openai/...`, `gemini/...`, `groq/...` | the matching key                                |

The two `deploy:*` scripts always require the Cloudflare account, because the
deploy itself reaches Cloudflare whatever the model is. A keyed provider needs
no Cloudflare account for `pnpm dev`.

`pnpm build`, `pnpm check`, `pnpm gen`, and `pnpm skills:sync` require nothing.

The Cloudflare account comes from your shell, never from a file. Wrangler would
otherwise use whichever account happens to be logged in on the machine, and
nothing in a repository should decide that.

### Why Workers AI needs an account for local dev

`packages/agents/wrangler.jsonc` declares an `ai` binding. Workers AI has no
local implementation, so the Cloudflare Vite plugin opens a remote session at
dev startup, before any model call. That session needs a valid account even if
the agent never runs.

`packages/agents/vite.config.ts` therefore disables the plugin's `remoteBindings`
in dev whenever the configured model does not use Workers AI. A keyed provider
then boots with no Cloudflare account at all. Builds keep the binding, so
deploying is unaffected.

The rule that reads the model lives in `packages/agents/model-config.ts`, which
both the Vite config and the guard import.

Turbo filters the environment it hands to tasks, so `CLOUDFLARE_ACCOUNT_ID` and
`CLOUDFLARE_API_TOKEN` are listed in `globalPassThroughEnv` in `turbo.json`.
Turbo never reads a `.env` file itself. Remove those entries and the guard still
passes, while wrangler silently loses the account.

## Choosing a model

The Assistant agent reads `AGENT_MODEL`. Set it in `packages/agents/.env`:

```sh
AGENT_MODEL=openrouter/moonshotai/kimi-k2.6      # needs OPENROUTER_API_KEY
AGENT_MODEL=opencode/claude-sonnet-4-6           # needs OPENCODE_API_KEY
AGENT_MODEL=opencode-go/claude-sonnet-4-6        # needs OPENCODE_API_KEY
AGENT_MODEL=cloudflare/@cf/moonshotai/kimi-k2.6  # needs no key
```

`OPENCODE_API_KEY` covers both OpenCode Zen (`opencode`) and OpenCode Go
(`opencode-go`). Any specifier listed in
<https://flueframework.com/models.json> works.

Leave `AGENT_MODEL` unset to use the Workers AI fallback,
`cloudflare/@cf/moonshotai/kimi-k2.6`. It needs no API key, and it bills the
Cloudflare account you exported. Workers AI is always remote, so that account is
required for `pnpm dev` too.

A keyed provider needs no Cloudflare account, locally or deployed.

For a deployed Worker, `AGENT_MODEL` is a var and each key is a secret:

```sh
export CLOUDFLARE_ACCOUNT_ID=<your account id>
npx wrangler secret put OPENROUTER_API_KEY -c packages/agents/wrangler.jsonc
```

## Develop

Start both Workers together:

```sh
pnpm dev
```

- App: <http://localhost:5173>
- Agents: <http://localhost:5174>

Send a message through the app, which forwards it to the agent over the binding:

```sh
curl -X POST http://localhost:5173/api/agent/demo-1 \
  -H 'content-type: application/json' \
  -d '{"message":"Say hi in three words."}'
```

The response is a Flue admission. Reuse `demo-1` to continue the same
conversation. Read it back from the agents Worker:

```sh
curl "http://localhost:5174/agents/assistant/demo-1?view=history"
```

Talk to an agent without any server:

```sh
pnpm --filter ./packages/agents exec flue run src/agents/assistant.ts \
  --message "Say hello!"
```

Pass `--id demo-1` to continue that conversation instead of starting a fresh one.

An `AGENT_MODEL` that names an unknown provider or model fails at model
resolution, before any request leaves the Worker. The reason appears in the log,
never in the HTTP response.

## Build and typecheck

```sh
pnpm build        # builds both Workers into packages/*/dist
pnpm check        # tsc, oxlint, and oxfmt --check across the repo
pnpm gen          # regenerates packages/app/worker-configuration.d.ts
pnpm clean        # removes dist, .turbo, and the Vite cache
```

Run `pnpm gen` after changing either `wrangler.jsonc`. It rewrites the generated
bindings type, which is what makes `env.AGENT` typecheck.

## Formatting and linting

Both packages use [oxfmt](https://oxc.rs/docs/guide/usage/formatter) to format
and [oxlint](https://oxc.rs/docs/guide/usage/linter) to lint. One config per
tool sits at the repo root. A package script resolves the binary from the root
`devDependencies`, and each tool walks up from the package directory to find
the config.

```sh
pnpm fmt           # rewrites files in place
pnpm fmt:check     # fails when a file is not formatted
pnpm lint          # reports lint findings
```

`oxfmt.config.ts` ignores `worker-configuration.d.ts`. The generator owns that
file, and formatting it makes the `pnpm gen` diff in CI fail.

The three commands cover the root files as well. Each one runs the tool once at
the repo root with `!packages/**` excluded, then hands the two packages to turbo
with `turbo run <task>`.

Turbo caches `lint` and `fmt:check`. Both config files are listed in
`globalDependencies`, so a config edit invalidates the cache. `fmt` writes
files, so it is never cached.

## How the app reaches the agents

`packages/app/wrangler.jsonc` declares the binding:

```jsonc
"services": [{ "binding": "AGENT", "service": "app-starter-agents" }]
```

`packages/app/src/worker.tsx` sends every request through that binding with
`@flue/sdk`:

```ts
const conversation = createFlueClient({
  url: `https://agents.internal/agents/assistant/${params.conversationId}`,
  fetch: (input, init) => env.AGENT.fetch(new Request(input, init)),
});
```

The binding ignores the origin. Only the pathname selects a route.

Three settings in `packages/agents/vite.config.ts` let both Workers run on one
machine:

- `server.port: 5174`. The app owns 5173.
- `server.allowedHosts: ['agents.internal']`. Vite's dev host check rejects the
  placeholder origin that the binding forwards. Production Workers do not check
  hosts.
- `inspectorPort: 9230`. Both Workers default to inspector port 9229.

## Agent tooling for development

`.pi/` configures the Pi coding agent for this project. Pi loads it after you
grant project trust.

### Prompt templates

`.pi/prompts/` holds slash commands. Run `/reload` after you add or edit one.

| Command                         | Does                                                               |
| ------------------------------- | ------------------------------------------------------------------ |
| `/design "<brief>"`             | Builds a new page with the Hallmark skill.                         |
| `/refresh-design <target>`      | Redesigns an existing page in place. Preserves content and routes. |
| `/audit-design <target>`        | Scores a page against the Hallmark slop test. Read-only.           |
| `/study-design <url or image>`  | Extracts design DNA from a reference.                              |
| `/design-component <component>` | Builds one component with the 8-state demo wrapper.                |
| `/lock-design`                  | Writes a portable `design.md` design system.                       |

These commands load the `hallmark` skill. The skill lives in `.agents/skills/`,
which is gitignored and machine-local. `skills-lock.json` records its source.
`pnpm install` restores it, or run it on demand:

```sh
pnpm skills:sync
```

Hallmark reads and writes `.hallmark/log.json` at the repo root. That file keeps
consecutive builds structurally different. Commit it to share the rotation with
other developers.

### QRSPI planning

`.pi/settings.json` declares two Pi packages. Pi installs them on first load:

- `npm:@ftrdotdev/pi-qrspi` is the QRSPI planning workflow. Six phases run in
  order: Questions, Research, Design, Structure, Plan, Iterate. Each phase
  writes an artifact under `.qrspi/` and waits for your approval before the next
  phase starts. Nothing is implemented until you approve the plan.
- `npm:pi-subagents` handles child-agent delegation. QRSPI runs each phase in a
  fresh-context subagent, so the orchestrator context stays small. The extension
  also supplies the `reviewer`, `scout`, and `oracle` agents.

Start a full run:

```sh
/qrspi "add-payment-flow"
```

Run one phase on its own:

```sh
/qrspi-research "payment flow"
/qrspi-design .qrspi/research/20260101-payment-flow.md
/qrspi-structure .qrspi/designs/20260101-payment-flow.md
/qrspi-plan .qrspi/outlines/20260101-payment-flow.md
/qrspi-iterate .qrspi/plans/20260101-payment-flow.md "split slice 3"
```

The QRSPI package enforces the `.qrspi/<phase>/YYYYMMDD-<slug>.md` naming rule
and stamps git provenance into each artifact. Commit `.qrspi/` to keep plans
with the code.

Both package entries are pinned. Bump the version in `.pi/settings.json`, then
run `pi update --extensions`. `pi list` shows what is configured.

## Deploy

Deploy the agents Worker first. The app's service binding needs its target to
exist.

```sh
pnpm deploy:agents
pnpm deploy:app
```

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and on every pull
request:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm gen && git diff --exit-code packages/app/worker-configuration.d.ts
```

No step needs a Cloudflare account, so the workflow holds no secrets and works
unchanged in a repository made from this template. `pnpm check` runs `tsc`,
`oxlint`, and `oxfmt --check` across the repo. The last step fails when the
committed generated types no longer match the wrangler configs, so run `pnpm gen`
after you edit either `wrangler.jsonc`.

Run the same four commands locally before you push.

## License

MIT. See [LICENSE](LICENSE).
