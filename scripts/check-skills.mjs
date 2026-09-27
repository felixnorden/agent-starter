#!/usr/bin/env node
/**
 * Reports whether every skill listed in skills-lock.json is restored.
 *
 *   pnpm skills:check        # exits 1 and names what is missing
 *   pnpm skills:sync         # restores it
 *
 * `.agents/` is gitignored, so a fresh clone has the lock file and none of the
 * skills. It needs only Node, so `node scripts/check-skills.mjs` also works
 * before the first `pnpm install`. (The `pnpm` wrapper may install first.)
 * It is a local check only: CI has no `.agents/skills`, so CI must not call it.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lock = JSON.parse(readFileSync(path.join(root, "skills-lock.json"), "utf8"));

const names = Object.keys(lock.skills);
const missing = names.filter(
  (name) => !existsSync(path.join(root, ".agents", "skills", name, "SKILL.md")),
);

if (missing.length === 0) {
  console.log(`All ${names.length} skills are restored in .agents/skills.`);
  process.exit(0);
}

console.error(
  `Missing ${missing.length} of ${names.length} skills in .agents/skills: ` +
    `${missing.join(", ")}\nRestore them with: pnpm skills:sync`,
);
process.exit(1);
