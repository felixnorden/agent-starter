# agents

A [Flue](https://flueframework.com) agent project — the `agents` package of this
monorepo.

## Setup

Dependencies are installed from the monorepo root:

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

Conversations are durable — pass `--id <id>` to continue one.

## Develop

```sh
pnpm dev
```

The Assistant agent is served at `http://localhost:5174/agents/assistant` — see
`src/app.ts` for the route map and an example request. From the monorepo root,
`pnpm dev` starts this Worker and the app Worker together.

`packages/app` calls this Worker through the `AGENT` service binding, with no
public URL involved. Deploy this Worker before the app Worker.

## Deploy

```sh
pnpm deploy
```

## Learn more

- [Flue docs](https://flueframework.com/docs/) — or `npx flue docs` from the terminal.
