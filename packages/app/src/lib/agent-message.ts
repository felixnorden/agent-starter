import { Schema } from "effect";

/**
 * The body accepted on `POST /api/agent/:conversationId`. `Schema.Class` gives
 * one definition for the runtime validator and the TypeScript type, so the
 * route and its tests agree on what a valid body is.
 */
export class AgentMessage extends Schema.Class<AgentMessage, { readonly brand: unique symbol }>(
  "app/lib/AgentMessage",
)({
  message: Schema.NonEmptyString,
}) {}

/** Reuse one parser at the route edge. It fails with a typed `SchemaError`. */
export const decodeAgentMessage = Schema.decodeUnknownResult(AgentMessage);
