import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, '.vercel/output')

rmSync(out, { recursive: true, force: true })

const web = spawnSync('npm', ['run', 'build', '-w', 'frontend'], { cwd: root, stdio: 'inherit' })
if (web.status !== 0) process.exit(web.status ?? 1)

cpSync(resolve(root, 'frontend/dist'), resolve(out, 'static'), { recursive: true })

const fn = resolve(out, 'functions/api.func')
mkdirSync(fn, { recursive: true })
await esbuild.build({
  absWorkingDir: root,
  entryPoints: ['backend/src/vercel.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  outfile: resolve(fn, 'index.mjs'),
  alias: {
    '@my-pay/engine': resolve(root, 'packages/engine/src/index.ts'),
  },
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
})

writeFileSync(resolve(fn, '.vc-config.json'), JSON.stringify({
  runtime: 'nodejs22.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs',
  shouldAddHelpers: false,
  regions: ['syd1'],
}, null, 2))

writeFileSync(
  resolve(out, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        {
          src: '/(.*)',
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
          },
          continue: true,
        },
        { src: '/api/(.*)', dest: '/api' },
        { handle: 'filesystem' },
        { src: '/(.*)', dest: '/index.html' },
      ],
    },
    null,
    2,
  ),
)
