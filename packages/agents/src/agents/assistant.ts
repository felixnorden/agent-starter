"use agent";
import { useModel } from "@flue/runtime";
import { Effect } from "effect";

import { modelChoice } from "../lib/model-choice.ts";

// Every exported capitalized function in a 'use agent' module is an agent,
// and the function's name is its durable identity. The return value is the
// agent's system prompt.
export function Assistant() {
  // `modelChoice` reads AGENT_MODEL from this process's environment through
  // Effect's Config. Set it in packages/agents/.env for local dev, or as a
  // Worker var/secret when deployed. Workers populate process.env from the
  // Worker's vars and secrets, so the same line works under both `vite dev`
  // and a deployed Worker. Unset means the Workers AI fallback.
  // Specifiers: https://flueframework.com/models.json
  useModel(Effect.runSync(modelChoice));
  return "You are the chat assistant for this app. Answer the user clearly and keep replies short.";
}
