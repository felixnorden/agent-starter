#!/usr/bin/env node
/**
 * Checks that the credential this configuration needs is present, then exits.
 *
 * `pnpm dev` and the `deploy:*` scripts run this first. Wrangler otherwise falls
 * back silently to whichever Cloudflare account is logged in on the machine,
 * and nothing should bill an account the repository never named.
 *
 * The requirement follows the configured model, so a keyed provider needs no
 * Cloudflare account at all:
 *
 *   AGENT_MODEL unset or `cloudflare/...`  ->  CLOUDFLARE_ACCOUNT_ID
 *   `openrouter/...`                       ->  OPENROUTER_API_KEY
 *   `opencode/...`, `opencode-go/...`      ->  OPENCODE_API_KEY
 *
 * Deploying always needs the Cloudflare account, because the deploy itself
 * reaches Cloudflare whatever the model is.
 *
 * The rule for reading the model lives in packages/agents/model-config.ts,
 * which the Vite config shares.
 *
 * Usage: node scripts/require-account.mjs <dev|deploy>
 */
import {
  hasCredential,
  providerOf,
  requiredCredential,
  resolveModel,
  usesWorkersAi,
} from "../packages/agents/model-config.ts";

const [task] = process.argv.slice(2);

if (!task) {
  console.error("usage: node scripts/require-account.mjs <dev|deploy>");
  process.exit(1);
}

const model = resolveModel();
const provider = providerOf(model);
const isDeploy = task === "deploy";
const needsWorkersAi = usesWorkersAi(model);

// Deploying always reaches Cloudflare. Otherwise the model decides.
const credential = isDeploy || needsWorkersAi ? "CLOUDFLARE_ACCOUNT_ID" : requiredCredential(model);

if (!credential) {
  console.error(
    `[env] provider "${provider}" is not one this check knows, so nothing is required. ` +
      "Flue reports an unknown provider itself.",
  );
  process.exit(0);
}

if (hasCredential(credential)) {
  const reason = isDeploy
    ? "a deploy always reaches Cloudflare"
    : needsWorkersAi
      ? "Workers AI runs on the Cloudflare account"
      : `${provider} supplies this`;
  console.error(`[env] ${credential} is set (${reason})`);
  process.exit(0);
}

const detail = isDeploy
  ? "Deploying reaches Cloudflare."
  : needsWorkersAi
    ? "AGENT_MODEL is unset, so the Workers AI fallback applies, and Workers AI is always remote."
    : `AGENT_MODEL is "${model}", which needs a key.`;

const fix =
  credential === "CLOUDFLARE_ACCOUNT_ID"
    ? `Add this to your shell profile, then open a new terminal:
  export CLOUDFLARE_ACCOUNT_ID=<your account id>

Print your account ids with:  npx wrangler whoami

To avoid needing a Cloudflare account for \`pnpm dev\`, select a keyed provider
instead — set AGENT_MODEL in packages/agents/.env, for example:
  AGENT_MODEL=openrouter/moonshotai/kimi-k2.6`
    : `Add it to packages/agents/.env, next to AGENT_MODEL:
  ${credential}=<your key>`;

console.error(`\n[env] ${credential} is not set.\n\n${detail}\n\n${fix}\n`);
process.exit(1);
