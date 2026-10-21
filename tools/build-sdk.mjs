// 构建棋牌核心 SDK
// 运行：node tools/build-sdk.mjs
// 产物：dist/sdk.esm.js(+按需分包) / dist/sdk.global.js / dist/sdk.cjs / dist/sdk.d.ts
//
// 依赖全局安装的 esbuild（npm install -g esbuild）。

import { spawnSync } from 'node:child_process';
import { mkdir, copyFile } from 'node:fs/promises';

const ENTRY = 'src/sdk/index.js';
const OUTDIR = 'dist';

function esbuild(args) {
  const r = spawnSync('esbuild', args, { stdio: 'inherit', shell: false });
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status || 1);
}

const common = [ENTRY, '--bundle', '--platform=neutral', '--target=es2020', '--log-level=info'];

await mkdir(OUTDIR, { recursive: true });

// ESM：保留按需分包（每种棋一个 chunk，打开时才加载）
esbuild([...common, '--format=esm', '--splitting', `--outdir=${OUTDIR}`, '--entry-names=sdk.esm']);

// 浏览器全局：单文件，动态 import 内联进包
esbuild([...common, '--format=iife', '--global-name=ArenaSDK', `--outfile=${OUTDIR}/sdk.global.js`]);

// Node CommonJS：单文件
esbuild([...common, '--format=cjs', `--outfile=${OUTDIR}/sdk.cjs`]);

// 浏览器单文件包（含默认皮肤，供外部页面 <script> 直接引用）
await mkdir('sdk', { recursive: true });
esbuild([
  'src/sdk/browser.js', '--bundle', '--platform=browser', '--target=es2019',
  '--format=iife', '--global-name=Arena', '--minify',
  '--outfile=sdk/arena.js', '--log-level=info',
]);

await copyFile('src/sdk/index.d.ts', `${OUTDIR}/sdk.d.ts`);

console.log('SDK 构建完成 -> dist/');
