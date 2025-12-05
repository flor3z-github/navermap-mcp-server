/**
 * Naver Map MCP Server
 * Server creation and configuration
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getConfig, isBillingApiAvailable, type NaverMapConfig } from './config.js';
import { MapsApiClient } from './services/maps-api.js';
import {
  registerGeocodeTool,
  registerReverseGeocodeTool,
  registerDirectionsTool,
  registerStaticMapTool,
  registerUsageTool,
  TOOL_METADATA,
} from './tools/index.js';
import { getTimestamp } from './utils/formatters.js';

const SERVER_NAME = 'navermap-mcp-server';
const SERVER_VERSION = '1.0.0';

/**
 * Create and configure the MCP server
 */
export function createNaverMapServer(config: NaverMapConfig): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Create Maps API client
  const mapsApiClient = new MapsApiClient(config);

  // Register Maps API tools (always available)
  registerGeocodeTool(server, mapsApiClient);
  registerReverseGeocodeTool(server, mapsApiClient);
  registerDirectionsTool(server, mapsApiClient);
  registerStaticMapTool(server, mapsApiClient);

  // Register Billing API tool (conditional)
  if (isBillingApiAvailable(config)) {
    registerUsageTool(server, config);
  }

  return server;
}

/**
 * Run the MCP server with stdio transport
 */
export async function runServer(): Promise<void> {
  const logLevel = process.env.LOG_LEVEL || 'info';
  const timestamp = getTimestamp();

  console.error(`[${timestamp}] [INFO] Starting ${SERVER_NAME} v${SERVER_VERSION}...`);

  // Load validated configuration
  const config = getConfig();

  // Log configuration status
  if (logLevel === 'debug') {
    console.error(`[${timestamp}] [DEBUG] Configuration loaded successfully`);
    console.error(`[${timestamp}] [DEBUG] Billing API available: ${isBillingApiAvailable(config)}`);
  }

  // Create server
  const server = createNaverMapServer(config);

  // Log tool availability
  const availableTools = Object.keys(TOOL_METADATA).filter((name) => {
    if (name === 'navermap_get_usage') {
      return isBillingApiAvailable(config);
    }
    return true;
  });

  if (isBillingApiAvailable(config)) {
    console.error(`[${timestamp}] [INFO] Billing API 사용 가능 - navermap_get_usage 도구 활성화됨`);
  } else {
    console.error(
      `[${timestamp}] [INFO] Billing API 키 없음 - navermap_get_usage 도구 비활성화됨`
    );
  }

  if (logLevel === 'debug') {
    console.error(`[${timestamp}] [DEBUG] Available tools (${availableTools.length}): ${availableTools.join(', ')}`);
  }

  // Create transport
  const transport = new StdioServerTransport();

  // Connect server to transport
  try {
    await server.connect(transport);
    console.error(`[${timestamp}] [INFO] ${SERVER_NAME} 서버가 시작되었습니다.`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown connection error';
    console.error(`[${timestamp}] [ERROR] Failed to start server: ${errorMsg}`);
    throw error;
  }

  // Handle process termination gracefully
  const cleanup = (signal: string) => {
    console.error(`[${getTimestamp()}] [INFO] Received ${signal}, shutting down...`);
    process.exit(0);
  };

  process.on('SIGINT', () => cleanup('SIGINT'));
  process.on('SIGTERM', () => cleanup('SIGTERM'));
  process.on('SIGQUIT', () => cleanup('SIGQUIT'));
}
