import { FlueExecutionError } from "@flue/sdk";
import { Schema } from "effect";

/**
 * Query flags on `POST /api/agent/:conversationId`.
 *
 * `wait=1` makes the route await the agent's settlement and answer with the
 * reply instead of the admission receipt. Any other `wait` value is a bad
 * request. The route parses with `onExcessProperty: "error"`, so it accepts
 * exactly the parameters it documents and never silently drops one.
 */
export class AgentSendQuery extends Schema.Class<AgentSendQuery>("app/lib/AgentSendQuery")({
  wait: Schema.optionalKey(Schema.Literals(["1"])),
}) {}

/**
 * Query controls on `GET /api/agent/:conversationId`, the read proxy.
 *
 * The agents Worker owns the read surface, so these mirror the Flue streaming
 * protocol verbatim instead of inventing an app-level vocabulary: `view=history`
 * (the default there) is one materialized snapshot, and `view=updates` returns
 * the chunks recorded after `offset`, held open when `live` is set. The route
 * forwards the validated query, so the app never becomes a second authority on
 * the protocol: an unknown value fails here with 400, the same status the
 * agents Worker returns for it.
 */
export class AgentReadQuery extends Schema.Class<AgentReadQuery>("app/lib/AgentReadQuery")({
  view: Schema.optionalKey(Schema.Literals(["history", "updates"])),
  offset: Schema.optionalKey(Schema.NonEmptyString),
  live: Schema.optionalKey(Schema.Literals(["long-poll", "sse"])),
}) {}

/**
 * The reply could not be read after a `?wait=1` send: the submission settled
 * failed or aborted, the stream ended without a terminal event, or the client
 * disconnected mid-read. `failure` is the machine-readable Flue outcome;
 * `cause` stays server-side. The route logs the cause and answers 502 with the
 * outcome only, because the Flue protocol keeps failure detail off the wire.
 */
export class AgentReplyUnavailable extends Schema.TaggedError<AgentReplyUnavailable>()(
  "AgentReplyUnavailable",
  {
    submissionId: Schema.String,
    failure: Schema.Literals(["failed", "aborted", "terminal_event_missing", "unknown"]),
    cause: Schema.Defect(),
  },
) {}

/**
 * The `FlueExecutionError` an unsettled `read()` throws carries the Flue
 * outcome; anything else (an abort, a transport failure) maps to `unknown`.
 */
export const replyUnavailable = (submissionId: string, cause: unknown) =>
  new AgentReplyUnavailable({
    submissionId,
    failure: cause instanceof FlueExecutionError ? cause.failure : "unknown",
    cause,
  });

/** Reuse one parser at the route edge. It fails with a typed `SchemaError`. */
export const decodeAgentSendQuery = Schema.decodeUnknownResult(AgentSendQuery, {
  onExcessProperty: "error",
});

/** Reuse one parser at the route edge. It fails with a typed `SchemaError`. */
export const decodeAgentReadQuery = Schema.decodeUnknownResult(AgentReadQuery, {
  onExcessProperty: "error",
});
