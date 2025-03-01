import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
} from 'fs'

// Helper to copy manifest and assets
function copyAssets() {
  return {
    name: 'copy-assets',
    buildEnd() {
      try {
        // Copy manifest
        const manifest = readFileSync('manifest.json', 'utf-8')
        this.emitFile({
          type: 'asset',
          fileName: 'manifest.json',
          source: manifest,
        })

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
      } catch (error) {
        console.error('Error copying assets:', error)
      }
    },
  }
}

// Helper to setup development environment
function setupDevEnvironment() {
  return {
    name: 'setup-dev-environment',
    buildStart() {
      if (process.env.NODE_ENV === 'development') {
        try {
          // Create dev directory if it doesn't exist
          if (!existsSync('dev')) {
            mkdirSync('dev')
          }

          // Copy manifest with development modifications
          const manifest = JSON.parse(readFileSync('manifest.json', 'utf-8'))
          const devManifest = {
            ...manifest,
            name: `[DEV] ${manifest.name}`,
            content_security_policy: {
              extension_pages:
                "script-src 'self' 'wasm-unsafe-eval' http://localhost:*; object-src 'self'",
            },
          }
          writeFileSync(
            'dev/manifest.json',
            JSON.stringify(devManifest, null, 2)
          )

          // Copy icons with dev overlay
          if (!existsSync('dev/icons')) {
            mkdirSync('dev/icons')
          }

          const icons = ['icon16.png', 'icon48.png', 'icon128.png']
          icons.forEach((icon) => {
            const iconPath = resolve(__dirname, 'icons', icon)
            if (existsSync(iconPath)) {
              copyFileSync(iconPath, `dev/icons/${icon}`)
              // Here you could also modify the icon to show it's a dev version
              // e.g., add a colored overlay
            }
          })

          // Copy _locales
          if (!existsSync('dev/_locales')) {
            mkdirSync('dev/_locales', { recursive: true })
          }

          const localesDir = resolve(__dirname, '_locales')
          if (existsSync(localesDir)) {
            const locales = readdirSync(localesDir)
            locales.forEach((locale) => {
              if (!existsSync(`dev/_locales/${locale}`)) {
                mkdirSync(`dev/_locales/${locale}`, { recursive: true })
              }

              const messagesPath = resolve(localesDir, locale, 'messages.json')
              if (existsSync(messagesPath)) {
                copyFileSync(
                  messagesPath,
                  `dev/_locales/${locale}/messages.json`
                )
              }
            })
          }

          console.log('✅ Development environment set up successfully')
        } catch (error) {
          console.error('Error setting up dev environment:', error)
        }
      }
    },
  }
}

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  const isDevelopment = mode === 'development'

  return {
    plugins: [svelte(), isProduction ? copyAssets() : setupDevEnvironment()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __DEV_MODE__: JSON.stringify(!isProduction),
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
          dir: isProduction ? 'dist' : 'dev',
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: ({ name }) => {
            // Keep HTML files at root of assets folder
            if (name?.endsWith('.html')) {
              return 'assets/[name].[ext]'
            }
            return 'assets/[name].[hash].[ext]'
          },
          manualChunks: {
            monaco: ['monaco-editor'],
            vendor: [
              'svelte',
              'lucide-svelte',
              // other third-party libraries
            ],
          },
        },
      },
      outDir: isProduction ? 'dist' : 'dev',
      emptyOutDir: true,
      sourcemap: !isProduction,
      minify: isProduction,
      assetsInlineLimit: 0,
      cssCodeSplit: true,
      reportCompressedSize: isProduction,
    },
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        port: 5173,
        clientPort: 5173,
      },
      watch: {
        // Watch for changes in the source files
        ignored: ['**/node_modules/**', '**/dist/**', '**/dev/**'],
      },
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
  }
})
