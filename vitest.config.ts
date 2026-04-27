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
      },
      exclude: ["**/node_modules/**", "**/dist/**", "**/tests/**", "**/*.test.ts"],
    },
  },
});
