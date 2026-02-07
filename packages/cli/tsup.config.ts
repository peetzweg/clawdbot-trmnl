import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node18',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // Shebang in src/index.ts is preserved; tsup makes output executable
});
