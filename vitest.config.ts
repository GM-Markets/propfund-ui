import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    // Unit tests live next to the source they cover (`*.test.ts[x]`).
    // Playwright e2e specs use `.spec.ts` under tests/e2e and are excluded.
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "**/node_modules/**", "tests/e2e/**"],
  },
});
