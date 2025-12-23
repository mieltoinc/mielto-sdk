/** Base HTTP client for Mielto API. */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import {
  MieltoError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  TimeoutError,
  ConnectionError,
  PaymentRequiredError,
  CreditLimitExceededError,
  OverageLimitExceededError,
  ErrorResponse,
} from '../exceptions.js';

export interface BaseClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export class BaseClient {
  protected client: AxiosInstance;
  protected apiKey: string;
  protected baseUrl: string;
  protected timeout: number;
  protected maxRetries: number;

  constructor(options: BaseClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || 'https://api.mielto.com/api/v1').replace(/\/$/, '');
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 2;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: this.getHeaders(),
    });
  }

  protected getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  protected buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  protected handleResponseError(error: AxiosError): never {
    const response = error.response;
    const statusCode = response?.status;
    
    let message = error.message;
    let errorData: ErrorResponse | undefined;

    if (response) {
      try {
        errorData = response.data as ErrorResponse;
        message = errorData.detail || errorData.message || response.statusText || message;
      } catch {
        message = response.statusText || message;
      }

      const errorCode = errorData?.error_code;

      // Check for specific error codes first
      if (errorCode === 'CREDIT_LIMIT_EXCEEDED') {
        throw new CreditLimitExceededError(message, statusCode, errorData);
      } else if (errorCode === 'OVERAGE_LIMIT_EXCEEDED') {
        throw new OverageLimitExceededError(message, statusCode, errorData);
      }

      // Handle HTTP status codes
      if (statusCode === 401) {
        throw new AuthenticationError(message, statusCode, errorData);
      } else if (statusCode === 402) {
        throw new PaymentRequiredError(message, statusCode, errorData);
      } else if (statusCode === 403) {
        throw new PermissionError(message, statusCode, errorData);
      } else if (statusCode === 404) {
        throw new NotFoundError(message, statusCode, errorData);
      } else if (statusCode === 422) {
        throw new ValidationError(message, statusCode, errorData);
      } else if (statusCode === 429) {
        throw new RateLimitError(message, statusCode, errorData);
      } else if (statusCode && statusCode >= 500) {
        throw new ServerError(message, statusCode, errorData);
      }
    }

    // Handle network/timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new TimeoutError(`Request timed out: ${message}`, statusCode);
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
      throw new ConnectionError(`Connection error: ${message}`, statusCode);
    }

    throw new MieltoError(message, statusCode, errorData);
  }

  async request<T = any>(
    method: string,
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.request<T>({
        method: method as any,
        url: endpoint,
        ...config,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.handleResponseError(error);
      }
      throw error;
    }
  }

  async get<T = any>(endpoint: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', endpoint, { params, headers });
  }

  async post<T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>('POST', endpoint, { ...config, data });
  }

  async put<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PUT', endpoint, { ...config, data });
  }

  async delete<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('DELETE', endpoint, config);
  }

  close(): void {
    // Axios doesn't have a close method, but we can clear interceptors if needed
  }
}

