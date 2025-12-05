/**
 * Naver Cloud Billing API 클라이언트
 * HMAC-SHA256 서명을 사용한 인증
 */

import crypto from 'crypto';
import type { NaverMapConfig } from '../config.js';
import { BillingApiError } from '../utils/errors.js';
import { API_ENDPOINTS } from '../constants.js';
import type { BillingResponse } from '../types.js';

/**
 * Fetch with retry logic and timeout for Billing API
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: { timeout: number; maxRetries: number }
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Don't retry on client errors (4xx) except 429
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return response;
        }

        if (response.ok) {
          return response;
        }

        if (attempt < config.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof Error && error.name === 'AbortError') {
        throw new BillingApiError('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.', 408);
      }

      if (attempt < config.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError || new BillingApiError('알 수 없는 오류가 발생했습니다.');
}

export class BillingApiClient {
  private accessKey: string;
  private secretKey: string;
  private timeout: number;
  private maxRetries: number;

  constructor(config: NaverMapConfig) {
    if (!config.ncloud.accessKey || !config.ncloud.secretKey) {
      throw new Error(
        'Billing API를 사용하려면 NCLOUD_ACCESS_KEY와 NCLOUD_SECRET_KEY 환경변수가 필요합니다.'
      );
    }
    this.accessKey = config.ncloud.accessKey;
    this.secretKey = config.ncloud.secretKey;
    this.timeout = config.request.timeout;
    this.maxRetries = config.request.maxRetries;
  }

  /**
   * HMAC-SHA256 서명 생성
   */
  private makeSignature(method: string, url: string, timestamp: string): string {
    const space = ' ';
    const newLine = '\n';

    const message = method + space + url + newLine + timestamp + newLine + this.accessKey;
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(message);
    return hmac.digest('base64');
  }

  /**
   * Billing API 헤더 생성
   */
  private getHeaders(method: string, url: string): Record<string, string> {
    const timestamp = Date.now().toString();
    const signature = this.makeSignature(method, url, timestamp);

    return {
      'x-ncp-apigw-timestamp': timestamp,
      'x-ncp-iam-access-key': this.accessKey,
      'x-ncp-apigw-signature-v2': signature,
      'Content-Type': 'application/json',
    };
  }

  /**
   * 사용량 및 비용 조회
   * @param startMonth 시작월 (YYYYMM)
   * @param endMonth 종료월 (YYYYMM)
   */
  async getProductDemandCostList(startMonth: string, endMonth: string): Promise<BillingResponse> {
    const baseUrl = API_ENDPOINTS.BILLING;
    const urlPath = '/billing/v1/cost/getProductDemandCostList';

    const params = new URLSearchParams({
      startMonth,
      endMonth,
      responseFormatType: 'json',
    });

    const fullUrl = `${baseUrl}?${params.toString()}`;
    const headers = this.getHeaders('GET', urlPath);

    const response = await fetchWithRetry(
      fullUrl,
      {
        method: 'GET',
        headers,
      },
      { timeout: this.timeout, maxRetries: this.maxRetries }
    );

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

// Re-export BillingApiError for backward compatibility
export { BillingApiError } from '../utils/errors.js';
