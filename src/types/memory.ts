/** Memory type definitions. */

export interface MemoryCreate {
  user_id: string;
  memory: string;
  memory_type?: string;
  topics?: string[];
  metadata?: Record<string, any>;
}

export interface MemoryUpdate {
  user_id?: string;
  memory?: string;
  topics?: string[];
  metadata?: Record<string, any>;
}

export interface MemoryReplace {
  user_id?: string;
  memory: string;
  topics?: string[];
  metadata?: Record<string, any>;
}

export interface Memory {
  memory_id: string;
  user_id: string;
  memory: string;
  topics?: string[];
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

export interface MemorySearchRequest {
  query: string;
  user_id?: string;
  limit?: number;
  retrieval_method?: string;
}

export interface MemorySearchResponse {
  memories: Memory[];
  total_results: number;
  query: string;
  retrieval_method: string;
}

export interface MemoryListResponse {
  data: Memory[];
  total_count?: number | null;
  next_cursor?: string | null;
  has_more: boolean;
}

export interface MemoryFromMessagesRequest {
  messages: Array<Record<string, any>>;
  user_id: string;
  agent_id?: string;
  team_id?: string;
}

export interface MemoryFromMessagesResult {
  memories_created: number;
  memory_ids: string[];
}

export interface MemoryFromMessagesResponse {
  message: string;
  result?: MemoryFromMessagesResult;
  memories?: Memory[];
}

export interface MemoryChunk {
  id: string;
  content: string;
  content_id?: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

export interface MemoryChunksResponse {
  data: MemoryChunk[];
  total_count?: number | null;
  next_cursor?: string | null;
  has_more: boolean;
}

export interface MemoryProfileResponse {
  user_id: string;
  profile?: Memory | null;
  structured_profile?: Record<string, any> | null;
}

