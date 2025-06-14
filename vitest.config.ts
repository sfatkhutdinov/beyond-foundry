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
    }
  },
  define: {
    // Define environment variables for tests
    __TEST__: true
  }
});
