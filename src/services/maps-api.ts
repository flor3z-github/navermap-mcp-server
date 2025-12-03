/**
 * Naver Maps API 클라이언트
 * 공통 인증 로직 및 HTTP 요청 처리
 */

import type { EnvConfig } from "../types.js";

export class MapsApiClient {
  private clientId: string;
  private clientSecret: string;

  constructor(config: EnvConfig) {
    this.clientId = config.naverClientId;
    this.clientSecret = config.naverClientSecret;
  }

  /**
   * Maps API 공통 헤더 생성
   */
  private getHeaders(): Record<string, string> {
    return {
      "x-ncp-apigw-api-key-id": this.clientId,
      "x-ncp-apigw-api-key": this.clientSecret,
    };
  }

  /**
   * GET 요청 실행
   */
  async get<T>(url: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const urlObj = new URL(url);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          urlObj.searchParams.append(key, String(value));
        }
      }
    }

    const response = await fetch(urlObj.toString(), {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new MapsApiError(
        `API 요청 실패 (${response.status})`,
        response.status,
        errorText
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * 바이너리 데이터 GET 요청 (이미지 등)
   */
  async getBinary(url: string, params?: Record<string, string | number | undefined>): Promise<Buffer> {
    const urlObj = new URL(url);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          urlObj.searchParams.append(key, String(value));
        }
      }
    }

    const response = await fetch(urlObj.toString(), {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new MapsApiError(
        `API 요청 실패 (${response.status})`,
        response.status,
        errorText
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

/**
 * Maps API 에러 클래스
 */
export class MapsApiError extends Error {
  public readonly statusCode: number;
  public readonly details: string;

  constructor(message: string, statusCode: number, details: string) {
    super(message);
    this.name = "MapsApiError";
    this.statusCode = statusCode;
    this.details = details;
  }

  /**
   * 사용자 친화적 에러 메시지 반환
   */
  toUserMessage(): string {
    switch (this.statusCode) {
      case 400:
        return `잘못된 요청입니다. 입력값을 확인해주세요. 상세: ${this.details}`;
      case 401:
        return "인증에 실패했습니다. NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET 환경변수를 확인해주세요.";
      case 403:
        return "API 접근 권한이 없습니다. Naver Cloud Platform에서 API 사용 설정을 확인해주세요.";
      case 404:
        return "요청한 리소스를 찾을 수 없습니다.";
      case 429:
        return "API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
      case 500:
      case 502:
      case 503:
        return "Naver API 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.";
      default:
        return `API 오류가 발생했습니다 (${this.statusCode}): ${this.details}`;
    }
  }
}

/**
 * 환경변수에서 설정 로드
 */
export function loadEnvConfig(): EnvConfig {
  const naverClientId = process.env.NAVER_CLIENT_ID;
  const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!naverClientId || !naverClientSecret) {
    throw new Error(
      "필수 환경변수가 설정되지 않았습니다. NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 설정해주세요."
    );
  }

  return {
    naverClientId,
    naverClientSecret,
    ncloudAccessKey: process.env.NCLOUD_ACCESS_KEY,
    ncloudSecretKey: process.env.NCLOUD_SECRET_KEY,
  };
}

/**
 * Billing API 사용 가능 여부 확인
 */
export function isBillingApiAvailable(config: EnvConfig): boolean {
  return Boolean(config.ncloudAccessKey && config.ncloudSecretKey);
}
