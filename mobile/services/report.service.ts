import apiService from './api.service';
import { API_CONFIG } from '../constants/config';

export interface StockSummaryItem {
  itemId: string;
  name: string;
  sku?: string;
  category?: string;
  currentQuantity: number;
  unit: string;
  minThreshold: number;
  totalAdded: number;
  totalRemoved: number;
  netChange: number;
}

export interface LowStockItem {
  itemId: string;
  name: string;
  sku?: string;
  category?: string;
  currentQuantity: number;
  minThreshold: number;
  unit: string;
  percentageRemaining: number;
}

export interface UsageTrendItem {
  itemId: string;
  itemName: string;
  period: string;
  totalAdded: number;
  totalSold: number;
  totalUsed: number;
  totalAdjusted: number;
  netChange: number;
}

export interface TopSellingItem {
  itemId: string;
  itemName: string;
  totalSold: number;
  unit: string;
}

export interface CategoryBreakdown {
  category: string;
  itemCount: number;
  totalQuantity: number;
}

class ReportService {
  async getStockSummary(from?: string, to?: string): Promise<{ summary: StockSummaryItem[]; count: number }> {
    return await apiService.get(API_CONFIG.ENDPOINTS.REPORTS.STOCK_SUMMARY, {
      params: { from, to },
    });
  }

  async getLowStock(): Promise<{ lowStockItems: LowStockItem[]; count: number }> {
    return await apiService.get(API_CONFIG.ENDPOINTS.REPORTS.LOW_STOCK);
  }

  async getUsageTrends(period: 'weekly' | 'monthly'): Promise<{ trends: UsageTrendItem[]; count: number; period: string }> {
    return await apiService.get(API_CONFIG.ENDPOINTS.REPORTS.USAGE_TRENDS, {
      params: { period },
    });
  }

  async getTopSelling(limit?: number, from?: string, to?: string): Promise<{ topSelling: TopSellingItem[]; count: number }> {
    return await apiService.get(API_CONFIG.ENDPOINTS.REPORTS.TOP_SELLING, {
      params: { limit, from, to },
    });
  }

  async getCategoryBreakdown(): Promise<{ breakdown: CategoryBreakdown[]; count: number }> {
    return await apiService.get(API_CONFIG.ENDPOINTS.REPORTS.CATEGORY_BREAKDOWN);
  }
}

export default new ReportService();
