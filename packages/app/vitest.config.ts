import { defineConfig } from "vitest/config";

// Tests run in plain Node. They must not load `vite.config.mts`, because the
// Cloudflare plugin there targets the Worker environment and expects a Worker
// bundle. Keep this config plugin-free.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
