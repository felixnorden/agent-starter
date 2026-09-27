'use agent';
import { useModel } from '@flue/runtime';

// Workers AI runs on the Worker's own account with no API key, so it is the
// fallback when no provider is configured.
const FALLBACK_MODEL = 'cloudflare/@cf/moonshotai/kimi-k2.6';

// Every exported capitalized function in a 'use agent' module is an agent,
// and the function's name is its durable identity. The return value is the
// agent's system prompt.
export function Assistant() {
	// AGENT_MODEL picks the provider. Set it in packages/agents/.env for local
	// dev, or as a Worker var/secret when deployed. Workers populate
	// process.env from the Worker's vars and secrets, so the same line works
	// under both `vite dev` and a deployed Worker, and reads as undefined under
	// `flue run` when the variable is unset.
	// Specifiers: https://flueframework.com/models.json
	useModel(process.env.AGENT_MODEL || FALLBACK_MODEL);
	return 'You are the chat assistant for this app. Answer the user clearly and keep replies short.';
}
