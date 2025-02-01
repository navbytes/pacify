import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'
import { existsSync, readFileSync } from 'fs'

// Simplified copy manifest plugin
function copyManifest() {
  return {
    name: 'copy-manifest',
    buildEnd() {
      try {
        const manifest = readFileSync('manifest.json', 'utf-8')
        this.emitFile({
          type: 'asset',
          fileName: 'manifest.json',
          source: manifest,
        })
      } catch (error) {
        console.error('Error copying manifest:', error)
      }

      // Copy icons
      const icons = ['icon16.png', 'icon48.png', 'icon128.png']
      icons.forEach((icon) => {
        try {
          const iconPath = resolve(__dirname, 'icons', icon)
          if (existsSync(iconPath)) {
            const source = readFileSync(iconPath)
            this.emitFile({
              type: 'asset',
              fileName: `icons/${icon}`,
              source,
            })
          } else {
            console.warn(`Warning: Icon ${icon} not found at ${iconPath}`)
          }
        } catch (error) {
          console.warn(`Warning: Error copying icon ${icon}:`, error)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [svelte(), copyManifest()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        options: resolve(__dirname, 'src/options/options.html'),
        background: resolve(__dirname, 'src/background/background.ts'),
      },
      output: {
        dir: 'dist',
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[ext]',
        manualChunks: {
          'monaco-editor': ['monaco-editor'],
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    // Ensure we don't inline assets as data URLs
    assetsInlineLimit: 0,
    // Generate separate CSS files
    cssCodeSplit: true,
  },
  optimizeDeps: {
    exclude: [
      'monaco-editor/esm/vs/language/typescript/ts.worker',
      'monaco-editor/esm/vs/language/html/html.worker',
      'monaco-editor/esm/vs/language/css/css.worker',
      'monaco-editor/esm/vs/language/json/json.worker',
    ],
  },
  worker: {
    format: 'es',
  },
})
