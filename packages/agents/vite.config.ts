import { readFileSync } from "node:fs";

import { cloudflare } from "@cloudflare/vite-plugin";
import { flue, flueWorkerConfig } from "@flue/vite";
import { defineConfig, type Plugin } from "vite";

import { usesWorkersAi } from "./model-config.ts";

/**
 * Strip the sourcemap comments from dependencies that publish maps pointing at
 * source files they do not ship.
 *
 * The `agents` package (pulled in by Flue) imports `cron-schedule` and the
 * Model Context Protocol SDK. Vite's Worker environment reads a dependency's
 * `sourceMappingURL` map while serving it in dev, tries to inline the original
 * sources, and warns once per missing file. The maps are unusable either way,
 * so removing the comments stops the warnings without touching valid maps
 * from any other package.
 *
 * `load` runs before Vite falls back to reading the file and extracting its
 * map, so returning the code without the comment skips that step.
 */
function stripBrokenDependencySourcemaps(): Plugin {
  const brokenPackages = [
    /node_modules[\\/]cron-schedule[\\/]/,
    /node_modules[\\/]@modelcontextprotocol[\\/]sdk[\\/]/,
  ];
  const sourceMappingUrlComment =
    /[\t ]*(?:\/\/[#@][\t ]*sourceMappingURL=[^\n]*|\/\*[#@][\t ]*sourceMappingURL=[^*]*\*\/)/g;

  return {
    name: "strip-broken-dependency-sourcemaps",
    enforce: "pre",
    apply: "serve",
    load(id) {
      const file = id.split("?")[0];
      if (!brokenPackages.some((pattern) => pattern.test(file))) return;
      let code: string;
      try {
        code = readFileSync(file, "utf8");
      } catch {
        return;
      }
      const stripped = code.replace(sourceMappingUrlComment, "");
      if (stripped === code) return;
      return { code: stripped, map: null };
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [
    flue(),
    cloudflare({
      config: flueWorkerConfig(),
      // The app package owns dev port 5173 and the default inspector port
      // 9229. Move this Worker's inspector aside so `pnpm dev` can run both.
      inspectorPort: 9230,
      // A remote binding makes the dev server open a Cloudflare preview
      // session at startup, and that needs a Cloudflare account even when
      // no model call ever happens. Workers AI is always remote, so only
      // keep remote bindings when this configuration actually uses it.
      // `pnpm dev` then needs no Cloudflare account for a keyed provider.
      // Builds are left alone, so deploys keep the declared binding.
      remoteBindings: command === "build" ? true : usesWorkersAi(),
    }),
    stripBrokenDependencySourcemaps(),
  ],
  // The app package owns 5173, so the agents Worker takes the next port.
  server: {
    port: 5174,
    // packages/app calls this Worker over the AGENT service binding with
    // a placeholder origin (https://agents.internal), exactly as the Flue
    // docs show. The origin is never dialed, but Vite's dev host check sees
    // the forwarded Host header and rejects it, so allow it here. Production
    // Workers do not perform this check.
    allowedHosts: ["agents.internal"],
  },
}));
