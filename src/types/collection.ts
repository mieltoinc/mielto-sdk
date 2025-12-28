/** Collection type definitions. */

export enum CollectionStoreType {
  PGVECTOR = 'pgvector',
  PINECONE = 'pinecone',
  QDRANT = 'qdrant',
  LANGCHAIN_PGVECTOR = 'langchain_pgvector',
}

export enum CollectionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETING = 'deleting',
  ARCHIVED = 'archived',
}

export enum SearchType {
  HYBRID = 'hybrid',
  VECTOR = 'vector',
  KEYWORD = 'keyword',
}

export interface CollectionCreate {
  name: string;
  description?: string;
  store_type?: CollectionStoreType;
  visibility?: string;
  tags?: string[];
  parent_id?: string;
  meta_data?: Record<string, any>;
  settings?: Record<string, any>;
  embedding?: Record<string, any>;
}

export interface CollectionUpdate {
  name?: string;
  description?: string;
  visibility?: string;
  tags?: string[];
  parent_id?: string;
  meta_data?: Record<string, any>;
  settings?: Record<string, any>;
  embedding?: Record<string, any>;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  store_type?: string;
  visibility: string;
  status: string;
  tags?: string[];
  parent_id?: string;
  stats?: Record<string, any>;
  meta_data?: Record<string, any>;
  settings?: Record<string, any>;
  embedding?: Record<string, any>;
  workspace_id: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SearchResult {
  content: string;
  score: number;
  metadata?: Record<string, any>;
  content_id?: string;
  source?: string;
}

export interface SearchRequest {
  query: string;
  collection_id: string;
  search_type?: SearchType;
  max_results?: number;
  min_score?: number;
  filters?: Record<string, any>;
  metadata_filters?: Record<string, any>;
}

export interface SearchResponse {
  results: SearchResult[];
  total_results: number;
  query: string;
  search_type: string;
}

export interface Chunk {
  id: string;
  content: string;
  content_id?: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface ChunksResponse {
  chunks: Chunk[];
  total_count: number;
  next_cursor?: string | null;
  has_more: boolean;
}

export interface FileUpload {
  file: string; // base64 encoded
  label: string;
  mimetype?: string;
}

export interface UploadRequest {
  collection_id: string;
  content_type: 'text' | 'file' | 'url';
  files?: FileUpload[];
  content?: string;
  urls?: string[];
  label?: string;
  description?: string;
  metadata?: Record<string, any>;
  ingest?: boolean;
  reader?: string | Record<string, string>;
}

export interface UploadContent {
  id: string;
  name: string;
  content_type: string;
  status: string;
  error?: string;
}

export interface UploadError {
  name: string;
  error: string;
}

export interface UploadResponse {
  status: 'success' | 'failed' | 'partial_success';
  total_uploads: number;
  successful_uploads: number;
  failed_uploads: number;
  contents: UploadContent[];
  successful?: UploadContent[];
  errors?: UploadError[];
}

