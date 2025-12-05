/**
 * Configuration module with Zod validation
 * Validates environment variables at startup
 */

import { z } from 'zod';

// Configuration schema
const configSchema = z.object({
  naver: z.object({
    clientId: z.string().min(1, 'NAVER_CLIENT_ID is required'),
    clientSecret: z.string().min(1, 'NAVER_CLIENT_SECRET is required'),
  }),
  ncloud: z.object({
    accessKey: z.string().optional(),
    secretKey: z.string().optional(),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }),
  request: z.object({
    timeout: z.number().default(30000),
    maxRetries: z.number().default(3),
  }),
}).refine(
  (config) => {
    // If one ncloud key is provided, both must be provided
    const hasAccessKey = !!config.ncloud.accessKey;
    const hasSecretKey = !!config.ncloud.secretKey;
    return (hasAccessKey && hasSecretKey) || (!hasAccessKey && !hasSecretKey);
  },
  {
    message: 'Both NCLOUD_ACCESS_KEY and NCLOUD_SECRET_KEY must be provided together for billing API',
  }
);

export type NaverMapConfig = z.infer<typeof configSchema>;

/**
 * Check if billing API is available
 */
export function isBillingApiAvailable(config: NaverMapConfig): boolean {
  return Boolean(config.ncloud.accessKey && config.ncloud.secretKey);
}

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): NaverMapConfig {
  const rawConfig = {
    naver: {
      clientId: process.env.NAVER_CLIENT_ID || '',
      clientSecret: process.env.NAVER_CLIENT_SECRET || '',
    },
    ncloud: {
      accessKey: process.env.NCLOUD_ACCESS_KEY,
      secretKey: process.env.NCLOUD_SECRET_KEY,
    },
    logging: {
      level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    },
    request: {
      timeout: process.env.REQUEST_TIMEOUT
        ? parseInt(process.env.REQUEST_TIMEOUT, 10)
        : 30000,
      maxRetries: process.env.MAX_RETRIES
        ? parseInt(process.env.MAX_RETRIES, 10)
        : 3,
    },
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] [ERROR] Configuration validation failed:`);
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Validate environment before starting server
 * Returns true if valid, false otherwise
 */
export function validateEnvironment(): boolean {
  const required = ['NAVER_CLIENT_ID', 'NAVER_CLIENT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    const timestamp = new Date().toISOString();
    console.error(
      `[${timestamp}] [ERROR] Missing required environment variables: ${missing.join(', ')}`
    );
    return false;
  }

  return true;
}

// Export validated configuration singleton
let _config: NaverMapConfig | null = null;

export function getConfig(): NaverMapConfig {
  if (!_config) {
    _config = loadConfig();
  }
  return _config;
}
