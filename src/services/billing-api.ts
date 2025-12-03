/**
 * Naver Cloud Billing API 클라이언트
 * HMAC-SHA256 서명을 사용한 인증
 */

import crypto from "crypto";
import type { EnvConfig, BillingResponse } from "../types.js";
import { API_ENDPOINTS } from "../constants.js";

export class BillingApiClient {
  private accessKey: string;
  private secretKey: string;

  constructor(config: EnvConfig) {
    if (!config.ncloudAccessKey || !config.ncloudSecretKey) {
      throw new Error(
        "Billing API를 사용하려면 NCLOUD_ACCESS_KEY와 NCLOUD_SECRET_KEY 환경변수가 필요합니다."
      );
    }
    this.accessKey = config.ncloudAccessKey;
    this.secretKey = config.ncloudSecretKey;
  }

  /**
   * HMAC-SHA256 서명 생성
   */
  private makeSignature(method: string, url: string, timestamp: string): string {
    const space = " ";
    const newLine = "\n";

    const message = method + space + url + newLine + timestamp + newLine + this.accessKey;
    const hmac = crypto.createHmac("sha256", this.secretKey);
    hmac.update(message);
    return hmac.digest("base64");
  }

  /**
   * Billing API 헤더 생성
   */
  private getHeaders(method: string, url: string): Record<string, string> {
    const timestamp = Date.now().toString();
    const signature = this.makeSignature(method, url, timestamp);

    return {
      "x-ncp-apigw-timestamp": timestamp,
      "x-ncp-iam-access-key": this.accessKey,
      "x-ncp-apigw-signature-v2": signature,
      "Content-Type": "application/json",
    };
  }

  /**
   * 사용량 및 비용 조회
   * @param startMonth 시작월 (YYYYMM)
   * @param endMonth 종료월 (YYYYMM)
   */
  async getProductDemandCostList(startMonth: string, endMonth: string): Promise<BillingResponse> {
    const baseUrl = API_ENDPOINTS.BILLING;
    const urlPath = "/billing/v1/cost/getProductDemandCostList";

    const params = new URLSearchParams({
      startMonth,
      endMonth,
      responseFormatType: "json",
    });

    const fullUrl = `${baseUrl}?${params.toString()}`;
    const headers = this.getHeaders("GET", urlPath);

    const response = await fetch(fullUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new BillingApiError(
        `Billing API 요청 실패 (${response.status})`,
        response.status,
        errorText
      );
    }

    return response.json() as Promise<BillingResponse>;
  }
}

/**
 * Billing API 에러 클래스
 */
export class BillingApiError extends Error {
  public readonly statusCode: number;
  public readonly details: string;

  constructor(message: string, statusCode: number, details: string) {
    super(message);
    this.name = "BillingApiError";
    this.statusCode = statusCode;
    this.details = details;
  }

  /**
   * 사용자 친화적 에러 메시지 반환
   */
  toUserMessage(): string {
    switch (this.statusCode) {
      case 401:
        return "Billing API 인증에 실패했습니다. NCLOUD_ACCESS_KEY와 NCLOUD_SECRET_KEY 환경변수를 확인해주세요.";
      case 403:
        return "Billing API 접근 권한이 없습니다. Naver Cloud Platform에서 권한 설정을 확인해주세요.";
      case 429:
        return "API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
      default:
        return `Billing API 오류가 발생했습니다 (${this.statusCode}): ${this.details}`;
    }
  }
}
