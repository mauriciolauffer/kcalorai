import { defineConfig } from "vitest/config";
import UnpluginTypia from "@typia/unplugin/vite";

export default defineConfig({
  plugins: [UnpluginTypia()],
  test: {
    globals: true,
    environment: "node",
  },
});
