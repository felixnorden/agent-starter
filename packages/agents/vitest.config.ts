import { defineConfig } from "vitest/config";

// Tests run in plain Node. They must not load `vite.config.ts`, because the
// Cloudflare plugin there opens a remote binding session at startup and needs
// a Cloudflare account. Keep this config plugin-free.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
