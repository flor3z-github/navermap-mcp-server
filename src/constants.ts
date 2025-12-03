/**
 * Naver Map MCP Server 상수 정의
 */

// API 엔드포인트
export const API_ENDPOINTS = {
  GEOCODE: "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode",
  REVERSE_GEOCODE: "https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc",
  DIRECTIONS: "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving",
  STATIC_MAP: "https://naveropenapi.apigw.ntruss.com/map-static/v2/raster",
  BILLING: "https://billingapi.apigw.ntruss.com/billing/v1/cost/getProductDemandCostList",
} as const;

// 무료 한도 (월간)
export const FREE_LIMITS: Record<string, number> = {
  "Dynamic Map": 6_000_000,
  "Static Map": 3_000_000,
  "Geocoding": 3_000_000,
  "Reverse Geocoding": 3_000_000,
  "Directions 5": 60_000,
  "Directions 15": 3_000,
};

// 경로 탐색 옵션
export const DIRECTION_OPTIONS = [
  "trafast",      // 실시간 빠른길
  "tracomfort",   // 편한길
  "traoptimal",   // 최적
  "traavoidtoll", // 무료 우선
  "traavoidcaronly", // 자동차 전용도로 회피
] as const;

// 차량 종류
export const CAR_TYPES = [
  1, // 소형차
  2, // 중형차
  3, // 대형차
  4, // 중형화물차
  5, // 대형화물차
  6, // 특수화물차
] as const;

// 연료 종류
export const FUEL_TYPES = [
  "gasoline", // 휘발유
  "highgradegasoline", // 고급휘발유
  "diesel", // 경유
  "lpg", // LPG
] as const;

// Reverse Geocode 순서 옵션
export const REVERSE_GEOCODE_ORDERS = [
  "legalcode",  // 법정동
  "admcode",    // 행정동
  "addr",       // 지번주소
  "roadaddr",   // 도로명주소
] as const;

// 좌표계
export const COORDINATE_SYSTEMS = [
  "epsg:4326",  // WGS84 경위도
  "nhn:2048",   // NHN 좌표계
  "nhn:128",    // NHN 좌표계
] as const;

// 언어
export const LANGUAGES = ["ko", "en", "ja", "zh"] as const;

// 경고 임계값 (%)
export const WARNING_THRESHOLD = 70;
