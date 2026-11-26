import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/test-setup.js'],
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'controllers/**/*.js',
        'middlewares/**/*.js',
        'models/**/*.js',
        'routes/**/*.js',
        'utils/**/*.js',
      ],
      exclude: ['node_modules/**', 'tests/**', 'utils/seed.js'],
    },
  },
});