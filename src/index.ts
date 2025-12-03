#!/usr/bin/env node
/**
 * Naver Map MCP Server
 * 네이버 지도 API를 MCP 도구로 제공하는 서버
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadEnvConfig, isBillingApiAvailable, MapsApiClient } from "./services/maps-api.js";
import { registerGeocodeTool } from "./tools/geocode.js";
import { registerReverseGeocodeTool } from "./tools/reverse-geocode.js";
import { registerDirectionsTool } from "./tools/directions.js";
import { registerStaticMapTool } from "./tools/static-map.js";
import { registerUsageTool } from "./tools/usage.js";

async function main(): Promise<void> {
  // 환경변수 로드 및 검증
  let config;
  try {
    config = loadEnvConfig();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[navermap-mcp-server] 초기화 실패: ${error.message}`);
    }
    process.exit(1);
  }

  // MCP 서버 생성
  const server = new McpServer({
    name: "navermap-mcp-server",
    version: "1.0.0",
  });

  // Maps API 클라이언트 생성
  const mapsApiClient = new MapsApiClient(config);

  // 도구 등록 (Maps API - 필수)
  registerGeocodeTool(server, mapsApiClient);
  registerReverseGeocodeTool(server, mapsApiClient);
  registerDirectionsTool(server, mapsApiClient);
  registerStaticMapTool(server, mapsApiClient);

  // 도구 등록 (Billing API - 선택)
  if (isBillingApiAvailable(config)) {
    registerUsageTool(server, config);
    console.error("[navermap-mcp-server] Billing API 사용 가능 - navermap_get_usage 도구 활성화됨");
  } else {
    console.error(
      "[navermap-mcp-server] Billing API 키 없음 - navermap_get_usage 도구 비활성화됨"
    );
  }

  // stdio 전송 시작
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[navermap-mcp-server] 서버가 시작되었습니다.");
}

main().catch((error) => {
  console.error("[navermap-mcp-server] 치명적 오류:", error);
  process.exit(1);
});
