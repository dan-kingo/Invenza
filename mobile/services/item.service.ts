import apiService from './api.service';
import { API_CONFIG } from '../constants/config';

export interface Item {
  _id: string;
  businessId: string;
  name: string;
  sku?: string;
  description?: string;
  quantity: number;
  unit: 'pcs' | 'kg' | 'ltr';
  category?: string;
  location?: string;
  tags: string[];
  minThreshold: number;
  image?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemData {
  name: string;
  sku?: string;
  description?: string;
  quantity: number;
  unit: 'pcs' | 'kg' | 'ltr';
  category?: string;
  location?: string;
  tags?: string[];
  minThreshold?: number;
  expiryDate?: string;
}

export interface AdjustQuantityData {
  delta: number;
  action: 'added' | 'sold' | 'used' | 'adjusted';
  reason?: string;
}

class ItemService {
  async listItems(params?: { category?: string; tag?: string; lowStock?: boolean }): Promise<Item[]> {
    return await apiService.get(API_CONFIG.ENDPOINTS.ITEMS.LIST, { params });
  }

  async createItem(data: CreateItemData, imageFile?: any): Promise<{ message: string; item: Item, tagId: string, qrCode: string }> {
    if (imageFile) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      formData.append('image', imageFile);

      return await apiService.post(API_CONFIG.ENDPOINTS.ITEMS.CREATE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    return await apiService.post(API_CONFIG.ENDPOINTS.ITEMS.CREATE, data);
  }

  async getItem(id: string): Promise<Item> {
    return await apiService.get(API_CONFIG.ENDPOINTS.ITEMS.GET(id));
  }

  async updateItem(id: string, data: Partial<CreateItemData>, imageFile?: any): Promise<{ message: string; item: Item }> {
    if (imageFile) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      formData.append('image', imageFile);

      return await apiService.put(API_CONFIG.ENDPOINTS.ITEMS.UPDATE(id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    return await apiService.put(API_CONFIG.ENDPOINTS.ITEMS.UPDATE(id), data);
  }

  async adjustQuantity(id: string, data: AdjustQuantityData): Promise<{ message: string; item: Item }> {
    return await apiService.post(API_CONFIG.ENDPOINTS.ITEMS.ADJUST(id), data);
  }

  async scanItem(tagId: string): Promise<{ message: string; tag: any; item: Item , tagId: string, qrCode: string}> {
    return await apiService.post(API_CONFIG.ENDPOINTS.ITEMS.SCAN(''), { tagId });
  }

  async getItemEvents(id: string): Promise<any[]> {
    return await apiService.get(API_CONFIG.ENDPOINTS.ITEMS.EVENTS(id));
  }
}

export default new ItemService();
