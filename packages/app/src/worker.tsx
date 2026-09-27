import { env } from "cloudflare:workers";
import { createFlueClient } from "@flue/sdk";
import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

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
  route("/api/agent/:conversationId", async ({ request, params }) => {
    const body = (await request.json()) as { message?: string };

    if (!body.message) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const conversation = createFlueClient({
      // The origin is never dialed — only the pathname selects a route. Every
      // request travels on the service binding below.
      url: `https://agents.internal/agents/assistant/${params.conversationId}`,
      fetch: (input, init) => env.AGENT.fetch(new Request(input, init)),
    });

    const admission = await conversation.send({
      message: { kind: "user", body: body.message },
    });

    return Response.json(admission);
  }),
  render(Document, [route("/", Home)]),
]);
