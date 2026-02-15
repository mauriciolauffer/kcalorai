import esbuild from 'esbuild';
import Typia from '@ryoppippi/unplugin-typia/esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  format: 'esm',
  target: 'esnext',
  minify: true,
  sourcemap: true,
  plugins: [Typia()],
  external: ['__STATIC_CONTENT_MANIFEST'],
});
