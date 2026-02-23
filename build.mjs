import { build } from "rolldown";
import typescript from "@rollup/plugin-typescript";

await build({
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "esm",
    sourcemap: true,
    minify: true,
  },
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
      compilerOptions: {
        module: "ESNext",
      },
    }),
  ],
  external: ["__STATIC_CONTENT_MANIFEST"],
});
