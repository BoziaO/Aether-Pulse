import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    // Use jsdom environment for Vue component testing
    environment: 'jsdom',

    // Global setup files
    globals: true,

    // Include test files
    include: ['**/*.{test,spec}.{js,ts,vue}'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts', '**/*.config.*', '**/vite.config.*'],
    },

    // Mock CSS imports
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },

    // Setup files
    setupFiles: ['./src/test/setup.ts'],

    // Pass through environment variables
    passThrough: true,

    // Timeout for async tests
    testTimeout: 10000,

    // Hooks timeout
    hookTimeout: 10000,
  },

  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
