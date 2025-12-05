/**
 * Naver Maps API 클라이언트
 * 공통 인증 로직, HTTP 요청 처리, 재시도 로직
 */

import type { NaverMapConfig } from '../config.js';
import { NaverMapError, handleFetchError } from '../utils/errors.js';

/**
 * Fetch with retry logic and timeout
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: { timeout: number; maxRetries: number }
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return response;
        }

        // Retry on 5xx errors and 429
        if (response.ok) {
          return response;
        }

        // If we should retry, continue to next attempt
        if (attempt < config.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on abort (timeout) or if we've exhausted retries
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NaverMapError('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.', 408);
      }

      if (attempt < config.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError || new NaverMapError('알 수 없는 오류가 발생했습니다.');
}

export class MapsApiClient {
  private clientId: string;
  private clientSecret: string;
  private timeout: number;
  private maxRetries: number;

  constructor(config: NaverMapConfig) {
    this.clientId = config.naver.clientId;
    this.clientSecret = config.naver.clientSecret;
    this.timeout = config.request.timeout;
    this.maxRetries = config.request.maxRetries;
  }

  /**
   * Maps API 공통 헤더 생성
   */
  private getHeaders(): Record<string, string> {
    return {
      'x-ncp-apigw-api-key-id': this.clientId,
      'x-ncp-apigw-api-key': this.clientSecret,
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

    const response = await fetchWithRetry(
      urlObj.toString(),
      {
        method: 'GET',
        headers: this.getHeaders(),
      },
      { timeout: this.timeout, maxRetries: this.maxRetries }
    );

    if (!response.ok) {
      await handleFetchError(response);
    }

    return response.json() as Promise<T>;
  }

  /**
   * 바이너리 데이터 GET 요청 (이미지 등)
   */
  async getBinary(
    url: string,
    params?: Record<string, string | number | undefined>
  ): Promise<Buffer> {
    const urlObj = new URL(url);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          urlObj.searchParams.append(key, String(value));
        }
      }
    }

    const response = await fetchWithRetry(
      urlObj.toString(),
      {
        method: 'GET',
        headers: this.getHeaders(),
      },
      { timeout: this.timeout, maxRetries: this.maxRetries }
    );

    if (!response.ok) {
      await handleFetchError(response);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

// Re-export NaverMapError for backward compatibility
export { NaverMapError as MapsApiError } from '../utils/errors.js';
