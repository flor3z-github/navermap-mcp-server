/**
 * navermap_reverse_geocode 도구 - 좌표 → 주소 변환
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ReverseGeocodeSchema, type ReverseGeocodeInput } from "../schemas/index.js";
import { MapsApiClient, MapsApiError } from "../services/maps-api.js";
import { API_ENDPOINTS } from "../constants.js";
import type { ReverseGeocodeResponse, ReverseGeocodeResult } from "../types.js";

/**
 * 결과를 사람이 읽기 쉬운 주소로 변환
 */
function formatAddress(result: ReverseGeocodeResult): string {
  const region = result.region;
  const parts: string[] = [];

  if (region.area1?.name) parts.push(region.area1.name);
  if (region.area2?.name) parts.push(region.area2.name);
  if (region.area3?.name) parts.push(region.area3.name);
  if (region.area4?.name) parts.push(region.area4.name);

  if (result.land) {
    if (result.name === "roadaddr") {
      // 도로명주소
      if (result.land.name) parts.push(result.land.name);
      if (result.land.number1) {
        let num = result.land.number1;
        if (result.land.number2) num += `-${result.land.number2}`;
        parts.push(num);
      }
    } else {
      // 지번주소
      if (result.land.number1) {
        let num = result.land.number1;
        if (result.land.number2) num += `-${result.land.number2}`;
        parts.push(num);
      }
    }
  }

  return parts.join(" ");
}

/**
 * 주소 타입 이름 반환
 */
function getTypeName(name: string): string {
  switch (name) {
    case "legalcode":
      return "법정동";
    case "admcode":
      return "행정동";
    case "addr":
      return "지번주소";
    case "roadaddr":
      return "도로명주소";
    default:
      return name;
  }
}

export function registerReverseGeocodeTool(server: McpServer, apiClient: MapsApiClient): void {
  server.tool(
    "navermap_reverse_geocode",
    "좌표(경도, 위도)를 주소로 변환합니다. 법정동, 행정동, 지번주소, 도로명주소를 조회할 수 있습니다.",
    ReverseGeocodeSchema.shape,
    async (args: ReverseGeocodeInput) => {
      try {
        const response = await apiClient.get<ReverseGeocodeResponse>(
          API_ENDPOINTS.REVERSE_GEOCODE,
          {
            coords: args.coords,
            sourcecrs: args.sourcecrs,
            targetcrs: args.targetcrs,
            orders: args.orders ?? "roadaddr,addr,admcode,legalcode",
            output: args.output ?? "json",
          }
        );

        if (response.status.code !== 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `좌표 변환에 실패했습니다: ${response.status.message}`,
              },
            ],
            isError: true,
          };
        }

        if (response.results.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `좌표 '${args.coords}'에 해당하는 주소를 찾을 수 없습니다. 좌표가 한국 내인지 확인해주세요.`,
              },
            ],
          };
        }

        const results = response.results.map((result) => ({
          유형: getTypeName(result.name),
          코드: result.code.id,
          주소: formatAddress(result),
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  입력좌표: args.coords,
                  결과: results,
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
