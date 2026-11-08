import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const MOCK_MARKER = 'mypay-mock:'

/**
 * Production builds fold `USE_MOCK` to false and delete the import() call, but
 * Vite still emits the mock chunks. Remove those files, and fail the build if a
 * chunk that is still shipped points at them.
 */
function dropUnreachableMockChunks(): Plugin {
  return {
    name: 'drop-unreachable-mock-chunks',
    apply: 'build',
    generateBundle(_options, bundle) {
      const baseName = (fileName: string) => fileName.split('/').pop() ?? fileName
      const chunks = Object.entries(bundle).flatMap(([fileName, output]) =>
        output.type === 'chunk' ? [[fileName, output] as const] : [],
      )
      const tainted = new Set(
        chunks.filter(([, chunk]) => chunk.code.includes(MOCK_MARKER)).map(([fileName]) => fileName),
      )
      let grew = true
      while (grew) {
        grew = false
        for (const [fileName, chunk] of chunks) {
          if (tainted.has(fileName)) continue
          const importsTainted = [...tainted].some((name) => chunk.code.includes(baseName(name)))
          if (!importsTainted) continue
          tainted.add(fileName)
          grew = true
        }
      }
      for (const [fileName, output] of Object.entries(bundle)) {
        if (tainted.has(fileName)) continue
        const source = output.type === 'chunk' ? output.code : typeof output.source === 'string' ? output.source : ''
        for (const name of tainted) {
          if (source.includes(baseName(name))) {
            this.error(`Mock code is reachable from the production bundle via ${name}`)
          }
        }
      }
      for (const fileName of tainted) delete bundle[fileName]
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), dropUnreachableMockChunks()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
