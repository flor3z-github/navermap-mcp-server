import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  formatDistance,
  formatCurrency,
  formatNumber,
  formatPercentage,
  getRouteOptionName,
  getAddressTypeName,
  getCurrentMonth,
  toYYYYMM,
  getTimestamp,
  truncateText,
  formatList,
} from '../../src/utils/formatters.js';

describe('formatters', () => {
  describe('formatDuration', () => {
    it('should format minutes only when less than an hour', () => {
      expect(formatDuration(30 * 60 * 1000)).toBe('30분');
      expect(formatDuration(45 * 60 * 1000)).toBe('45분');
    });

    it('should format hours and minutes when more than an hour', () => {
      expect(formatDuration(90 * 60 * 1000)).toBe('1시간 30분');
      expect(formatDuration(150 * 60 * 1000)).toBe('2시간 30분');
    });

    it('should handle zero minutes', () => {
      expect(formatDuration(60 * 60 * 1000)).toBe('1시간 0분');
    });
  });

  describe('formatDistance', () => {
    it('should format meters when less than 1km', () => {
      expect(formatDistance(500)).toBe('500m');
      expect(formatDistance(999)).toBe('999m');
    });

    it('should format kilometers when 1km or more', () => {
      expect(formatDistance(1000)).toBe('1.0km');
      expect(formatDistance(1500)).toBe('1.5km');
      expect(formatDistance(10000)).toBe('10.0km');
    });
  });

  describe('formatCurrency', () => {
    it('should format amount with Korean locale and 원', () => {
      expect(formatCurrency(1000)).toBe('1,000원');
      expect(formatCurrency(1500000)).toBe('1,500,000원');
      expect(formatCurrency(0)).toBe('0원');
    });
  });

  describe('formatNumber', () => {
    it('should format number with Korean locale', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1500000)).toBe('1,500,000');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with default 1 decimal', () => {
      expect(formatPercentage(75.5)).toBe('75.5%');
      expect(formatPercentage(100)).toBe('100.0%');
    });

    it('should format percentage with custom decimals', () => {
      expect(formatPercentage(75.555, 2)).toBe('75.56%');
      expect(formatPercentage(100, 0)).toBe('100%');
    });
  });

  describe('getRouteOptionName', () => {
    it('should return Korean name for known options', () => {
      expect(getRouteOptionName('trafast')).toBe('실시간 빠른길');
      expect(getRouteOptionName('tracomfort')).toBe('편한길');
      expect(getRouteOptionName('traoptimal')).toBe('최적');
      expect(getRouteOptionName('traavoidtoll')).toBe('무료 우선');
      expect(getRouteOptionName('traavoidcaronly')).toBe('자동차전용도로 회피');
    });

    it('should return the option as-is for unknown options', () => {
      expect(getRouteOptionName('unknown')).toBe('unknown');
    });
  });

  describe('getAddressTypeName', () => {
    it('should return Korean name for known types', () => {
      expect(getAddressTypeName('roadaddr')).toBe('도로명주소');
      expect(getAddressTypeName('addr')).toBe('지번주소');
      expect(getAddressTypeName('admcode')).toBe('행정동');
      expect(getAddressTypeName('legalcode')).toBe('법정동');
    });

    it('should return the type as-is for unknown types', () => {
      expect(getAddressTypeName('unknown')).toBe('unknown');
    });
  });

  describe('getCurrentMonth', () => {
    it('should return current month in YYYY-MM format', () => {
      const result = getCurrentMonth();
      expect(result).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe('toYYYYMM', () => {
    it('should convert YYYY-MM to YYYYMM format', () => {
      expect(toYYYYMM('2024-01')).toBe('202401');
      expect(toYYYYMM('2024-12')).toBe('202412');
    });
  });

  describe('getTimestamp', () => {
    it('should return ISO timestamp', () => {
      const result = getTimestamp();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('truncateText', () => {
    it('should not truncate text shorter than maxLength', () => {
      expect(truncateText('short text', 100)).toBe('short text');
    });

    it('should truncate text longer than maxLength with ellipsis', () => {
      const longText = 'a'.repeat(100);
      const result = truncateText(longText, 50);
      expect(result.length).toBe(50);
      expect(result.endsWith('...')).toBe(true);
    });

    it('should use default maxLength of 500', () => {
      const longText = 'a'.repeat(600);
      const result = truncateText(longText);
      expect(result.length).toBe(500);
    });
  });

  describe('formatList', () => {
    it('should format list with default separator', () => {
      const items = [1, 2, 3];
      const result = formatList(items, (n) => `Item ${n}`);
      expect(result).toBe('Item 1\n\nItem 2\n\nItem 3');
    });

    it('should format list with custom separator', () => {
      const items = ['a', 'b', 'c'];
      const result = formatList(items, (s) => s.toUpperCase(), ', ');
      expect(result).toBe('A, B, C');
    });
  });
});
