import { defineConfig } from "oxlint";

export default defineConfig({
  ignorePatterns: ["dist/**", ".agents/**", ".claude/**", "coverage/**", "node_modules/**"],
});
