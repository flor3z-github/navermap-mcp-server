/**
 * Zod 스키마 정의 - 모든 도구 입력값 검증
 */

import { z } from "zod";

// 좌표 형식 검증 (경도,위도)
const coordinatePattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;

// Geocode 스키마
export const GeocodeSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe("검색할 주소 (예: '서울특별시 강남구 테헤란로 152')"),
  coordinate: z
    .string()
    .regex(coordinatePattern, "좌표 형식은 '경도,위도'여야 합니다")
    .optional()
    .describe("검색 중심 좌표 (경도,위도 형식, 예: '127.0368,37.5085')"),
  filter: z
    .string()
    .optional()
    .describe("검색 결과 필터 (예: 'HCODE:1168000000' - 강남구만 검색)"),
  language: z
    .enum(["ko", "en", "ja", "zh"])
    .optional()
    .describe("응답 언어 (ko: 한국어, en: 영어, ja: 일본어, zh: 중국어)"),
  page: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("페이지 번호 (기본값: 1)"),
  count: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("한 페이지당 결과 수 (기본값: 10, 최대: 100)"),
}).strict();

// Reverse Geocode 스키마
export const ReverseGeocodeSchema = z.object({
  coords: z
    .string()
    .regex(coordinatePattern, "좌표 형식은 '경도,위도'여야 합니다")
    .describe("변환할 좌표 (경도,위도 형식, 예: '127.0368,37.5085')"),
  sourcecrs: z
    .enum(["epsg:4326", "nhn:2048", "nhn:128"])
    .optional()
    .describe("입력 좌표계 (기본값: epsg:4326 - WGS84)"),
  targetcrs: z
    .enum(["epsg:4326", "nhn:2048", "nhn:128"])
    .optional()
    .describe("출력 좌표계 (기본값: epsg:4326 - WGS84)"),
  orders: z
    .string()
    .optional()
    .describe("응답 순서 (쉼표로 구분: legalcode,admcode,addr,roadaddr). legalcode: 법정동, admcode: 행정동, addr: 지번주소, roadaddr: 도로명주소"),
  output: z
    .enum(["json", "xml"])
    .optional()
    .describe("응답 형식 (기본값: json)"),
}).strict();

// Directions 스키마
export const DirectionsSchema = z.object({
  start: z
    .string()
    .regex(coordinatePattern, "좌표 형식은 '경도,위도'여야 합니다")
    .describe("출발지 좌표 (경도,위도 형식, 예: '127.0368,37.5085')"),
  goal: z
    .string()
    .regex(coordinatePattern, "좌표 형식은 '경도,위도'여야 합니다")
    .describe("목적지 좌표 (경도,위도 형식, 예: '126.9784,37.5666')"),
  waypoints: z
    .string()
    .optional()
    .describe("경유지 좌표 (최대 5개, '|'로 구분, 예: '127.0000,37.5000|127.0100,37.5100')"),
  option: z
    .enum(["trafast", "tracomfort", "traoptimal", "traavoidtoll", "traavoidcaronly"])
    .optional()
    .describe("경로 옵션: trafast(실시간 빠른길), tracomfort(편한길), traoptimal(최적), traavoidtoll(무료 우선), traavoidcaronly(자동차 전용도로 회피)"),
  cartype: z
    .number()
    .int()
    .min(1)
    .max(6)
    .optional()
    .describe("차량 종류 (1: 소형차, 2: 중형차, 3: 대형차, 4: 중형화물차, 5: 대형화물차, 6: 특수화물차)"),
  fueltype: z
    .enum(["gasoline", "highgradegasoline", "diesel", "lpg"])
    .optional()
    .describe("연료 종류 (gasoline: 휘발유, highgradegasoline: 고급휘발유, diesel: 경유, lpg: LPG)"),
  mileage: z
    .number()
    .positive()
    .optional()
    .describe("연비 (km/L, 유류비 계산에 사용)"),
}).strict();

// Static Map 스키마
export const StaticMapSchema = z.object({
  center: z
    .string()
    .regex(coordinatePattern, "좌표 형식은 '경도,위도'여야 합니다")
    .describe("지도 중심 좌표 (경도,위도 형식, 예: '127.0368,37.5085')"),
  level: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .describe("줌 레벨 (1~20, 기본값: 16)"),
  w: z
    .number()
    .int()
    .min(1)
    .max(1024)
    .optional()
    .describe("이미지 너비 (픽셀, 기본값: 300, 최대: 1024)"),
  h: z
    .number()
    .int()
    .min(1)
    .max(1024)
    .optional()
    .describe("이미지 높이 (픽셀, 기본값: 300, 최대: 1024)"),
  maptype: z
    .enum(["basic", "traffic", "satellite", "satellite_base", "terrain"])
    .optional()
    .describe("지도 유형: basic(일반), traffic(교통), satellite(위성), satellite_base(위성+라벨), terrain(지형)"),
  markers: z
    .string()
    .optional()
    .describe("마커 설정 (형식: 'type:d|size:mid|pos:경도 위도|color:red')"),
  path: z
    .string()
    .optional()
    .describe("경로 설정 (형식: 'color:0x0000FF|weight:5|경도1 위도1,경도2 위도2')"),
  scale: z
    .number()
    .int()
    .min(1)
    .max(2)
    .optional()
    .describe("이미지 스케일 (1 또는 2, 기본값: 1)"),
}).strict();

// Usage 스키마
export const UsageSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "월 형식은 'YYYY-MM'이어야 합니다")
    .optional()
    .describe("조회할 월 (YYYY-MM 형식, 기본값: 당월, 예: '2024-12')"),
}).strict();

// 타입 추론
export type GeocodeInput = z.infer<typeof GeocodeSchema>;
export type ReverseGeocodeInput = z.infer<typeof ReverseGeocodeSchema>;
export type DirectionsInput = z.infer<typeof DirectionsSchema>;
export type StaticMapInput = z.infer<typeof StaticMapSchema>;
export type UsageInput = z.infer<typeof UsageSchema>;
