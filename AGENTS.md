# AGENTS.md

Two Cloudflare Workers in one pnpm + Turborepo monorepo. `packages/app` renders
HTML with RedwoodSDK and calls the Flue agents in `packages/agents` through the
`AGENT` service binding.

- Read `README.md` for setup, commands, architecture, and deploy order.
- Read `packages/app/AGENTS.md` or `packages/agents/AGENTS.md` before changing
  that package.
- Load the `wrangler`, `durable-objects`, or `cloudflare` skill before changing
  Worker config or runtime code.

## Effect

Read `node_modules/effect/AGENTS.md` completely before writing Effect code, and
follow the links in it. For APIs the guide does not cover, search
`node_modules/effect/src`.

## Rename both Workers together

The `service` in `packages/app/wrangler.jsonc` `services[]` must equal the
`name` in `packages/agents/wrangler.jsonc`. Run `pnpm init:template <name>` to
rewrite the pair. Renaming one Worker by hand leaves the binding pointing at a
name that no longer exists.
