/**
 * navermap_get_directions 도구 - 경로 탐색
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DirectionsSchema, type DirectionsInput } from "../schemas/index.js";
import { MapsApiClient, MapsApiError } from "../services/maps-api.js";
import { API_ENDPOINTS } from "../constants.js";
import type { DirectionsResponse, DirectionsRoute } from "../types.js";

/**
 * 밀리초를 시간, 분 형식으로 변환
 */
function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
}

/**
 * 미터를 km 또는 m 형식으로 변환
 */
function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${meters}m`;
}

/**
 * 금액을 원화 형식으로 변환
 */
function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

/**
 * 경로 옵션 이름 반환
 */
function getOptionName(option: string): string {
  switch (option) {
    case "trafast":
      return "실시간 빠른길";
    case "tracomfort":
      return "편한길";
    case "traoptimal":
      return "최적";
    case "traavoidtoll":
      return "무료 우선";
    case "traavoidcaronly":
      return "자동차전용도로 회피";
    default:
      return option;
  }
}

/**
 * 경로 요약 생성
 */
function formatRouteSummary(route: DirectionsRoute, option: string) {
  return {
    경로옵션: getOptionName(option),
    총거리: formatDistance(route.summary.distance),
    예상소요시간: formatDuration(route.summary.duration),
    통행료: formatCurrency(route.summary.tollFare),
    택시비예상: formatCurrency(route.summary.taxiFare),
    유류비예상: formatCurrency(route.summary.fuelPrice),
  };
}

export function registerDirectionsTool(server: McpServer, apiClient: MapsApiClient): void {
  server.tool(
    "navermap_get_directions",
    "출발지와 목적지 간의 경로를 탐색합니다. 거리, 소요시간, 통행료, 택시비, 유류비 정보를 제공합니다.",
    DirectionsSchema.shape,
    async (args: DirectionsInput) => {
      try {
        const option = args.option ?? "traoptimal";

        const response = await apiClient.get<DirectionsResponse>(API_ENDPOINTS.DIRECTIONS, {
          start: args.start,
          goal: args.goal,
          waypoints: args.waypoints,
          option,
          cartype: args.cartype,
          fueltype: args.fueltype,
          mileage: args.mileage,
        });

        if (response.code !== 0) {
          let errorMessage = "경로 탐색에 실패했습니다.";
          switch (response.code) {
            case 1:
              errorMessage = "출발지 또는 목적지 좌표가 잘못되었습니다. 좌표를 확인해주세요.";
              break;
            case 2:
              errorMessage = "출발지와 목적지가 너무 가깝습니다.";
              break;
            case 3:
              errorMessage = "경로를 찾을 수 없습니다. 출발지와 목적지가 자동차로 이동 가능한 곳인지 확인해주세요.";
              break;
            case 4:
              errorMessage = "경유지 좌표가 잘못되었습니다. 경유지를 확인해주세요.";
              break;
            case 5:
              errorMessage = "요청이 너무 복잡합니다. 경유지 수를 줄여주세요.";
              break;
          }
          return {
            content: [
              {
                type: "text" as const,
                text: errorMessage,
              },
            ],
            isError: true,
          };
        }

        if (!response.route) {
          return {
            content: [
              {
                type: "text" as const,
                text: "경로를 찾을 수 없습니다. 출발지와 목적지를 확인해주세요.",
              },
            ],
          };
        }

        // 요청한 옵션에 해당하는 경로 추출
        const routeKey = option as keyof NonNullable<DirectionsResponse["route"]>;
        const routes = response.route[routeKey];

        if (!routes || routes.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `'${getOptionName(option)}' 옵션으로 경로를 찾을 수 없습니다. 다른 옵션을 시도해주세요.`,
              },
            ],
          };
        }

        const routeSummary = formatRouteSummary(routes[0], option);

        // 주요 구간 정보 (상위 5개)
        const sections = routes[0].section
          ?.slice(0, 5)
          .map((section, index) => ({
            순서: index + 1,
            구간명: section.name || "(이름 없음)",
            거리: formatDistance(section.distance),
            혼잡도: section.congestion,
          }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  출발지: args.start,
                  목적지: args.goal,
                  경유지: args.waypoints ?? "(없음)",
                  요약: routeSummary,
                  주요구간: sections ?? [],
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
