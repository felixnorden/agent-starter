#!/usr/bin/env node
/**
 * Renames this template for a new project.
 *
 *   pnpm init:template <name> [--yes]
 *
 * <name>          Base name: lowercase letters, digits, and hyphens.
 *                 The Workers become <name> and <name>-agents.
 * --yes, -y       Skip the confirmation prompt.
 *
 * The script rewrites the two wrangler.jsonc files, the three package.json
 * names, and the Worker names inside the Markdown docs. It then regenerates
 * packages/app/worker-configuration.d.ts and deletes itself, so run it once.
 *
 * It deliberately leaves the Assistant agent alone. Renaming an agent changes
 * its Durable Object class name, which needs a `renamed_classes` migration in
 * packages/agents/wrangler.jsonc. See README.md.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT), "..");

const APP_WRANGLER = "packages/app/wrangler.jsonc";
const AGENTS_WRANGLER = "packages/agents/wrangler.jsonc";
const DOCS = [
  "README.md",
  "AGENTS.md",
  "packages/app/README.md",
  "packages/app/AGENTS.md",
  "packages/agents/README.md",
  "packages/agents/AGENTS.md",
];

const abs = (file) => path.join(ROOT, file);
const read = (file) => readFileSync(abs(file), "utf8");
const write = (file, text) => writeFileSync(abs(file), text);

const changed = [];

function usage(exitCode) {
  const text = `
Rename this template for a new project.

  pnpm init:template <name> [--yes]

<name>       Base name: lowercase letters, digits, and hyphens.
             The Workers become <name> and <name>-agents.
--yes, -y    Skip the confirmation prompt.

The script rewrites the two wrangler.jsonc files, the three package.json
names, and the Worker names in the Markdown docs. It then regenerates
packages/app/worker-configuration.d.ts and deletes itself. Run it once.
`;
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function fail(message) {
  console.error(`\nError: ${message}\n`);
  process.exit(1);
}

/** The Worker name is the first "name" field in a wrangler.jsonc. */
function workerName(file) {
  const match = read(file).match(/"name"\s*:\s*"([^"]+)"/);
  if (!match) fail(`no "name" field in ${file}`);
  return match[1];
}

/** Replaces each pair everywhere in one file. Reports whether it changed. */
function swap(file, pairs) {
  const before = read(file);
  let after = before;
  // Longest first: the agents Worker name contains the app Worker name.
  for (const [from, to] of pairs.toSorted((a, b) => b[0].length - a[0].length)) {
    after = after.split(from).join(to);
  }
  if (after === before) return;
  write(file, after);
  changed.push(file);
}

/** Sets "name" in a package.json, keeping its indentation. */
function setPackageName(file, value) {
  const before = read(file);
  const pkg = JSON.parse(before);
  if (pkg.name === value) return;
  const indent = before.includes("\n\t") ? "\t" : "  ";
  pkg.name = value;
  write(file, `${JSON.stringify(pkg, null, indent)}\n`);
  changed.push(file);
}

function assertIncludes(file, needle, what) {
  if (read(file).includes(needle)) return;
  fail(
    `${file} has no ${what} ("${needle}") after the rewrite. Undo the whole ` +
      `change with: git checkout -- .`,
  );
}

const argv = process.argv.slice(2);
const assumeYes = argv.includes("--yes") || argv.includes("-y");
const name = argv.find((arg) => !arg.startsWith("-"));

if (!name) usage(1);
if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(name)) {
  fail(
    `"${name}" is not a valid Worker name. Use lowercase letters, digits, and ` +
      `hyphens, and end with a letter or digit.`,
  );
}
if (`${name}-agents`.length > 63) {
  fail(`"${name}-agents" is longer than the 63-character Worker name limit.`);
}

const oldApp = workerName(APP_WRANGLER);
const oldAgents = workerName(AGENTS_WRANGLER);

if (oldApp === name) fail(`the app Worker is already named "${name}".`);
if (oldApp === `${name}-agents`) {
  fail(`"${name}-agents" is the current agents Worker name. Pick another base name.`);
}

const newAgents = `${name}-agents`;
const pairs = [
  [oldApp, name],
  [oldAgents, newAgents],
];

console.log(`
This rewrites:
  Worker   "${oldApp}"  ->  "${name}"
  Worker   "${oldAgents}"  ->  "${newAgents}"
  Package  "app-starter" (root)  ->  "${name}"
  Package  "@redwoodjs/starter"  ->  "@${name}/app"
  Package  "agents"  ->  "@${name}/agents"
  Docs     the Worker names in ${DOCS.length} Markdown files
`);

if (!assumeYes) {
  if (!process.stdin.isTTY) {
    fail("there is no terminal to confirm on. Pass --yes to run without a prompt.");
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question("Continue? [y/N] ")).trim().toLowerCase();
  rl.close();
  if (answer !== "y" && answer !== "yes") {
    console.log("Nothing changed.");
    process.exit(0);
  }
}

swap(APP_WRANGLER, pairs);
swap(AGENTS_WRANGLER, pairs);

setPackageName("package.json", name);
setPackageName("packages/app/package.json", `@${name}/app`);
setPackageName("packages/agents/package.json", `@${name}/agents`);

for (const doc of DOCS) swap(doc, pairs);

// The app Worker reaches the agents Worker by name. A mismatch breaks the
// binding at deploy time, so check both sides before anything else runs.
assertIncludes(APP_WRANGLER, `"name": "${name}"`, "new Worker name");
assertIncludes(APP_WRANGLER, `"service": "${newAgents}"`, "renamed service binding");
assertIncludes(AGENTS_WRANGLER, `"name": "${newAgents}"`, "new Worker name");

// The committed types embed the Worker name and a config hash, so regenerate
// them. Skip when dependencies are absent; the summary says what to run.
let regenerated = false;
if (existsSync(abs("node_modules"))) {
  console.log("\nRegenerating packages/app/worker-configuration.d.ts ...");
  const result = spawnSync("pnpm", ["gen"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  regenerated = result.status === 0;
}

// One-shot: drop the script and its package.json entry.
const pkg = JSON.parse(read("package.json"));
if (pkg.scripts?.["init:template"]) {
  delete pkg.scripts["init:template"];
  write("package.json", `${JSON.stringify(pkg, null, "  ")}\n`);
}
rmSync(SCRIPT);

console.log("\nChanged:");
for (const file of changed) console.log(`  ${file}`);

if (!regenerated) {
  console.log("\nRun `pnpm gen` to refresh packages/app/worker-configuration.d.ts.");
}

console.log(`
Next:
  1. Review the change:   git diff
  2. Choose a model:      packages/agents/.env  (see README.md)
  3. Start both Workers:  pnpm dev
  4. Deploy agents first: pnpm deploy:agents && pnpm deploy:app

This script deleted itself. Commit the result.
`);
