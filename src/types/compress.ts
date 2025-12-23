/** Compress type definitions. */

export interface CompressRequest {
  content: string | Array<Record<string, any>>;
  strategy?: string;
  include_metadata?: boolean;
  webhook_url?: string;
}

export interface CompressResponse {
  status: string;
  content?: string;
  compression_time?: number;
  original_length?: number;
  compressed_length?: number;
  message?: string;
}

