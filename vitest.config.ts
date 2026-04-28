import { defineConfig } from "vitest/config";
import UnpluginTypia from "@typia/unplugin/vite";

export default defineConfig({
  plugins: [UnpluginTypia()],
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
      exclude: ["**/node_modules/**", "**/dist/**", "**/tests/**", "**/*.test.ts", "src/lib/auth.ts"],
    },
  },
});
