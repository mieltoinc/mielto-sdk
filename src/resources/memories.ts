/** Memory resource for interacting with the Mielto Memory API. */

import { BaseClient } from '../clients/base';
import {
  Memory,
  MemoryCreate,
  MemoryUpdate,
  MemoryReplace,
  MemorySearchRequest,
  MemorySearchResponse,
  MemoryListResponse,
  MemoryFromMessagesRequest,
  MemoryFromMessagesResponse,
  MemoryChunksResponse,
} from '../types/memory';

export class Memories {
  constructor(private client: BaseClient) {}

  async create(memoryData: MemoryCreate | Record<string, any>): Promise<Memory> {
    const payload = memoryData;
    const response = await this.client.post<{ memory: Memory }>('/memories', payload);
    return response.memory;
  }

  async get(memoryId: string, userId?: string): Promise<Memory> {
    const params: Record<string, any> = {};
    if (userId) params.user_id = userId;
    return this.client.get<Memory>(`/memories/${memoryId}`, params);
  }

  async list(
    options: {
      user_id?: string;
      cursor?: string;
      limit?: number;
      sort_by?: string;
      sort_order?: string;
    } = {}
  ): Promise<MemoryListResponse> {
    const params: Record<string, any> = {
      limit: options.limit || 50,
      sort_by: options.sort_by || 'updated_at',
      sort_order: options.sort_order || 'desc',
    };
    if (options.user_id) params.user_id = options.user_id;
    if (options.cursor) params.cursor = options.cursor;

    return this.client.get<MemoryListResponse>('/memories', params);
  }

  async search(searchRequest: MemorySearchRequest | Record<string, any>): Promise<MemorySearchResponse> {
    const payload = searchRequest;
    return this.client.post<MemorySearchResponse>('/memories/search', payload);
  }

  async update(memoryId: string, memoryData: MemoryUpdate | Record<string, any>): Promise<Memory> {
    const payload = memoryData;
    const response = await this.client.put<{ memory: Memory }>(`/memories/${memoryId}`, payload);
    return response.memory;
  }

  async replace(memoryId: string, memoryData: MemoryReplace | Record<string, any>): Promise<any> {
    const payload = memoryData;
    return this.client.post(`/memories/${memoryId}/replace`, payload);
  }

  async delete(memoryId: string, userId?: string): Promise<any> {
    const params: Record<string, any> = {};
    if (userId) params.user_id = userId;

    let endpoint = `/memories/${memoryId}`;
    if (Object.keys(params).length > 0) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
      endpoint += `?${queryString}`;
    }

    return this.client.delete(endpoint);
  }

  async fromMessages(request: MemoryFromMessagesRequest): Promise<MemoryFromMessagesResponse> {
    const payload = request;
    const response = await this.client.post<MemoryFromMessagesResponse>('/memories/from_messages', payload);
    
    // Handle response - API may return memories in 'result' field
    if ('result' in response && Array.isArray((response as any).result)) {
      (response as any).memories = (response as any).result;
      delete (response as any).result;
    }

    return response;
  }

  async getChunks(options: {
    user_id?: string;
    limit?: number;
    cursor?: string;
    include_embedding?: boolean;
  } = {}): Promise<MemoryChunksResponse> {
    const params: Record<string, any> = {
      limit: options.limit || 100,
      include_embedding: options.include_embedding || false,
    };
    if (options.user_id) params.user_id = options.user_id;
    if (options.cursor) params.cursor = options.cursor;

    return this.client.get<MemoryChunksResponse>('/memories/chunks', params);
  }
}

