import { env } from "cloudflare:workers";
import { createFlueClient } from "@flue/sdk";
import { Effect, Result } from "effect";
import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { decodeAgentMessage } from "@/lib/agent-message";
import { decodeAgentReadQuery, decodeAgentSendQuery, replyUnavailable } from "@/lib/agent-query";

export type AppContext = {};

/**
 * The origin is never dialed — only the pathname selects a route, so every
 * request travels on the `AGENT` service binding.
 */
const agentUrl = (conversationId: string) =>
  `https://agents.internal/agents/assistant/${conversationId}`;

/** A client for one agent conversation, bound to the `AGENT` service binding. */
const agentConversation = (conversationId: string) =>
  createFlueClient({
    url: agentUrl(conversationId),
    fetch: (input, init) => env.AGENT.fetch(new Request(input, init)),
  });

/** The route's query string as a plain record, ready for a `Schema` decode. */
const queryRecord = (request: Request) => Object.fromEntries(new URL(request.url).searchParams);

export default defineApp([
  setCommonHeaders(),
  // Both methods of one path. POST admits a message; GET reads the
  // conversation back. The agent owns the conversation, so reuse the same
  // :conversationId to continue one.
  //
  //   curl -X POST http://localhost:5173/api/agent/demo-1 \
  //     -H 'content-type: application/json' \
  //     -d '{"message":"Tell me a joke."}'
  //   curl "http://localhost:5173/api/agent/demo-1?view=history"
  //
  // POST answers with the Flue admission receipt and status 202, exactly as
  // the protocol specifies. Add `?wait=1` to hold the request until the turn
  // settles and answer with the reply. GET proxies the Flue read surface, so
  // the app origin can read history and follow live updates.
  route("/api/agent/:conversationId", {
    // Sends one message to the Flue `Assistant` agent over the AGENT service
    // binding.
    post: ({ request, params }) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const query = decodeAgentSendQuery(queryRecord(request));

          if (Result.isFailure(query)) {
            return Response.json({ error: "invalid query" }, { status: 400 });
          }

          // A body that is not JSON, or that lacks a non-empty `message`, is a
          // bad request, so both answer 400. `decodeAgentMessage` comes from
          // @/lib/agent-message, so this route and its tests share one
          // definition of an acceptable body. It returns a `Result`, so no
          // effect is involved in the decode itself.
          const body = yield* Effect.tryPromise(() => request.json()).pipe(
            Effect.orElseSucceed(() => null),
          );
          const decoded = decodeAgentMessage(body);

          if (Result.isFailure(decoded)) {
            return Response.json({ error: "message is required" }, { status: 400 });
          }

          const conversation = agentConversation(params.conversationId);

          const admission = yield* Effect.promise(() =>
            conversation.send({
              message: { kind: "user", body: decoded.success.message },
            }),
          );

          if (query.success.wait !== "1") {
            return Response.json(admission, { status: 202 });
          }

          // `read()` awaits the settlement and resolves with the reply. A turn
          // that fails or aborts rejects, so a `?wait=1` caller gets 502 and
          // the Flue outcome, never the upstream error text.
          const reply = yield* Effect.tryPromise({
            try: () => conversation.read(admission, { signal: request.signal }),
            catch: (cause) => replyUnavailable(admission.submissionId, cause),
          });

          return Response.json(reply);
        }).pipe(
          Effect.catchTag("AgentReplyUnavailable", (error) =>
            // The cause is the only place the upstream detail lives, so log it
            // and answer with the machine-readable outcome alone.
            Effect.logError("agent reply unavailable", {
              submissionId: error.submissionId,
              failure: error.failure,
              cause: error.cause,
            }).pipe(
              Effect.as(
                Response.json(
                  {
                    error: "agent_reply_unavailable",
                    submissionId: error.submissionId,
                    failure: error.failure,
                  },
                  { status: 502 },
                ),
              ),
            ),
          ),
        ),
      ),
    // Proxies the Flue read surface to the browser. Without this the app origin
    // cannot read a conversation at all: the admission's `streamUrl` names
    // `agents.internal`, which only the service binding resolves.
    get: ({ request, params }) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const query = decodeAgentReadQuery(queryRecord(request));

          if (Result.isFailure(query)) {
            return Response.json({ error: "invalid query" }, { status: 400 });
          }

          // Forward the validated query, so the agents Worker stays the only
          // authority on the read protocol. Pass its response through whole:
          // status, `Stream-Next-Offset`, and a live body all survive.
          const target = new URL(agentUrl(params.conversationId));
          target.search = new URL(request.url).search;

          const response = yield* Effect.tryPromise(() =>
            env.AGENT.fetch(new Request(target)),
          ).pipe(Effect.orElseSucceed(() => null));

          if (response === null) {
            return Response.json({ error: "agent_unreachable" }, { status: 502 });
          }

          return response;
        }),
      ),
  }),
  render(Document, [route("/", Home)]),
]);
