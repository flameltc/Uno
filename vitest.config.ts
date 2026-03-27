import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@main': path.resolve(rootDir, 'src/main'),
      '@preload': path.resolve(rootDir, 'src/preload'),
      '@renderer': path.resolve(rootDir, 'src/renderer/src'),
      '@shared': path.resolve(rootDir, 'src/shared')
    }
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts']
  }
})
