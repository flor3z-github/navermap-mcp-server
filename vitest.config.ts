import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      NAVER_CLIENT_ID: 'test-client-id',
      NAVER_CLIENT_SECRET: 'test-client-secret',
      NCLOUD_ACCESS_KEY: 'test-access-key',
      NCLOUD_SECRET_KEY: 'test-secret-key',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    include: ['test/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
});
