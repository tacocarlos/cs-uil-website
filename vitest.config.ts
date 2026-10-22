import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
    resolve: { tsconfigPaths: true },
    test: {
        // lsp-gateway/ is a separate Bun service with its own test runner.
        include: ["src/**/*.test.{ts,tsx}"],
        // Load .env (all keys, not just VITE_*) so src/env.js validates.
        env: loadEnv(mode, process.cwd(), ""),
    },
}));
