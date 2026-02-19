import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import UnpluginTypia from "@ryoppippi/unplugin-typia/vite";

export default defineWorkersConfig({
  plugins: [UnpluginTypia()],
  test: {
    globals: true,
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.jsonc" },
      },
    },
  },
});
