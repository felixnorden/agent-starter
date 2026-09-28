import { FlueExecutionError } from "@flue/sdk";
import { assert, describe, it } from "@effect/vitest";
import { Result } from "effect";

import {
  AgentReplyUnavailable,
  decodeAgentReadQuery,
  decodeAgentSendQuery,
  replyUnavailable,
} from "./agent-query";

// Both decoders return a `Result`, not an `Effect`, so these are plain
// synchronous tests. `it` comes from @effect/vitest, which re-exports vitest.
describe("decodeAgentSendQuery", () => {
  it("accepts no query at all", () => {
    const decoded = decodeAgentSendQuery({});

    assert.isTrue(Result.isSuccess(decoded));
    if (Result.isSuccess(decoded)) {
      assert.isUndefined(decoded.success.wait);
    }
  });

  it("accepts wait=1", () => {
    const decoded = decodeAgentSendQuery({ wait: "1" });

    assert.isTrue(Result.isSuccess(decoded));
    if (Result.isSuccess(decoded)) {
      assert.strictEqual(decoded.success.wait, "1");
    }
  });

  it("rejects any other wait value", () => {
    assert.isTrue(Result.isFailure(decodeAgentSendQuery({ wait: "0" })));
    assert.isTrue(Result.isFailure(decodeAgentSendQuery({ wait: "true" })));
  });

  it("rejects an unknown parameter", () => {
    assert.isTrue(Result.isFailure(decodeAgentSendQuery({ pretty: "1" })));
  });
});

describe("decodeAgentReadQuery", () => {
  it("accepts no query at all, which the agents Worker reads as history", () => {
    const decoded = decodeAgentReadQuery({});

    assert.isTrue(Result.isSuccess(decoded));
    if (Result.isSuccess(decoded)) {
      assert.isUndefined(decoded.success.view);
    }
  });

  it("accepts the live updates form", () => {
    const decoded = decodeAgentReadQuery({
      view: "updates",
      offset: "0000000000000000_0000000000000013",
      live: "sse",
    });

    assert.isTrue(Result.isSuccess(decoded));
    if (Result.isSuccess(decoded)) {
      assert.strictEqual(decoded.success.view, "updates");
      assert.strictEqual(decoded.success.offset, "0000000000000000_0000000000000013");
      assert.strictEqual(decoded.success.live, "sse");
    }
  });

  it("rejects an unknown view", () => {
    assert.isTrue(Result.isFailure(decodeAgentReadQuery({ view: "nope" })));
  });

  it("rejects an unknown live mode", () => {
    assert.isTrue(Result.isFailure(decodeAgentReadQuery({ offset: "-1", live: "poll" })));
  });

  it("rejects an empty offset", () => {
    assert.isTrue(Result.isFailure(decodeAgentReadQuery({ view: "updates", offset: "" })));
  });

  it("rejects a parameter the route does not forward", () => {
    assert.isTrue(
      Result.isFailure(decodeAgentReadQuery({ view: "updates", offset: "-1", tail: "5" })),
    );
  });
});

describe("replyUnavailable", () => {
  it("carries the Flue outcome of a settled submission", () => {
    const error = replyUnavailable(
      "sub_1",
      new FlueExecutionError({ target: "agent_submission", targetId: "sub_1", failure: "aborted" }),
    );

    assert.instanceOf(error, AgentReplyUnavailable);
    assert.strictEqual(error.submissionId, "sub_1");
    assert.strictEqual(error.failure, "aborted");
  });

  it("maps any other cause to unknown", () => {
    assert.strictEqual(replyUnavailable("sub_1", new Error("socket closed")).failure, "unknown");
  });
});
