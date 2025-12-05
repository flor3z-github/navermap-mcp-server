/**
 * Tool registry - central export for all tools
 */

export { registerGeocodeTool } from './geocode.js';
export { registerReverseGeocodeTool } from './reverse-geocode.js';
export { registerDirectionsTool } from './directions.js';
export { registerStaticMapTool } from './static-map.js';
export { registerUsageTool } from './usage.js';

/**
 * Tool metadata for documentation and listing
 */
export const TOOL_METADATA = {
  navermap_geocode: {
    name: 'navermap_geocode',
    description: '주소를 좌표(경도, 위도)로 변환합니다. 도로명주소, 지번주소 모두 검색 가능합니다.',
    readOnlyHint: true,
  },
  navermap_reverse_geocode: {
    name: 'navermap_reverse_geocode',
    description:
      '좌표(경도, 위도)를 주소로 변환합니다. 법정동, 행정동, 지번주소, 도로명주소를 조회할 수 있습니다.',
    readOnlyHint: true,
  },
  navermap_get_directions: {
    name: 'navermap_get_directions',
    description:
      '출발지와 목적지 간의 경로를 탐색합니다. 거리, 소요시간, 통행료, 택시비, 유류비 정보를 제공합니다.',
    readOnlyHint: true,
  },
  navermap_get_static_map: {
    name: 'navermap_get_static_map',
    description: '지정한 좌표를 중심으로 정적 지도 이미지를 생성합니다. 마커와 경로 표시가 가능합니다.',
    readOnlyHint: true,
  },
  navermap_get_usage: {
    name: 'navermap_get_usage',
    description:
      'Naver Maps API 사용량, 비용, 무료 한도 대비 사용률을 조회합니다. 월별 사용 현황과 경고를 제공합니다.',
    readOnlyHint: true,
  },
} as const;

export type ToolName = keyof typeof TOOL_METADATA;
