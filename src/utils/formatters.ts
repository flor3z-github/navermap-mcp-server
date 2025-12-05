/**
 * Formatting utilities for Naver Map MCP Server
 * Centralized formatting functions for consistent output
 */

/**
 * Format milliseconds to hours and minutes (e.g., "1시간 30분")
 */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
}

/**
 * Format meters to km or m (e.g., "1.5km" or "500m")
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${meters}m`;
}

/**
 * Format amount to Korean Won (e.g., "1,500원")
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

/**
 * Format number with Korean locale (e.g., "1,500")
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('ko-KR');
}

/**
 * Format percentage (e.g., "75.5%")
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get user-friendly name for route option
 */
export function getRouteOptionName(option: string): string {
  switch (option) {
    case 'trafast':
      return '실시간 빠른길';
    case 'tracomfort':
      return '편한길';
    case 'traoptimal':
      return '최적';
    case 'traavoidtoll':
      return '무료 우선';
    case 'traavoidcaronly':
      return '자동차전용도로 회피';
    default:
      return option;
  }
}

/**
 * Get user-friendly name for address type
 */
export function getAddressTypeName(type: string): string {
  switch (type) {
    case 'roadaddr':
      return '도로명주소';
    case 'addr':
      return '지번주소';
    case 'admcode':
      return '행정동';
    case 'legalcode':
      return '법정동';
    default:
      return type;
  }
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Convert YYYY-MM to YYYYMM format
 */
export function toYYYYMM(yearMonth: string): string {
  return yearMonth.replace('-', '');
}

/**
 * Get formatted timestamp for logging
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number = 500): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format a list of items using a formatter function
 */
export function formatList<T>(
  items: T[],
  formatter: (item: T) => string,
  separator: string = '\n\n'
): string {
  return items.map((item) => formatter(item)).join(separator);
}
