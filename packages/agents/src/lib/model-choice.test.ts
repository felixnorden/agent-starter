import { assert, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect } from "effect";

import { FALLBACK_MODEL, modelChoice } from "./model-choice.ts";

/**
 * Runs `modelChoice` against a fixed environment, so no test reads the real
 * one and the result does not depend on how the test runner was started.
 */
const withEnv = (env: Record<string, string>) =>
  Effect.provideService(
    modelChoice,
    ConfigProvider.ConfigProvider,
    ConfigProvider.fromEnvRecord(env),
  );

describe("modelChoice", () => {
  it.effect("uses AGENT_MODEL when set", () =>
    Effect.gen(function* () {
      const model = yield* withEnv({ AGENT_MODEL: "openrouter/anthropic/claude-sonnet-4.5" });
      assert.strictEqual(model, "openrouter/anthropic/claude-sonnet-4.5");
    }),
  );

  it.effect("falls back to Workers AI when AGENT_MODEL is unset", () =>
    Effect.gen(function* () {
      const model = yield* withEnv({});
      assert.strictEqual(model, FALLBACK_MODEL);
    }),
  );

  it.effect("treats a blank AGENT_MODEL as unset", () =>
    Effect.gen(function* () {
      const model = yield* withEnv({ AGENT_MODEL: "   " });
      assert.strictEqual(model, FALLBACK_MODEL);
    }),
  );
});
