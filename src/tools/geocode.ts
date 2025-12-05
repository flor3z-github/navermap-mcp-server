/**
 * navermap_geocode 도구 - 주소 → 좌표 변환
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GeocodeSchema, type GeocodeInput } from '../schemas/index.js';
import { MapsApiClient, MapsApiError } from '../services/maps-api.js';
import { createErrorResponse } from '../utils/errors.js';
import { API_ENDPOINTS } from '../constants.js';
import type { GeocodeResponse } from '../types.js';

export function registerGeocodeTool(server: McpServer, apiClient: MapsApiClient): void {
  server.tool(
    'navermap_geocode',
    '주소를 좌표(경도, 위도)로 변환합니다. 도로명주소, 지번주소 모두 검색 가능합니다.',
    GeocodeSchema.shape,
    async (args: GeocodeInput) => {
      try {
        const response = await apiClient.get<GeocodeResponse>(API_ENDPOINTS.GEOCODE, {
          query: args.query,
          coordinate: args.coordinate,
          filter: args.filter,
          page: args.page,
          count: args.count,
          language: args.language,
        });

        if (response.status !== 'OK') {
          return {
            content: [
              {
                type: 'text' as const,
                text: `주소 검색에 실패했습니다: ${response.errorMessage ?? '알 수 없는 오류'}`,
              },
            ],
            isError: true,
          };
        }

        if (response.addresses.length === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `'${args.query}'에 해당하는 주소를 찾을 수 없습니다. 다른 검색어로 시도해주세요.`,
              },
            ],
          };
        }

        const results = response.addresses.map((addr, index) => ({
          순번: index + 1,
          도로명주소: addr.roadAddress || '(없음)',
          지번주소: addr.jibunAddress || '(없음)',
          경도: addr.x,
          위도: addr.y,
        }));

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  총검색결과: response.meta.totalCount,
                  현재페이지: response.meta.page,
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
                type: 'text' as const,
                text: error.toUserMessage(),
              },
            ],
            isError: true,
          };
        }
        return createErrorResponse(error);
      }
    }
  );
}
