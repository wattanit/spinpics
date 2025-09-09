import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}']
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'SpinPics',
        short_name: 'SpinPics',
        description: 'Create customizable spinning wheel games with your photos',
        theme_color: '#2196F3',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        categories: ['games', 'entertainment', 'utilities'],
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Create New Gallery',
            short_name: 'New Gallery',
            description: 'Create a new photo gallery',
            url: '/?action=new-gallery',
            icons: [
              {
                src: 'icons/icon-192x192.png',
                sizes: '192x192'
              }
            ]
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'storage': ['./src/lib/storage.ts'],
          'wheel': ['./src/lib/wheel.ts', './src/lib/animation.ts']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})