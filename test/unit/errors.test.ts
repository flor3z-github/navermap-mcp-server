import { describe, it, expect } from 'vitest';
import {
  NaverMapError,
  BillingApiError,
  ConfigurationError,
  ValidationError,
  formatErrorResponse,
  createErrorResponse,
} from '../../src/utils/errors.js';
import { ZodError, z } from 'zod';

describe('errors', () => {
  describe('NaverMapError', () => {
    it('should create error with message and status code', () => {
      const error = new NaverMapError('Test error', 400, 'Details');
      expect(error.name).toBe('NaverMapError');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.details).toBe('Details');
    });

    describe('toUserMessage', () => {
      it('should return appropriate message for 400', () => {
        const error = new NaverMapError('Bad request', 400, 'Invalid query');
        expect(error.toUserMessage()).toContain('잘못된 요청');
        expect(error.toUserMessage()).toContain('Invalid query');
      });

      it('should return appropriate message for 401', () => {
        const error = new NaverMapError('Unauthorized', 401);
        expect(error.toUserMessage()).toContain('인증에 실패');
      });

      it('should return appropriate message for 403', () => {
        const error = new NaverMapError('Forbidden', 403);
        expect(error.toUserMessage()).toContain('API 접근 권한');
      });

      it('should return appropriate message for 429', () => {
        const error = new NaverMapError('Too many requests', 429);
        expect(error.toUserMessage()).toContain('한도를 초과');
      });

      it('should return appropriate message for 5xx', () => {
        const error = new NaverMapError('Server error', 500);
        expect(error.toUserMessage()).toContain('일시적인 문제');
      });
    });
  });

  describe('BillingApiError', () => {
    it('should create error with message and status code', () => {
      const error = new BillingApiError('Billing error', 401, 'Details');
      expect(error.name).toBe('BillingApiError');
      expect(error.statusCode).toBe(401);
    });

    it('should return appropriate message for 401', () => {
      const error = new BillingApiError('Unauthorized', 401);
      expect(error.toUserMessage()).toContain('인증에 실패');
      expect(error.toUserMessage()).toContain('NCLOUD');
    });
  });

  describe('ConfigurationError', () => {
    it('should create error with message', () => {
      const error = new ConfigurationError('Config missing');
      expect(error.name).toBe('ConfigurationError');
      expect(error.message).toBe('Config missing');
    });
  });

  describe('ValidationError', () => {
    it('should create error with message and optional field', () => {
      const error = new ValidationError('Invalid value', 'query');
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid value');
      expect(error.field).toBe('query');
    });

    it('should work without field', () => {
      const error = new ValidationError('Invalid value');
      expect(error.field).toBeUndefined();
    });
  });

  describe('formatErrorResponse', () => {
    it('should format NaverMapError', () => {
      const error = new NaverMapError('API error', 400, 'Bad input');
      const result = formatErrorResponse(error);
      expect(result).toContain('잘못된 요청');
    });

    it('should format BillingApiError', () => {
      const error = new BillingApiError('Billing error', 401);
      const result = formatErrorResponse(error);
      expect(result).toContain('인증에 실패');
    });

    it('should format ConfigurationError', () => {
      const error = new ConfigurationError('Missing env');
      const result = formatErrorResponse(error);
      expect(result).toBe('설정 오류: Missing env');
    });

    it('should format ValidationError with field', () => {
      const error = new ValidationError('Invalid', 'query');
      const result = formatErrorResponse(error);
      expect(result).toBe('입력값 오류 (query): Invalid');
    });

    it('should format ValidationError without field', () => {
      const error = new ValidationError('Invalid');
      const result = formatErrorResponse(error);
      expect(result).toBe('입력값 오류: Invalid');
    });

    it('should format ZodError', () => {
      const schema = z.object({ query: z.string() });
      try {
        schema.parse({ query: 123 });
      } catch (error) {
        const result = formatErrorResponse(error);
        expect(result).toContain('입력값 검증 실패');
      }
    });

    it('should format generic Error', () => {
      const error = new Error('Something went wrong');
      const result = formatErrorResponse(error);
      expect(result).toBe('오류: Something went wrong');
    });

    it('should handle unknown error type', () => {
      const result = formatErrorResponse('string error');
      expect(result).toBe('알 수 없는 오류가 발생했습니다');
    });
  });

  describe('createErrorResponse', () => {
    it('should create MCP error response structure', () => {
      const error = new NaverMapError('API error', 400);
      const result = createErrorResponse(error);

      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(typeof result.content[0].text).toBe('string');
    });
  });
});
