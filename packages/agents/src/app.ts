import { createAgentRouter } from "@flue/runtime/routing";
import { Hono } from "hono";
import { Assistant } from "./agents/assistant.ts";

const app = new Hono();

// The route map: every agent, channel, and custom route is mounted here
// explicitly. Talk to Assistant with one POST per message:
//
//   curl -X POST http://localhost:5174/agents/assistant/my-first-chat \
//     -H 'content-type: application/json' \
//     -d '{"kind":"user","body":"Tell me a joke."}'
app.route("/agents/assistant", createAgentRouter(Assistant));

export default app;
