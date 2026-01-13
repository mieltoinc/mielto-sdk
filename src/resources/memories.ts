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
  MemoryProfileResponse,
} from '../types/memory';

export class Memories {
  constructor(private client: BaseClient) { }

  /**
   * Create a memory.
   *
   * @param memoryData - Memory data to create
   * @returns Created memory
   */
  async create(memoryData: MemoryCreate | Record<string, any>): Promise<Memory> {
    const payload = memoryData;
    const response = await this.client.post<{ memory: Memory }>('/memories', payload);
    return response.memory;
  }

  /**
   * Get a memory.
   *
   * @param memoryId - Memory ID to get
   * @param userId - User ID to get the memory for
   * @returns Memory
   */
  async get(memoryId: string, userId?: string): Promise<Memory> {
    const params: Record<string, any> = {};
    if (userId) params.user_id = userId;
    return this.client.get<Memory>(`/memories/${memoryId}`, params);
  }

  /**
   * List memories.
   *
   * @param options - Options for listing memories
   * @returns MemoryListResponse with memories and pagination info
   */
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

  /**
   * Search for memories.
   *
   * @param searchRequest - Request for searching memories
   * @returns MemorySearchResponse with memories found
   */
  async search(searchRequest: MemorySearchRequest | Record<string, any>): Promise<MemorySearchResponse> {
    const payload = searchRequest;
    return this.client.post<MemorySearchResponse>('/memories/search', payload);
  }

  /**
   * Update a memory.
   *
   * @param memoryId - Memory ID to update
   * @param memoryData - Memory data to update the memory with
   * @returns Updated memory
   */
  async update(memoryId: string, memoryData: MemoryUpdate | Record<string, any>): Promise<Memory> {
    const payload = memoryData;
    const response = await this.client.put<{ memory: Memory }>(`/memories/${memoryId}`, payload);
    return response.memory;
  }

  /**
   * Replace a memory.
   *
   * @param memoryId - Memory ID to replace
   * @param memoryData - Memory data to replace the memory with
   * @returns Memory replaced
   */
  async replace(memoryId: string, memoryData: MemoryReplace | Record<string, any>): Promise<any> {
    const payload = memoryData;
    return this.client.post(`/memories/${memoryId}/replace`, payload);
  }

  /**
   * Delete a memory.
   *
   * @param memoryId - Memory ID to delete
   * @param userId - User ID to delete the memory for
   * @returns void
   */
  async delete(memoryId: string, userId?: string): Promise<void> {
    const params: Record<string, any> = {};
    if (userId) params.user_id = userId;

    let endpoint = `/memories/${memoryId}`;
    if (Object.keys(params).length > 0) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
      endpoint += `?${queryString}`;
    }

    await this.client.delete(endpoint);
    // 204 No Content - no response body
  }
  /**
   * Create memories from messages.
   *
   * @param request - Request for creating memories from messages
   * @returns MemoryFromMessagesResponse with memories created
   */

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

  /**
   * Get memory chunks.
   *
   * @param options - Options for getting memory chunks
   * @returns MemoryChunksResponse with memory chunks data, next_cursor, and has_more
   */
  async getChunks(options: {
    user_id: string;
    limit?: number;
    cursor?: string;
    include_embedding?: boolean;
  }): Promise<MemoryChunksResponse> {
    const params: Record<string, any> = {
      user_id: options.user_id,
      limit: options.limit || 100,
      include_embedding: options.include_embedding || false,
    };
    if (options.cursor) params.cursor = options.cursor;

    return this.client.get<MemoryChunksResponse>('/memories/chunks', params);
  }

  /**
   * Get the user's memory profile.
   *
   * This endpoint returns:
   * - The user profile memory (if it exists)
   * - Structured profile data extracted from the user's memories
   *
   * The profile is automatically generated and updated based on the user's memories.
   * It provides a comprehensive view of the user's identity, preferences, and context.
   *
   * @param userId - User ID to get the profile for
   * @returns MemoryProfileResponse with profile data
   *
   * @example
   * ```typescript
   * const profile = await client.memories.getProfile('user_123');
   * if (profile.profile) {
   *   console.log('Profile memory:', profile.profile.memory);
   * }
   * if (profile.structured_profile) {
   *   console.log('Structured data:', profile.structured_profile);
   * }
   * ```
   */
  async getProfile(userId: string): Promise<MemoryProfileResponse> {
    const params: Record<string, any> = {
      user_id: userId,
    };
    return this.client.get<MemoryProfileResponse>('/memories/profile', params);
  }
}

