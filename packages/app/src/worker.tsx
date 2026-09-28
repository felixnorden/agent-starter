import { env } from "cloudflare:workers";
import { createFlueClient } from "@flue/sdk";
import { Effect, Result } from "effect";
import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { decodeAgentMessage } from "@/lib/agent-message";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  // Sends one message to the Flue `Assistant` agent over the AGENT service
  // binding. The agent owns the conversation, so reuse the same
  // :conversationId to continue one.
  //
  //   curl -X POST http://localhost:5173/api/agent/demo-1 \
  //     -H 'content-type: application/json' \
  //     -d '{"message":"Tell me a joke."}'
  route("/api/agent/:conversationId", ({ request, params }) =>
    Effect.runPromise(
      Effect.gen(function* () {
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

        const conversation = createFlueClient({
          // The origin is never dialed — only the pathname selects a route.
          // Every request travels on the service binding below.
          url: `https://agents.internal/agents/assistant/${params.conversationId}`,
          fetch: (input, init) => env.AGENT.fetch(new Request(input, init)),
        });

        const admission = yield* Effect.promise(() =>
          conversation.send({
            message: { kind: "user", body: decoded.success.message },
          }),
        );

        return Response.json(admission);
      }),
    ),
  ),
  render(Document, [route("/", Home)]),
]);
