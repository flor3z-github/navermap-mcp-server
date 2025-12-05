/**
 * navermap_get_usage 도구 - Maps API 사용량 + 비용 + 무료 한도 대비 사용률 조회
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { UsageSchema, type UsageInput } from '../schemas/index.js';
import { BillingApiClient, BillingApiError } from '../services/billing-api.js';
import { createErrorResponse } from '../utils/errors.js';
import { getCurrentMonth, toYYYYMM, formatNumber, formatCurrency } from '../utils/formatters.js';
import { FREE_LIMITS, WARNING_THRESHOLD } from '../constants.js';
import type { NaverMapConfig } from '../config.js';
import type { UsageServiceInfo, BillingDemandCost } from '../types.js';

/**
 * 서비스명 매핑 (Billing API 응답 → 무료 한도 키)
 */
function mapServiceName(productItemKindDetailName: string): string | null {
  const mapping: Record<string, string> = {
    'Dynamic Map': 'Dynamic Map',
    'Static Map': 'Static Map',
    Geocoding: 'Geocoding',
    'Reverse Geocoding': 'Reverse Geocoding',
    'Directions 5': 'Directions 5',
    'Directions 15': 'Directions 15',
  };

  // 부분 일치 검색
  for (const [key, value] of Object.entries(mapping)) {
    if (productItemKindDetailName.includes(key)) {
      return value;
    }
  }

  return null;
}

/**
 * 사용량 데이터 집계
 */
function aggregateUsage(costs: BillingDemandCost[]): Map<string, { usage: number; cost: number }> {
  const result = new Map<string, { usage: number; cost: number }>();

  for (const cost of costs) {
    const serviceName = mapServiceName(cost.productItemKindDetailName);
    if (!serviceName) continue;

    const existing = result.get(serviceName) ?? { usage: 0, cost: 0 };
    existing.usage += cost.useQuantity;
    existing.cost += cost.useAmount;
    result.set(serviceName, existing);
  }

  return result;
}

export function registerUsageTool(server: McpServer, config: NaverMapConfig): void {
  server.tool(
    'navermap_get_usage',
    'Naver Maps API 사용량, 비용, 무료 한도 대비 사용률을 조회합니다. 월별 사용 현황과 경고를 제공합니다.',
    UsageSchema.shape,
    async (args: UsageInput) => {
      // Billing API 키가 없으면 에러 반환
      if (!config.ncloud.accessKey || !config.ncloud.secretKey) {
        return {
          content: [
            {
              type: 'text' as const,
              text: '사용량 조회 기능을 사용하려면 NCLOUD_ACCESS_KEY와 NCLOUD_SECRET_KEY 환경변수가 필요합니다.',
            },
          ],
          isError: true,
        };
      }

      try {
        const billingClient = new BillingApiClient(config);
        const month = args.month ?? getCurrentMonth();
        const yyyymm = toYYYYMM(month);

        const response = await billingClient.getProductDemandCostList(yyyymm, yyyymm);

        const responseData = response.getProductDemandCostListResponse;

        if (responseData.returnCode !== '0') {
          return {
            content: [
              {
                type: 'text' as const,
                text: `사용량 조회에 실패했습니다: ${responseData.returnMessage}`,
              },
            ],
            isError: true,
          };
        }

        // Maps 관련 항목만 필터링
        const mapsCosts = (responseData.productDemandCostList ?? []).filter(
          (cost) =>
            cost.productCategory === 'Maps' ||
            cost.productName.includes('Maps') ||
            cost.productName.includes('Map')
        );

        // 사용량 집계
        const aggregated = aggregateUsage(mapsCosts);

        // 결과 생성
        const services: UsageServiceInfo[] = [];
        const warnings: string[] = [];
        let totalCost = 0;

        for (const [name, limit] of Object.entries(FREE_LIMITS)) {
          const data = aggregated.get(name) ?? { usage: 0, cost: 0 };
          const usageRate = limit > 0 ? (data.usage / limit) * 100 : 0;

          services.push({
            name,
            usage: data.usage,
            freeLimit: limit,
            usageRate: Math.round(usageRate * 10) / 10,
            cost: data.cost,
          });

          totalCost += data.cost;

          if (usageRate >= WARNING_THRESHOLD) {
            warnings.push(`${name} 사용률이 ${usageRate.toFixed(1)}%입니다. 한도에 주의하세요.`);
          }
        }

        // 사용률 기준으로 정렬 (높은 순)
        services.sort((a, b) => b.usageRate - a.usageRate);

        // 사람이 읽기 쉬운 형식으로 포맷팅
        let text = `## ${month} Naver Maps API 사용량 현황\n\n`;

        if (warnings.length > 0) {
          text += `### 경고\n`;
          for (const warning of warnings) {
            text += `- ${warning}\n`;
          }
          text += '\n';
        }

        text += `### 서비스별 사용량\n\n`;
        text += `| 서비스 | 사용량 | 무료한도 | 사용률 | 비용 |\n`;
        text += `|--------|--------|----------|--------|------|\n`;

        for (const service of services) {
          const usageStr = formatNumber(service.usage);
          const limitStr = formatNumber(service.freeLimit);
          const rateStr = `${service.usageRate}%`;
          const costStr = formatCurrency(service.cost);
          text += `| ${service.name} | ${usageStr} | ${limitStr} | ${rateStr} | ${costStr} |\n`;
        }

        text += `\n### 총 비용: ${formatCurrency(totalCost)}\n`;

        return {
          content: [
            {
              type: 'text' as const,
              text,
            },
          ],
        };
      } catch (error) {
        if (error instanceof BillingApiError) {
          return {
            content: [
              {
                type: 'text' as const,
                text: error.toUserMessage(),
              },
            ],
            isError: true,
          };
        }
        return createErrorResponse(error);
      }
    }
  );
}
