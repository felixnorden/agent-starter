import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

// Tests run inside workerd, the same runtime the Worker ships on. The pool is
// configured with `miniflare` options only: naming a Wrangler config would make
// the pool build this package's Worker and its `AGENT` service binding, which
// resolves through the local dev registry and is not up during a test run. The
// tests here are pure logic, so they need no bindings at all. The compatibility
// date matches `wrangler.jsonc`.
export default defineConfig({
  plugins: [
    cloudflareTest({
      miniflare: {
        compatibilityDate: "2026-08-01",
        compatibilityFlags: ["nodejs_compat"],
      },
    }),
  ],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
