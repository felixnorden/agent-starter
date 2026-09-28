import { assert, describe, it } from "@effect/vitest";
import { Result } from "effect";

import { decodeAgentMessage } from "./agent-message";

// `decodeAgentMessage` returns a `Result`, not an `Effect`, so these are plain
// synchronous tests. `it` comes from @effect/vitest, which re-exports vitest.
describe("decodeAgentMessage", () => {
  it("accepts a non-empty message", () => {
    const decoded = decodeAgentMessage({ message: "Tell me a joke." });

    assert.isTrue(Result.isSuccess(decoded));
    if (Result.isSuccess(decoded)) {
      assert.strictEqual(decoded.success.message, "Tell me a joke.");
    }
  });

  it("rejects an empty message", () => {
    assert.isTrue(Result.isFailure(decodeAgentMessage({ message: "" })));
  });

  it("rejects a body with no message", () => {
    assert.isTrue(Result.isFailure(decodeAgentMessage({})));
  });

  it("rejects a non-object body", () => {
    assert.isTrue(Result.isFailure(decodeAgentMessage(null)));
  });
});
