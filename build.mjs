import { build } from "rolldown";
import Typia from "@ryoppippi/unplugin-typia/rolldown";

await build({
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "esm",
    sourcemap: true,
    minify: true,
  },
  plugins: [Typia()],
  external: ["__STATIC_CONTENT_MANIFEST"],
});
