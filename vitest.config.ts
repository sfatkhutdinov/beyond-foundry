import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
    exclude: [
      'node_modules/**',
      'build/**',
      'reference/**',
      'analysis/**',
      'debug/**',
      'tests/test-*.js' // Legacy test files
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'build/**',
        'reference/**',
        'tests/**',
        'tools/**',
        'scripts/**',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    },
    globals: {
      // FoundryVTT globals for testing
      game: 'readonly',
      ui: 'readonly',
      canvas: 'readonly',
      foundry: 'readonly',
      Hooks: 'readonly',
      Actor: 'readonly',
      Item: 'readonly',
      Scene: 'readonly',
      Application: 'readonly',
      Dialog: 'readonly',
      FormApplication: 'readonly'
    }
  },
  define: {
    // Define environment variables for tests
    __TEST__: true
  }
});
