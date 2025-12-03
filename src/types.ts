/**
 * Naver Map MCP Server 타입 정의
 */

// 환경변수 설정
export interface EnvConfig {
  naverClientId: string;
  naverClientSecret: string;
  ncloudAccessKey?: string;
  ncloudSecretKey?: string;
}

// Geocode API 응답
export interface GeocodeAddress {
  roadAddress: string;
  jibunAddress: string;
  englishAddress: string;
  x: string;
  y: string;
  distance: number;
  addressElements: AddressElement[];
}

export interface AddressElement {
  types: string[];
  longName: string;
  shortName: string;
  code: string;
}

export interface GeocodeResponse {
  status: string;
  meta: {
    totalCount: number;
    page: number;
    count: number;
  };
  addresses: GeocodeAddress[];
  errorMessage?: string;
}

// Reverse Geocode API 응답
export interface ReverseGeocodeResult {
  name: string;
  code: {
    id: string;
    type: string;
    mappingId: string;
  };
  region: {
    area0: AreaInfo;
    area1: AreaInfo;
    area2: AreaInfo;
    area3: AreaInfo;
    area4: AreaInfo;
  };
  land?: LandInfo;
}

export interface AreaInfo {
  name: string;
  coords: {
    center: {
      crs: string;
      x: number;
      y: number;
    };
  };
  alias?: string;
}

export interface LandInfo {
  type: string;
  number1: string;
  number2: string;
  addition0: {
    type: string;
    value: string;
  };
  addition1: {
    type: string;
    value: string;
  };
  addition2: {
    type: string;
    value: string;
  };
  addition3: {
    type: string;
    value: string;
  };
  addition4: {
    type: string;
    value: string;
  };
  name?: string;
}

export interface ReverseGeocodeResponse {
  status: {
    code: number;
    name: string;
    message: string;
  };
  results: ReverseGeocodeResult[];
}

// Directions API 응답
export interface DirectionsRoute {
  summary: {
    start: {
      location: [number, number];
    };
    goal: {
      location: [number, number];
      dir: number;
    };
    distance: number;
    duration: number;
    departureTime: string;
    bbox: [[number, number], [number, number]];
    tollFare: number;
    taxiFare: number;
    fuelPrice: number;
  };
  path: [number, number][];
  section: DirectionsSection[];
  guide: DirectionsGuide[];
}

export interface DirectionsSection {
  pointIndex: number;
  pointCount: number;
  distance: number;
  name: string;
  congestion: number;
  speed: number;
}

export interface DirectionsGuide {
  pointIndex: number;
  type: number;
  instructions: string;
  distance: number;
  duration: number;
}

export interface DirectionsResponse {
  code: number;
  message: string;
  currentDateTime: string;
  route?: {
    traoptimal?: DirectionsRoute[];
    trafast?: DirectionsRoute[];
    tracomfort?: DirectionsRoute[];
    traavoidtoll?: DirectionsRoute[];
    traavoidcaronly?: DirectionsRoute[];
  };
}

// Billing API 응답
export interface BillingDemandCost {
  demandMonth: string;
  regionCode: string;
  regionName: string;
  productCode: string;
  productName: string;
  productItemKindCode: string;
  productItemKindName: string;
  productItemKindDetailCode: string;
  productItemKindDetailName: string;
  productCategory: string;
  useQuantity: number;
  unitCode: string;
  demandAmount: number;
  promiseDiscountAmount: number;
  promotionDiscountAmount: number;
  contractDiscountAmount: number;
  etcDiscountAmount: number;
  memberPriceDiscountAmount: number;
  creditDiscountAmount: number;
  useAmount: number;
}

export interface BillingResponse {
  getProductDemandCostListResponse: {
    requestId: string;
    returnCode: string;
    returnMessage: string;
    totalRows: number;
    productDemandCostList?: BillingDemandCost[];
  };
}

// Usage 도구 출력
export interface UsageServiceInfo {
  name: string;
  usage: number;
  freeLimit: number;
  usageRate: number;
  cost: number;
}

export interface UsageResult {
  month: string;
  services: UsageServiceInfo[];
  totalCost: number;
  warnings: string[];
}

// API 에러
export interface ApiError {
  code: string;
  message: string;
  details?: string;
}
