/**
 * Which model this package runs, and the credential that model needs.
 *
 * This is build and tooling code, deliberately outside `src/`, so it never
 * enters the Worker bundle. It uses `node:fs` to read the same `.env` file Vite
 * loads, because the decisions below have to be made before Vite starts.
 *
 * Two consumers share the rule, so it lives here rather than in either one:
 *
 *   - `vite.config.ts` decides whether dev may keep the remote AI binding. Any
 *     `ai` binding makes the Cloudflare Vite plugin open a preview session at
 *     startup, which needs a Cloudflare account even when no model call happens.
 *   - `scripts/require-account.mjs` decides which credential must be present
 *     before a Cloudflare-touching command runs.
 *
 * `AGENT_MODEL` is read from the process environment first, then from this
 * package's `.env`.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(packageRoot, ".env");

/** Workers AI runs on the Worker's own account, so it needs no API key. */
export const WORKERS_AI_PROVIDER = "cloudflare";

/** The credential each provider needs. */
const PROVIDER_CREDENTIALS: Record<string, string> = {
  [WORKERS_AI_PROVIDER]: "CLOUDFLARE_ACCOUNT_ID",
  openrouter: "OPENROUTER_API_KEY",
  opencode: "OPENCODE_API_KEY",
  "opencode-go": "OPENCODE_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
  groq: "GROQ_API_KEY",
};

/** Parses a .env file into a flat object. Comments and blanks are ignored. */
function readEnvFile(): Record<string, string> {
  if (!existsSync(envPath)) return {};
  const values: Record<string, string> = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    values[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return values;
}

/** Reads `AGENT_MODEL`. An empty result means the Workers AI fallback. */
export function resolveModel(): string {
  const fromEnvironment = process.env.AGENT_MODEL?.trim();
  if (fromEnvironment) return fromEnvironment;
  return readEnvFile().AGENT_MODEL?.trim() ?? "";
}

/** The provider id from a `provider/model` specifier. */
export function providerOf(model: string = resolveModel()): string {
  if (!model) return WORKERS_AI_PROVIDER;
  return model.split("/")[0];
}

/** True when this configuration reaches Cloudflare for inference. */
export function usesWorkersAi(model: string = resolveModel()): boolean {
  return providerOf(model) === WORKERS_AI_PROVIDER;
}

/** The env var name this configuration needs, or null when none is known. */
export function requiredCredential(model: string = resolveModel()): string | null {
  return PROVIDER_CREDENTIALS[providerOf(model)] ?? null;
}

/**
 * Whether a credential is available. Provider keys may live in the shell or in
 * this package's `.env`; the Cloudflare account comes from the shell only,
 * because nothing loads a repo-root env file.
 */
export function hasCredential(name: string): boolean {
  if (process.env[name]?.trim()) return true;
  if (name === "CLOUDFLARE_ACCOUNT_ID") return false;
  return Boolean(readEnvFile()[name]);
}
