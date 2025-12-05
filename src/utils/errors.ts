/**
 * Error utilities for Naver Map MCP Server
 * Centralized error handling and user-friendly messages
 */

import { ZodError } from 'zod';

/**
 * Base error class for Naver Map API errors
 */
export class NaverMapError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: string
  ) {
    super(message);
    this.name = 'NaverMapError';
  }

  /**
   * Returns a user-friendly error message based on status code
   */
  toUserMessage(): string {
    switch (this.statusCode) {
      case 400:
        return `잘못된 요청입니다. 입력값을 확인해주세요.${this.details ? ` 상세: ${this.details}` : ''}`;
      case 401:
        return '인증에 실패했습니다. NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET 환경변수를 확인해주세요.';
      case 403:
        return 'API 접근 권한이 없습니다. Naver Cloud Platform에서 API 사용 설정을 확인해주세요.';
      case 404:
        return '요청한 리소스를 찾을 수 없습니다.';
      case 429:
        return 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
      case 500:
      case 502:
      case 503:
        return 'Naver API 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.';
      default:
        return `API 오류가 발생했습니다 (${this.statusCode}): ${this.details || this.message}`;
    }
  }
}

/**
 * Error class for billing API errors
 */
export class BillingApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: string
  ) {
    super(message);
    this.name = 'BillingApiError';
  }

  toUserMessage(): string {
    switch (this.statusCode) {
      case 401:
        return '인증에 실패했습니다. NCLOUD_ACCESS_KEY와 NCLOUD_SECRET_KEY를 확인해주세요.';
      case 403:
        return 'Billing API 접근 권한이 없습니다. NCloud 콘솔에서 권한을 확인해주세요.';
      case 429:
        return 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
      default:
        return `Billing API 오류가 발생했습니다 (${this.statusCode}): ${this.details || this.message}`;
    }
  }
}

/**
 * Error class for configuration errors
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Error class for input validation errors
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Handle fetch response errors and convert to NaverMapError
 */
export async function handleFetchError(response: Response): Promise<never> {
  let details = '';
  try {
    details = await response.text();
  } catch {
    details = 'Unable to read error details';
  }

  throw new NaverMapError(
    `API 요청 실패 (${response.status})`,
    response.status,
    details
  );
}

/**
 * Format any error to a user-friendly string
 */
export function formatErrorResponse(error: unknown): string {
  if (error instanceof NaverMapError) {
    return error.toUserMessage();
  }

  if (error instanceof BillingApiError) {
    return error.toUserMessage();
  }

  if (error instanceof ConfigurationError) {
    return `설정 오류: ${error.message}`;
  }

  if (error instanceof ValidationError) {
    return `입력값 오류${error.field ? ` (${error.field})` : ''}: ${error.message}`;
  }

  if (error instanceof ZodError) {
    const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
    return `입력값 검증 실패: ${messages.join(', ')}`;
  }

  if (error instanceof Error) {
    return `오류: ${error.message}`;
  }

  return '알 수 없는 오류가 발생했습니다';
}

/**
 * Create MCP tool error response
 */
export function createErrorResponse(error: unknown) {
  return {
    content: [{ type: 'text' as const, text: formatErrorResponse(error) }],
    isError: true,
  };
}
