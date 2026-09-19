import { fileURLToPath, URL } from "node:url";
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.js";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      // The app source is plain JavaScript, so the DOM setup has a single
      // authoritative implementation at `setup.js`. Test files stay `.tsx`
      // because they consume the TypeScript bindgen types, so the include glob
      // still accepts both extensions.
      setupFiles: ["./src/__tests__/setup.js"],
      include: ["src/**/*.{test,spec}.{ts,tsx,js,jsx}"],
      // The dashboard polls on a 2s interval; tests drive that with fake timers
      // rather than waiting on wall-clock time.
      restoreMocks: true,
      pool: "forks",
      poolOptions: {
        forks: { minForks: 1, maxForks: 1 },
      },
    },
  }),
);
