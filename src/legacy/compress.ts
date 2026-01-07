/** Legacy MieltoCompressClient - Use Mielto.compress instead. */

import axios, { AxiosInstance, AxiosError } from 'axios';

// ============= TYPES =============

export interface MessageObject {
  message: string;
  role?: string;
  created_at?: string;
  [key: string]: any;
}

export type Content = string | MessageObject[];

export interface CompressRequest {
  content: Content;
  include_metadata?: boolean;
  webhook_url?: string;
  user_id?: string;
}

export interface CompressResponse {
  status: string;
  content?: string;
  compression_time?: number;
  original_length?: number;
  compressed_length?: number;
  message?: string;
  user_id?: string;
}

export interface ErrorResponse {
  detail: string;
}

export interface CompressOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: any) => void;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;
}

// ============= UTILITY FUNCTIONS =============

export function calculateTimeout(content: Content): number {
  let messageCount = 0;
  let totalLength = 0;

  if (typeof content === 'string') {
    totalLength = content.length;
    messageCount = 1;
  } else if (Array.isArray(content)) {
    messageCount = content.length;
    totalLength = content.reduce((acc, msg) => acc + (msg.message?.length || 0), 0);
  }

  let timeout = 10000;

  if (messageCount <= 10) {
    timeout += messageCount * 300;
  } else if (messageCount <= 30) {
    timeout += 10 * 300 + (messageCount - 10) * 600;
  } else if (messageCount <= 50) {
    timeout += 10 * 300 + 20 * 600 + (messageCount - 30) * 1000;
  } else if (messageCount <= 100) {
    timeout += 10 * 300 + 20 * 600 + 20 * 1000 + (messageCount - 50) * 300;
  } else {
    timeout = 120000;
  }

  const lengthFactor = Math.ceil(totalLength / 10000);
  timeout += lengthFactor * 1000;

  return Math.min(timeout, 120000);
}

export function calculateRetryDelay(
  attempt: number,
  baseDelay: number = 60000,
  maxDelay: number = 600000,
  factor: number = 2
): number {
  const delay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);
  const jitter = Math.random() * 0.3 * delay;
  return Math.floor(delay + jitter);
}

export function calculateProcessingDelay(contentLength: number): number {
  const minutes = Math.ceil(contentLength / 15000);
  return minutes * 60000;
}

export function isRetryableError(error: any): boolean {
  if (!error.response) {
    return true;
  }
  const status = error.response.status;
  return status === 503 || status === 429;
}

export function getContentLength(content: Content): number {
  if (typeof content === 'string') {
    return content.length;
  }
  return content.reduce((acc, msg) => acc + (msg.message?.length || 0), 0);
}

export function getMessageCount(content: Content): number {
  if (typeof content === 'string') {
    return 1;
  }
  return content.length;
}

export function extractUserIdFromContent(content: Content): string | undefined {
  if (typeof content === 'string') {
    return undefined;
  }
  const messageWithUserId = content.find(msg => msg.user_id);
  return messageWithUserId?.user_id;
}

// ============= MAIN CLIENT CLASS =============

export class MieltoCompressClient {
  private client: AxiosInstance;
  private retryConfig: RetryConfig;
  private onRetry?: (attempt: number, error: any) => void;

  constructor(apiKeyOrOptions?: string | CompressOptions) {
    let options: CompressOptions = {};
    
    if (typeof apiKeyOrOptions === 'string') {
      options = { apiKey: apiKeyOrOptions };
    } else if (apiKeyOrOptions) {
      options = apiKeyOrOptions;
    }

    const {
      apiKey,
      baseUrl = 'https://api.mielto.com',
      timeout = 120000,
      maxRetries = 10,
      retryDelay = 10000,
      onRetry
    } = options;

    this.client = axios.create({
      baseURL: baseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    });

    this.retryConfig = {
      maxRetries,
      initialDelay: retryDelay,
      maxDelay: 600000,
      factor: 2
    };

    this.onRetry = onRetry;
  }

  async compress(request: CompressRequest): Promise<CompressResponse> {
    const contentLength = getContentLength(request.content);
    const messageCount = getMessageCount(request.content);

    if (!request.user_id) {
      const extractedUserId = extractUserIdFromContent(request.content);
      if (extractedUserId) {
        request = { ...request, user_id: extractedUserId };
      }
    }

    if (contentLength > 800000) {
      throw new Error(`Content is too long (${contentLength} characters). Maximum allowed is 800,000 characters.`);
    }

    const timeout = calculateTimeout(request.content);

    if (messageCount > 100 && !request.webhook_url) {
      console.warn(
        `Warning: You have ${messageCount} messages. Consider using webhook_url for better reliability.`
      );
    }

    return this.executeWithRetry(request, timeout);
  }

  private async executeWithRetry(
    request: CompressRequest,
    timeout: number,
    attempt: number = 1
  ): Promise<CompressResponse> {
    try {
      const response = await this.client.post<CompressResponse>(
        '/api/v1/compress',
        request,
        { timeout }
      );

      if (response.data.status === 'success' && 
          response.data.message && 
          response.data.message.toLowerCase().includes('being processed')) {
        
        if (attempt < this.retryConfig.maxRetries) {
          const contentLength = getContentLength(request.content);
          const delay = calculateProcessingDelay(contentLength);

          if (this.onRetry) {
            this.onRetry(attempt, { 
              message: 'Content still processing',
              response: { status: 200, data: response.data }
            });
          }

          console.log(
            `Content is still being processed (${contentLength} characters). ` +
            `Retrying in ${Math.round(delay / 1000)}s (${Math.round(delay / 60000)} minutes)... ` +
            `(attempt ${attempt}/${this.retryConfig.maxRetries})`
          );

          await new Promise(resolve => setTimeout(resolve, delay));

          return this.executeWithRetry(request, timeout, attempt + 1);
        } else {
          throw new Error(
            `Content is still being processed after ${this.retryConfig.maxRetries} attempts. ` +
            `Please use webhook_url for large content or try again later.`
          );
        }
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ErrorResponse | string>;

        if (isRetryableError(error) && attempt < this.retryConfig.maxRetries) {
          const delay = calculateRetryDelay(
            attempt,
            this.retryConfig.initialDelay,
            this.retryConfig.maxDelay,
            this.retryConfig.factor
          );

          if (this.onRetry) {
            this.onRetry(attempt, error);
          }

          console.log(
            `Retrying request (attempt ${attempt}/${this.retryConfig.maxRetries}) after ${Math.round(delay / 1000)}s delay. ` +
            `Error: ${axiosError.response?.status || 'Network error'}`
          );

          await new Promise(resolve => setTimeout(resolve, delay));

          return this.executeWithRetry(request, timeout, attempt + 1);
        }

        if (axiosError.response) {
          const { status, data } = axiosError.response;

          if (status === 400) {
            const errorMessage = typeof data === 'string' ? data : (data as ErrorResponse).detail;
            throw new Error(`Bad Request: ${errorMessage}`);
          }

          if (status === 500) {
            const errorMessage = typeof data === 'string' ? data : (data as ErrorResponse).detail;
            throw new Error(`Server Error: ${errorMessage}`);
          }

          if (status === 503) {
            throw new Error(
              `Service Unavailable: The compression service is temporarily unavailable. ` +
              `This usually happens with large content. Please try again later or use webhook_url for async processing.`
            );
          }
        }

        if (axiosError.code === 'ECONNABORTED') {
          throw new Error(
            `Request timeout after ${timeout / 1000}s. Consider using webhook_url for large content.`
          );
        }

        throw new Error(`Request failed: ${axiosError.message}`);
      }

      throw error;
    }
  }

  updateConfig(options: Partial<CompressOptions>): void {
    if (options.apiKey) {
      this.client.defaults.headers['Authorization'] = `Bearer ${options.apiKey}`;
    }

    if (options.baseUrl) {
      this.client.defaults.baseURL = options.baseUrl;
    }

    if (options.timeout) {
      this.client.defaults.timeout = options.timeout;
    }

    if (options.maxRetries !== undefined) {
      this.retryConfig.maxRetries = options.maxRetries;
    }

    if (options.retryDelay !== undefined) {
      this.retryConfig.initialDelay = options.retryDelay;
    }

    if (options.onRetry !== undefined) {
      this.onRetry = options.onRetry;
    }
  }
}

