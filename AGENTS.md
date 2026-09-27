# AGENTS.md

Two Cloudflare Workers in one pnpm + Turborepo monorepo.

- `packages/app` — RedwoodSDK app. Serves HTML. Reaches the agent through the
  `AGENT` service binding.
- `packages/agents` — Flue agents. Owns conversations as Durable Objects.

Read `README.md` for full setup and architecture. Read `packages/app/AGENTS.md`
or `packages/agents/AGENTS.md` before changing that package.

## Commands

Run these from the repo root. Commands that can reach Cloudflare run
`scripts/require-account.mjs` first.

| Command | Does | Needs an account |
| --- | --- | --- |
| `pnpm dev` | Starts both Workers. App on 5173, agents on 5174. | only for Workers AI |
| `pnpm gen` | Rewrites `packages/app/worker-configuration.d.ts`. | no |
| `pnpm build` | Builds both Workers into `packages/*/dist`. | no |
| `pnpm check` | Typechecks both packages. | no |
| `pnpm deploy:agents` | Deploys the agents Worker. Run it before the app. | yes |
| `pnpm deploy:app` | Deploys the app Worker. | yes |
| `pnpm clean` | Removes `dist`, `.turbo`, and the Vite cache. | no |
| `pnpm skills:sync` | Restores `.agents/skills` from `skills-lock.json`. | no |
| `pnpm skills:check` | Fails when a locked skill is not restored. Local only. | no |

To run one agent with no server, use the CLI inside its package:

```sh
pnpm --filter ./packages/agents exec flue run src/agents/assistant.ts -m "Hi"
```

`pnpm dev` and the `deploy:*` scripts run `scripts/require-account.mjs`, which
exits with an error when the credential the configured model needs is missing.
Workers AI needs `CLOUDFLARE_ACCOUNT_ID` from your shell. A keyed provider needs
its key in `packages/agents/.env` and no Cloudflare account. Deploys always need
the account. See `README.md`.

## First setup

A fresh clone needs four things. Do them in this order, from the repo root.

1. **Install.** This provides `node_modules/.bin/skills`, which `skills:sync`
   runs, and the tooling the other steps use.

   ```sh
   pnpm install
   ```

2. **Restore the skills, but only if they are missing.** `.agents/` is
   gitignored, so a clone has the lock file and none of the skills.

   ```sh
   pnpm skills:check     # exits 1 and names what is missing
   pnpm skills:sync      # only when the check fails
   ```

   The restore clones one GitHub repository per skill and submits each to
   third-party scanners, so never run it when the check passes.

3. **Rename the Workers, but only once.** If `scripts/init-template.mjs` still
   exists, the repository carries the template's Worker names. The script
   rewrites both `wrangler.jsonc` files, the three `package.json` names, the
   Markdown docs, and the generated types, then deletes itself.

   ```sh
   pnpm init:template <name>      # Workers: <name> and <name>-agents
   ```

   Never rename one Worker by hand; the `AGENT` service binding must match.

4. **Create the env file.** It is gitignored, so a clone has only the example.
   The default model needs no key, but `pnpm dev` still needs a credential. See
   `README.md`.

   ```sh
   [ -f packages/agents/.env ] || cp packages/agents/.env.example packages/agents/.env
   ```

## Rules

- The credential rule is model-driven. `packages/agents/model-config.ts` is the
  single source for it; both `scripts/require-account.mjs` and
  `packages/agents/vite.config.ts` import from there. Change the rule in that one
  file, never in a consumer.
- `pnpm dev` opens a Cloudflare session only when Workers AI is configured. Any
  `ai` binding makes the Vite plugin request a remote preview session at startup,
  so `vite.config.ts` disables `remoteBindings` in dev for keyed providers.
- The Cloudflare account comes from your shell environment, not from a file.
  There is no root `.env`, and nothing loads one.
- Keep agent runtime values in `packages/agents/.env`: `AGENT_MODEL` and provider
  keys. Vite loads that file for `pnpm dev` and `flue run`. It is gitignored.
  Never commit it.
- Select a model with `AGENT_MODEL`, never by editing `assistant.ts`. Unset means
  the Workers AI fallback. Specifiers: <https://flueframework.com/models.json>.
- The `service` in `packages/app/wrangler.jsonc` `services[]` must equal the
  `name` in `packages/agents/wrangler.jsonc`. Renaming one breaks the other.
  Rename the pair together, never one by hand; see [First setup](#first-setup).
- Adding or renaming an agent needs a Durable Object migration entry in
  `packages/agents/wrangler.jsonc`. A rename changes the class name.
- `packages/app/worker-configuration.d.ts` is generated. Run `pnpm gen` after
  editing a `wrangler.jsonc`. Never edit it by hand.
- CI runs `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm build`, then
  `pnpm gen` and `git diff --exit-code` on that generated file. No step needs an
  account, so the workflow carries no secrets. Run the same commands before you
  push.
- Turbo filters the environment it hands to tasks. `CLOUDFLARE_ACCOUNT_ID` and
  `CLOUDFLARE_API_TOKEN` are listed in `turbo.json` `globalPassThroughEnv`.
  Removing them makes the guard pass while wrangler silently loses the account.
- Start both Workers with `pnpm dev`. The app alone cannot reach the agent,
  because the binding resolves through the local dev registry.
- Local conversation state lives in the gitignored
  `packages/agents/.wrangler/state/`. Delete it to reset conversations.
- `pnpm skills:sync` restores `.agents/skills/` from `skills-lock.json` through
  the `skills` devDependency. It does **not** run on `pnpm install`, so installs
  stay fast and work offline. Run it only when `pnpm skills:check` fails; see
  [First setup](#first-setup).
- `.pi/settings.json` is project Pi configuration. Pi loads it only after
  project trust is granted, so it does nothing until then.
- `.agents/skills/` is gitignored and machine-local; `skills-lock.json` records
  where the skills come from. The useful ones here are `wrangler`,
  `durable-objects`, and `cloudflare`.
