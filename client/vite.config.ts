/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'node:url'
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const port = Number(process.env.CLIENT_PORT) || 5174
// Default server port is 3000 (from server's default configuration)
const serverPort = process.env.SERVER_PORT || process.env.PORT || '3000'
const apiTarget = process.env.API_TARGET || `http://localhost:${serverPort}`
const basePath = process.env.BASE_PATH || '/'
const isLocalWrapper = process.env.LOCAL_WRAPPER === 'true'

export default defineConfig({
  base: isLocalWrapper ? './' : basePath,
  define: {
    global: 'globalThis',
  },

  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'socket.io-client', 'lucide-vue-next', '@vueuse/core'],
  },

  css: {
    transformer: 'lightningcss',
  },

  plugins: [
    vue(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' && process.env.REPL_ID !== undefined
      ? [await import('@replit/vite-plugin-dev-banner').then((m) => m.devBanner())]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      util: 'util-browser',
    },
  },
  root: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large vendor chunks for better performance
          vue: ['vue', 'vue-router', 'pinia'],
          socket: ['socket.io-client'],
          webrtc: ['simple-peer'],
          lucide: ['lucide-vue-next'],
          vueuse: ['@vueuse/core'],
        },
      },
    },
    // Enable minification for better performance
    minify: 'esbuild',
    // Generate source maps for debugging
    sourcemap: process.env.NODE_ENV === 'development',
    // Optimize for performance
    cssMinify: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: { strict: true },
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
})
