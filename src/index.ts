import axios, { AxiosInstance, AxiosError } from 'axios';

// ============= TYPES =============

export interface MessageObject {
  message: string;
  role?: string;
  created_at?: string;
  [key: string]: any; // For additional properties, like user_id
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
    totalLength = content.reduce((acc, msg) => acc + msg.message.length, 0);
  }

  // Base timeout of 10 seconds
  let timeout = 10000;

  // Add time based on message count
  if (messageCount <= 10) {
    timeout += messageCount * 300;
  } else if (messageCount <= 30) {
    timeout += 10 * 300 + (messageCount - 10) * 600;
  } else if (messageCount <= 50) {
    timeout += 10 * 300 + 20 * 600 + (messageCount - 30) * 1000;
  } else if (messageCount <= 100) {
    timeout += 10 * 300 + 20 * 600 + 20 * 1000 + (messageCount - 50) * 300;
  } else {
    // For 100+ messages, use webhook instead
    timeout = 120000; // 2 minutes max
  }

  // Add time based on total character length
  const lengthFactor = Math.ceil(totalLength / 10000);
  timeout += lengthFactor * 1000;

  // Cap at 2 minutes for synchronous requests
  return Math.min(timeout, 120000);
}

export function calculateRetryDelay(
  attempt: number,
  baseDelay: number = 60000,
  maxDelay: number = 600000,
  factor: number = 2
): number {
  const delay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);
  // Add jitter to avoid thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return Math.floor(delay + jitter);
}

export function calculateProcessingDelay(contentLength: number): number {
  // 1 minute per 15,000 characters
  const minutes = Math.ceil(contentLength / 15000);
  return minutes * 60000; // Convert to milliseconds
}

export function isRetryableError(error: any): boolean {
  if (!error.response) {
    // Network errors are retryable
    return true;
  }

  const status = error.response.status;
  // Retry on 503 (Service Unavailable) and 429 (Rate Limit)
  return status === 503 || status === 429;
}

export function getContentLength(content: Content): number {
  if (typeof content === 'string') {
    return content.length;
  }
  return content.reduce((acc, msg) => acc + msg.message.length, 0);
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
  
  // Find the first message that has a user_id
  const messageWithUserId = content.find(msg => msg.user_id);
  return messageWithUserId?.user_id;
}

// ============= MAIN CLIENT CLASS =============

export class MieltoCompressClient {
  private client: AxiosInstance;
  private retryConfig: RetryConfig;
  private onRetry?: (attempt: number, error: any) => void;

  constructor(apiKeyOrOptions?: string | CompressOptions) {
    // Handle both string (API key) and options object
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
      maxDelay: 600000, // 10 minutes max
      factor: 2
    };

    this.onRetry = onRetry;
  }

  async compress(request: CompressRequest): Promise<CompressResponse> {
    const contentLength = getContentLength(request.content);
    const messageCount = getMessageCount(request.content);

    // Automatically extract user_id from content if not provided and if messages have user_id
    if (!request.user_id) {
      const extractedUserId = extractUserIdFromContent(request.content);
      if (extractedUserId) {
        request = { ...request, user_id: extractedUserId };
      }
    }

    // Validate content length
    if (contentLength > 800000) {
      throw new Error(`Content is too long (${contentLength} characters). Maximum allowed is 800,000 characters.`);
    }

    // Calculate appropriate timeout based on content
    const timeout = calculateTimeout(request.content);

    // Warn about using webhook for large content
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

      // Check if the response indicates processing is still ongoing
      if (response.data.status === 'success' && 
          response.data.message && 
          response.data.message.toLowerCase().includes('being processed')) {
        
        // This is a processing response, not the final result
        if (attempt < this.retryConfig.maxRetries) {
          // For processing delays, use content-based delay instead of exponential backoff
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

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));

          return this.executeWithRetry(request, timeout, attempt + 1);
        } else {
          // Max retries reached while still processing
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

        // Check if it's a retryable error
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

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));

          return this.executeWithRetry(request, timeout, attempt + 1);
        }

        // Handle non-retryable errors
        if (axiosError.response) {
          const { status, data } = axiosError.response;

          if (status === 400) {
            const errorMessage = typeof data === 'string' ? data : data.detail;
            throw new Error(`Bad Request: ${errorMessage}`);
          }

          if (status === 500) {
            const errorMessage = typeof data === 'string' ? data : data.detail;
            throw new Error(`Server Error: ${errorMessage}`);
          }

          if (status === 503) {
            // After all retries failed
            throw new Error(
              `Service Unavailable: The compression service is temporarily unavailable. ` +
              `This usually happens with large content. Please try again later or use webhook_url for async processing.`
            );
          }
        }

        // Network or timeout errors
        if (axiosError.code === 'ECONNABORTED') {
          throw new Error(
            `Request timeout after ${timeout / 1000}s. Consider using webhook_url for large content.`
          );
        }

        throw new Error(
          `Request failed: ${axiosError.message}`
        );
      }

      throw error;
    }
  }

  /**
   * Update client configuration
   */
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

// ============= USAGE EXAMPLES =============

/*
// Basic usage:
const client = new MieltoCompressClient({
  baseUrl: 'https://api.mielto.com',
  maxRetries: 3,
  retryDelay: 60000,
  onRetry: (attempt, error) => {
    console.log(`Retry attempt ${attempt} due to error:`, error.message);
  }
});

// Simple compression:
const result = await client.compress({
  content: "Your long text content here..."
});

// With message array and metadata:
const result = await client.compress({
  content: [
    {
      message: "Hello, how can I help?",
      role: "assistant",
      created_at: "2025-01-15T10:30:00Z"
    },
    {
      message: "I need help with my order",
      role: "user",
      created_at: "2025-01-15T10:30:15Z"
    }
  ],
  include_metadata: false
});

// For large content with webhook:
const result = await client.compress({
  content: largeMessageArray,
  webhook_url: "https://your-app.com/webhook/compression-result"
});

// Update configuration dynamically:
client.updateConfig({
  timeout: 180000,
  maxRetries: 5
});

// Use helper functions:
const messageCount = getMessageCount(content);
const contentLength = getContentLength(content);
*/