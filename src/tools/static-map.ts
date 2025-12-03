/**
 * navermap_get_static_map 도구 - 정적 지도 이미지 생성
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StaticMapSchema, type StaticMapInput } from "../schemas/index.js";
import { MapsApiClient, MapsApiError } from "../services/maps-api.js";
import { API_ENDPOINTS } from "../constants.js";

export function registerStaticMapTool(server: McpServer, apiClient: MapsApiClient): void {
  server.tool(
    "navermap_get_static_map",
    "지정한 좌표를 중심으로 정적 지도 이미지를 생성합니다. 마커와 경로 표시가 가능합니다.",
    StaticMapSchema.shape,
    async (args: StaticMapInput) => {
      try {
        const params: Record<string, string | number | undefined> = {
          center: args.center,
          level: args.level ?? 16,
          w: args.w ?? 300,
          h: args.h ?? 300,
          maptype: args.maptype ?? "basic",
          scale: args.scale ?? 1,
        };

        // 마커 설정
        if (args.markers) {
          params.markers = args.markers;
        }

        // 경로 설정
        if (args.path) {
          params.path = args.path;
        }

        const imageBuffer = await apiClient.getBinary(API_ENDPOINTS.STATIC_MAP, params);
        const base64Data = imageBuffer.toString("base64");

        return {
          content: [
            {
              type: "image" as const,
              data: base64Data,
              mimeType: "image/png",
            },
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  중심좌표: args.center,
                  줌레벨: args.level ?? 16,
                  이미지크기: `${args.w ?? 300}x${args.h ?? 300}`,
                  지도유형: args.maptype ?? "basic",
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        if (error instanceof MapsApiError) {
          return {
            content: [
              {
                type: "text" as const,
                text: error.toUserMessage(),
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    }
  );
}
