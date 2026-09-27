# agents

The `agents` package of this monorepo. It runs [Flue](https://flueframework.com)
agents.

## Setup

Install dependencies from the monorepo root:

```sh
pnpm install
```

The default model is `cloudflare/@cf/moonshotai/kimi-k2.6` (Workers AI), which
needs no API key. To use another provider, add its key to `.env` (any
[provider Pi supports](https://pi.dev/docs/latest/providers#api-keys)).

## Talk to your agent

```sh
npx flue run src/agents/assistant.ts --message "Say hello!"
```

Conversation history lives in a Durable Object. Pass `--id <id>` to continue
one.

## Develop

```sh
pnpm dev
```

The Assistant agent is served at `http://localhost:5174/agents/assistant`. See
`src/app.ts` for the route map and an example request. From the monorepo root,
`pnpm dev` starts this Worker and the app Worker together.

`packages/app` calls this Worker through the `AGENT` service binding, with no
public URL involved. Deploy this Worker before the app Worker.

## Lint and format

```sh
pnpm lint          # oxlint, read-only
pnpm fmt           # oxfmt, writes files
pnpm fmt:check     # oxfmt, read-only
```

Both tools read the config at the monorepo root: `oxlint.config.ts` and
`oxfmt.config.ts`.

## Deploy

```sh
pnpm deploy
```

## Learn more

- [Flue docs](https://flueframework.com/docs/), or run `npx flue docs` in the
  terminal.
