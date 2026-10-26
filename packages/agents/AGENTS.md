# AGENTS.md

`packages/agents` runs Flue agents: TypeScript functions that own one durable
conversation each. The app Worker reaches them through the `AGENT` service
binding.

Read `../../README.md` for setup, commands, routes, and model selection.

## Flue

Read the docs from the CLI, so they match the pinned version:

```sh
npx flue docs search <query>
npx flue docs read <path>
```

A module whose first line is the `'use agent'` directive exports agents. Every
exported capitalized function is one, and the function name is its durable
identity: renaming it renames the Durable Object class, which needs a migration
entry in `wrangler.jsonc`.

`npx flue add` lists blueprints for channels, sandboxes, and databases.

Conversation state lives in the gitignored `.wrangler/state/`. Delete that
directory to reset local conversations.
