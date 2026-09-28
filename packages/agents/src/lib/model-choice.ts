import { Config } from "effect";

/**
 * Workers AI runs on the Worker's own account with no API key, so it is the
 * fallback when no provider is configured.
 */
export const FALLBACK_MODEL = "cloudflare/@cf/moonshotai/kimi-k2.6";

/**
 * Reads `AGENT_MODEL`. A missing or blank value means the Workers AI fallback.
 *
 * `ConfigProvider` is a `Context.Reference` whose default reads the process
 * environment, so production code runs this as-is. Tests swap in a fixed
 * provider with `Effect.provideService`, which is why this stays an effect.
 */
export const modelChoice = Config.String("AGENT_MODEL").pipe(
  Config.withDefault(""),
  Config.map((configured) => configured.trim() || FALLBACK_MODEL),
);
