import apiService from './api.service';
import { API_CONFIG } from '../constants/config';

export interface Tag {
  _id: string;
  tagId: string;
  type: 'item' | 'box';
  businessId: string;
  attachedItemId?: string;
  meta?: Record<string, any>;
  createdAt: string;
}

export interface RegisterTagData {
  tagId?: string;
  type: 'item' | 'box';
  meta?: Record<string, any>;
}

class TagService {
  async registerTag(data: RegisterTagData): Promise<{ message: string; tag: Tag }> {
    return await apiService.post(API_CONFIG.ENDPOINTS.TAGS.REGISTER, data);
  }

  async listTags(type?: 'item' | 'box'): Promise<Tag[]> {
    return await apiService.get(API_CONFIG.ENDPOINTS.TAGS.LIST, {
      params: type ? { type } : undefined,
    });
  }

  async getTag(tagId: string): Promise<Tag> {
    return await apiService.get(API_CONFIG.ENDPOINTS.TAGS.GET(tagId));
  }
}

export default new TagService();
