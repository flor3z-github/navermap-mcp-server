#!/usr/bin/env node
/**
 * Naver Map MCP Server
 * 네이버 지도 API를 MCP 도구로 제공하는 서버
 */

import { validateEnvironment } from './config.js';
import { runServer } from './server.js';
import { getTimestamp } from './utils/formatters.js';

async function main(): Promise<void> {
  // Validate environment before starting
  if (!validateEnvironment()) {
    process.exit(1);
  }

  try {
    await runServer();
  } catch (error) {
    const timestamp = getTimestamp();
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${timestamp}] [ERROR] Fatal error: ${errorMsg}`);

    if (error instanceof Error && error.stack && process.env.LOG_LEVEL === 'debug') {
      console.error(`[${timestamp}] [DEBUG] Stack trace:`, error.stack);
    }

    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(`[${getTimestamp()}] [ERROR] Uncaught exception:`, error.message);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error(`[${getTimestamp()}] [ERROR] Unhandled rejection:`, reason);
  process.exit(1);
});

main();
