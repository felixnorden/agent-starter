import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

// Tests run inside workerd, the same runtime the Worker ships on. The pool is
// configured with `miniflare` options only: naming a Wrangler config would make
// the pool read this package's `ai` binding, and a remote binding needs a
// Cloudflare account even when no test touches `env.AI`. The tests here are
// pure logic, so they need no bindings at all.
export default defineConfig({
  plugins: [
    cloudflareTest({
      miniflare: {
        compatibilityDate: "2026-06-01",
        compatibilityFlags: ["nodejs_compat"],
      },
    }),
  ],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
