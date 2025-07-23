import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import axiosRateLimit from "axios-rate-limit";
import PQueue from "p-queue";
import { getAuthConfig, getAuthHeaders } from "./auth.js";
import { MerakiAPIError } from "./error-handler.js";
import { MerakiApiResponse, PaginationParams } from "../types/common.js";

// Meraki API rate limits
const RATE_LIMIT_PER_SECOND = 5;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

// Response headers we care about
const RATE_LIMIT_HEADERS = {
  RETRY_AFTER: "retry-after",
  RATE_LIMIT_LIMIT: "x-rate-limit-limit",
  RATE_LIMIT_REMAINING: "x-rate-limit-remaining",
  RATE_LIMIT_RESET: "x-rate-limit-reset",
};

export class MerakiHttpClient {
  private client: AxiosInstance;
  private queue: PQueue;
  
  constructor() {
    const config = getAuthConfig();
    
    // Create base axios instance
    const baseClient = axios.create({
      baseURL: config.baseUrl,
      headers: getAuthHeaders(config.apiKey),
      timeout: 30000, // 30 second timeout
      validateStatus: () => true, // Handle all status codes ourselves
    });
    
    // Apply rate limiting
    this.client = axiosRateLimit(baseClient, { 
      maxRequests: RATE_LIMIT_PER_SECOND, 
      perMilliseconds: 1000 
    });
    
    // Create queue for additional rate limiting control
    this.queue = new PQueue({ 
      concurrency: RATE_LIMIT_PER_SECOND,
      interval: 1000,
      intervalCap: RATE_LIMIT_PER_SECOND 
    });
    
    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.error(`[Meraki API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error("[Meraki API] Request error:", error);
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        if (response.status >= 400) {
          return this.handleErrorResponse(response);
        }
        return response;
      },
      (error) => {
        return this.handleNetworkError(error);
      }
    );
  }
  
  /**
   * Make a GET request to the Meraki API
   */
  async get<T>(
    path: string, 
    params?: Record<string, any> & PaginationParams
  ): Promise<MerakiApiResponse<T>> {
    return this.queue.add(() => this.executeRequest<T>({
      method: "GET",
      url: path,
      params,
    })) as Promise<MerakiApiResponse<T>>;
  }
  
  /**
   * Make a POST request to the Meraki API
   */
  async post<T>(
    path: string, 
    data?: any,
    params?: Record<string, any>
  ): Promise<MerakiApiResponse<T>> {
    return this.queue.add(() => this.executeRequest<T>({
      method: "POST",
      url: path,
      data,
      params,
    })) as Promise<MerakiApiResponse<T>>;
  }
  
  /**
   * Make a PUT request to the Meraki API
   */
  async put<T>(
    path: string, 
    data?: any,
    params?: Record<string, any>
  ): Promise<MerakiApiResponse<T>> {
    return this.queue.add(() => this.executeRequest<T>({
      method: "PUT",
      url: path,
      data,
      params,
    })) as Promise<MerakiApiResponse<T>>;
  }
  
  /**
   * Make a DELETE request to the Meraki API
   */
  async delete<T>(
    path: string,
    params?: Record<string, any>
  ): Promise<MerakiApiResponse<T>> {
    return this.queue.add(() => this.executeRequest<T>({
      method: "DELETE",
      url: path,
      params,
    })) as Promise<MerakiApiResponse<T>>;
  }
  
  /**
   * Execute request with retry logic
   */
  private async executeRequest<T>(
    config: AxiosRequestConfig,
    retryCount = 0
  ): Promise<MerakiApiResponse<T>> {
    try {
      const response = await this.client.request<T>(config);
      
      // Check if we need to retry due to rate limiting
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        const retryAfter = this.getRetryAfter(response);
        console.error(`[Meraki API] Rate limited. Retrying after ${retryAfter}ms...`);
        await this.delay(retryAfter);
        return this.executeRequest<T>(config, retryCount + 1);
      }
      
      // Handle successful response
      if (response.status >= 200 && response.status < 300) {
        return {
          data: response.data,
          headers: response.headers as Record<string, string>,
        };
      }
      
      // Handle error response
      throw new MerakiAPIError(
        this.getErrorMessage(response),
        response.status,
        response.data
      );
      
    } catch (error) {
      if (error instanceof MerakiAPIError) {
        throw error;
      }
      
      // Handle network errors
      if (axios.isAxiosError(error)) {
        throw new MerakiAPIError(
          error.message,
          error.response?.status || 0,
          error.response?.data
        );
      }
      
      throw new MerakiAPIError(
        "Unknown error occurred",
        0,
        error
      );
    }
  }
  
  /**
   * Handle error responses from the API
   */
  private async handleErrorResponse(response: AxiosResponse): Promise<AxiosResponse> {
    // Let executeRequest handle rate limiting
    if (response.status === 429) {
      return response;
    }
    
    throw new MerakiAPIError(
      this.getErrorMessage(response),
      response.status,
      response.data
    );
  }
  
  /**
   * Handle network errors
   */
  private async handleNetworkError(error: AxiosError): Promise<never> {
    if (error.code === "ECONNABORTED") {
      throw new MerakiAPIError("Request timeout", 0, null);
    }
    
    if (error.code === "ENOTFOUND") {
      throw new MerakiAPIError("Network not found", 0, null);
    }
    
    throw new MerakiAPIError(
      error.message || "Network error",
      0,
      error
    );
  }
  
  /**
   * Get retry delay from response headers
   */
  private getRetryAfter(response: AxiosResponse): number {
    const retryAfter = response.headers[RATE_LIMIT_HEADERS.RETRY_AFTER];
    
    if (retryAfter) {
      // If it's a number, it's in seconds
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        return seconds * 1000;
      }
    }
    
    // Use exponential backoff
    return INITIAL_BACKOFF_MS;
  }
  
  /**
   * Extract error message from response
   */
  private getErrorMessage(response: AxiosResponse): string {
    if (response.data?.errors?.length > 0) {
      return response.data.errors.join(", ");
    }
    
    if (response.data?.error) {
      return response.data.error;
    }
    
    if (typeof response.data === "string") {
      return response.data;
    }
    
    // Default messages by status code
    const statusMessages: Record<number, string> = {
      400: "Bad Request",
      401: "Unauthorized - Invalid API key",
      403: "Forbidden - Insufficient permissions",
      404: "Not Found",
      429: "Too Many Requests",
      500: "Internal Server Error",
      502: "Bad Gateway",
      503: "Service Unavailable",
    };
    
    return statusMessages[response.status] || `HTTP ${response.status} Error`;
  }
  
  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let httpClient: MerakiHttpClient | null = null;

/**
 * Get the singleton HTTP client instance
 */
export function getHttpClient(): MerakiHttpClient {
  if (!httpClient) {
    httpClient = new MerakiHttpClient();
  }
  return httpClient;
}