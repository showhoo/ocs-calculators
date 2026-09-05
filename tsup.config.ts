import { readdirSync } from 'node:fs';
import { defineConfig } from 'tsup';

// 每个计算器模块一个独立入口，支持 `import 'ocs-calculators/wind'` 子路径导入
const moduleEntries = readdirSync(new URL('./src', import.meta.url), { withFileTypes: true })
  .filter((d) => d.isDirectory() && !['common', 'data'].includes(d.name))
  .map((d) => `src/${d.name}/index.ts`);

export default defineConfig({
  entry: ['src/index.ts', ...moduleEntries],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  target: 'es2022',
  splitting: true,
  clean: true,
});
