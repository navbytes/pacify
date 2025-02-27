import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
} from 'fs'

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

      // Copy _locales directory
      const localesDir = resolve(__dirname, '_locales')
      if (existsSync(localesDir)) {
        const locales = readdirSync(localesDir)
        locales.forEach((locale) => {
          const messagesPath = resolve(localesDir, locale, 'messages.json')
          if (existsSync(messagesPath)) {
            const source = readFileSync(messagesPath)
            this.emitFile({
              type: 'asset',
              fileName: `_locales/${locale}/messages.json`,
              source,
            })
          }
        })
      }
    },
  }
}

// Helper function to copy manifest and modify it for dev mode
function copyManifestDev() {
  return {
    name: 'copy-manifest-dev',
    buildStart() {
      if (process.env.NODE_ENV === 'development') {
        try {
          // Read the original manifest
          const manifest = JSON.parse(readFileSync('manifest.json', 'utf-8'))

          // Modify manifest for development
          const devManifest = {
            ...manifest,
            content_security_policy: {
              extension_pages:
                "script-src 'self' 'wasm-unsafe-eval' http://localhost:5173; object-src 'self'",
            },
          }

          // Ensure dev directory exists
          if (!existsSync('dev')) {
            mkdirSync('dev')
          }

          // Write modified manifest to dev directory
          writeFileSync(
            'dev/manifest.json',
            JSON.stringify(devManifest, null, 2)
          )

          // Copy icons to dev directory
          const icons = ['icon16.png', 'icon48.png', 'icon128.png']
          if (!existsSync('dev/icons')) {
            mkdirSync('dev/icons')
          }

          icons.forEach((icon) => {
            const iconPath = resolve(__dirname, 'icons', icon)
            if (existsSync(iconPath)) {
              const iconContent = readFileSync(iconPath)
              writeFileSync(`dev/icons/${icon}`, iconContent)
            }
          })
        } catch (error) {
          console.error('Error setting up dev environment:', error)
        }
      }
    },
  }
}

export default defineConfig(({ command }) => {
  const isProduction = command === 'build'

  return {
    plugins: [svelte(), isProduction ? copyManifest() : copyManifestDev()],
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
            'monaco-editor': ['monaco-editor/esm/vs/editor/editor.api'],
            // Include only the editor worker
            'editor.worker': ['monaco-editor/esm/vs/editor/editor.worker'],
          },
        },
      },
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: !isProduction,
      assetsInlineLimit: 0,
      cssCodeSplit: true,
    },
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        port: 5173,
      },
    },
    optimizeDeps: {
      include: ['monaco-editor/esm/vs/editor/editor.api'],
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
  }
})
