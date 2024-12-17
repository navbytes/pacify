import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'
import * as fs from 'fs'

// Custom plugin to copy manifest and icons
function copyManifestAndIcons() {
  return {
    name: 'copy-manifest-and-icons',
    generateBundle() {
      // Copy manifest.json
      try {
        const manifestContent = fs.readFileSync('manifest.json', 'utf-8')
        this.emitFile({
          type: 'asset',
          fileName: 'manifest.json',
          source: manifestContent,
        })
      } catch (error) {
        console.error('Error copying manifest.json:', error)
      }

      // Copy icons
      const icons = ['icon16.png', 'icon48.png', 'icon128.png']
      icons.forEach((icon) => {
        try {
          const iconPath = resolve(__dirname, 'icons', icon)
          if (fs.existsSync(iconPath)) {
            const source = fs.readFileSync(iconPath)
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
  plugins: [svelte(), copyManifestAndIcons()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'), // Maps "@" to the "src" directory
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        options: resolve(__dirname, 'src/options/options.html'),
        background: resolve(__dirname, 'src/background/background.ts'), // Add background script
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'popup.css') {
            return 'assets/popup.css'
          }
          if (assetInfo.name === 'options.css') {
            return 'assets/options.css'
          }
          return 'assets/[name].[ext]'
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
})
