import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateEnvironment', () => {
    it('should return true when required env vars are set', async () => {
      process.env.NAVER_CLIENT_ID = 'test-id';
      process.env.NAVER_CLIENT_SECRET = 'test-secret';

      const { validateEnvironment } = await import('../../src/config.js');
      expect(validateEnvironment()).toBe(true);
    });

    it('should return false when NAVER_CLIENT_ID is missing', async () => {
      delete process.env.NAVER_CLIENT_ID;
      process.env.NAVER_CLIENT_SECRET = 'test-secret';

      const { validateEnvironment } = await import('../../src/config.js');
      expect(validateEnvironment()).toBe(false);
    });

    it('should return false when NAVER_CLIENT_SECRET is missing', async () => {
      process.env.NAVER_CLIENT_ID = 'test-id';
      delete process.env.NAVER_CLIENT_SECRET;

      const { validateEnvironment } = await import('../../src/config.js');
      expect(validateEnvironment()).toBe(false);
    });
  });

  describe('isBillingApiAvailable', () => {
    it('should return true when both ncloud keys are set', async () => {
      process.env.NAVER_CLIENT_ID = 'test-id';
      process.env.NAVER_CLIENT_SECRET = 'test-secret';
      process.env.NCLOUD_ACCESS_KEY = 'access-key';
      process.env.NCLOUD_SECRET_KEY = 'secret-key';

      const { loadConfig, isBillingApiAvailable } = await import('../../src/config.js');
      const config = loadConfig();
      expect(isBillingApiAvailable(config)).toBe(true);
    });

    it('should return false when ncloud keys are missing', async () => {
      process.env.NAVER_CLIENT_ID = 'test-id';
      process.env.NAVER_CLIENT_SECRET = 'test-secret';
      delete process.env.NCLOUD_ACCESS_KEY;
      delete process.env.NCLOUD_SECRET_KEY;

      const { loadConfig, isBillingApiAvailable } = await import('../../src/config.js');
      const config = loadConfig();
      expect(isBillingApiAvailable(config)).toBe(false);
    });
  });

  describe('loadConfig', () => {
    it('should load config with default values', async () => {
      process.env.NAVER_CLIENT_ID = 'test-id';
      process.env.NAVER_CLIENT_SECRET = 'test-secret';

      const { loadConfig } = await import('../../src/config.js');
      const config = loadConfig();

      expect(config.naver.clientId).toBe('test-id');
      expect(config.naver.clientSecret).toBe('test-secret');
      expect(config.logging.level).toBe('info');
      expect(config.request.timeout).toBe(30000);
      expect(config.request.maxRetries).toBe(3);
    });

    it('should load custom timeout and retries', async () => {
      process.env.NAVER_CLIENT_ID = 'test-id';
      process.env.NAVER_CLIENT_SECRET = 'test-secret';
      process.env.REQUEST_TIMEOUT = '60000';
      process.env.MAX_RETRIES = '5';

      const { loadConfig } = await import('../../src/config.js');
      const config = loadConfig();

      expect(config.request.timeout).toBe(60000);
      expect(config.request.maxRetries).toBe(5);
    });

    it('should load log level from environment', async () => {
      process.env.NAVER_CLIENT_ID = 'test-id';
      process.env.NAVER_CLIENT_SECRET = 'test-secret';
      process.env.LOG_LEVEL = 'debug';

      const { loadConfig } = await import('../../src/config.js');
      const config = loadConfig();

      expect(config.logging.level).toBe('debug');
    });
  });
});
