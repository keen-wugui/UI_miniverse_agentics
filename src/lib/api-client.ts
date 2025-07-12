import apiConfig from "@/config/api-config.json";
import { logger, ApiLogData } from "@/lib/logger";

// Types for the API client
export interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  headers?: Record<string, string>;
  authToken?: string;
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: RequestCache;
  isFormData?: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  data?: any;
  code?: string;
}

// Custom error class for API errors
export class ApiClientError extends Error implements ApiError {
  status?: number;
  statusText?: string;
  data?: any;
  code?: string;

  constructor(
    message: string,
    status?: number,
    statusText?: string,
    data?: any,
    code?: string
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.code = code;
  }
}

// Utility function to build URLs with path parameters
export function buildUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string | number>
): string {
  let url = `${baseUrl}${path}`;

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, String(value));
    });
  }

  return url;
}

// Utility function to add query parameters
export function addQueryParams(
  url: string,
  params?: Record<string, any>
): string {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }

  const urlObj = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      urlObj.searchParams.set(key, String(value));
    }
  });

  return urlObj.toString();
}

// Sleep utility for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main API Client class
export class ApiClient {
  private config: ApiClientConfig;
  private authToken?: string;

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = {
      baseUrl: apiConfig.api.baseUrl,
      timeout: apiConfig.api.timeout,
      headers: {
        "Content-Type": "application/json",
      },
      ...config,
    };
  }

  // Set authentication token
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  // Clear authentication token
  clearAuthToken(): void {
    this.authToken = undefined;
  }

  // Get headers with authentication
  private getHeaders(additionalHeaders?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = {
      ...this.config.headers,
      ...additionalHeaders,
    };

    if (this.authToken && apiConfig.api.authentication.type === "bearer") {
      headers[apiConfig.api.authentication.headerName] =
        `${apiConfig.api.authentication.tokenPrefix}${this.authToken}`;
    }

    return headers;
  }

  // Check if status code is retryable
  private isRetryableError(status: number): boolean {
    return apiConfig.api.retries.retryableStatusCodes.includes(status);
  }

  // Get error message for status code
  private getErrorMessage(status: number, defaultMessage?: string): string {
    const errorMessage =
      apiConfig.errorHandling.errorMessages[
        status.toString() as keyof typeof apiConfig.errorHandling.errorMessages
      ];
    return (
      errorMessage ||
      defaultMessage ||
      apiConfig.errorHandling.defaultErrorMessage
    );
  }

  // Log request (if enabled)
  private logRequest(url: string, options: RequestInit, correlationId?: string): void {
    if (apiConfig.logging.enabled && apiConfig.logging.logRequests) {
      const logData: ApiLogData = {
        method: options.method || "GET",
        url,
        correlationId,
        headers: this.sanitizeHeaders(options.headers as Record<string, string>),
        requestSize: this.getRequestSize(options.body),
      };
      logger.logApiRequest(logData);
    }
  }

  // Log response (if enabled)
  private logResponse(
    url: string, 
    response: Response, 
    data?: any, 
    duration?: number,
    correlationId?: string,
    method?: string
  ): void {
    if (apiConfig.logging.enabled && apiConfig.logging.logResponses) {
      const logData: ApiLogData = {
        method: method || "GET",
        url,
        statusCode: response.status,
        duration,
        correlationId,
        responseSize: this.getResponseSize(data),
      };
      logger.logApiResponse(logData);
    }
  }

  // Log error (if enabled)
  private logError(
    error: ApiClientError, 
    url?: string, 
    method?: string, 
    correlationId?: string
  ): void {
    if (apiConfig.logging.enabled && apiConfig.logging.logErrors) {
      const logData: ApiLogData & { error: any } = {
        method: method || "UNKNOWN",
        url: url || "UNKNOWN",
        statusCode: error.status,
        correlationId,
        error,
      };
      logger.logApiError(logData);
    }
  }

  // Core request method with retry logic
  private async makeRequest<T>(
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const correlationId = logger.generateCorrelationId();
    const startTime = Date.now();
    const {
      method = "GET",
      headers,
      body,
      timeout = this.config.timeout,
      retries = apiConfig.api.retries.maxAttempts,
      cache,
    } = options;

    let lastError: ApiClientError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const fetchOptions: RequestInit = {
          method,
          headers: this.getHeaders(headers),
          body: body && !options.isFormData ? JSON.stringify(body) : body,
          signal: controller.signal,
          cache,
        };

        // Log the request
        this.logRequest(url, fetchOptions, correlationId);

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        // Parse response
        let data: T;
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          data = (await response.text()) as unknown as T;
        }

        // Log the response
        const duration = Date.now() - startTime;
        this.logResponse(url, response, data, duration, correlationId, method);

        // Handle successful response
        if (response.ok) {
          return {
            data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          };
        }

        // Handle error response
        const errorMessage = this.getErrorMessage(response.status);
        const error = new ApiClientError(
          errorMessage,
          response.status,
          response.statusText,
          data,
          "HTTP_ERROR"
        );

        // Check if we should retry
        if (attempt < retries && this.isRetryableError(response.status)) {
          const delay =
            apiConfig.api.retries.delay *
            Math.pow(apiConfig.api.retries.backoffMultiplier, attempt);
          await sleep(delay);
          continue;
        }

        throw error;
      } catch (error) {
        if (error instanceof ApiClientError) {
          lastError = error;
        } else if (error instanceof Error) {
          if (error.name === "AbortError") {
            lastError = new ApiClientError(
              "Request timeout",
              408,
              "Request Timeout",
              undefined,
              "TIMEOUT"
            );
          } else {
            lastError = new ApiClientError(
              `Network error: ${error.message}`,
              0,
              "Network Error",
              undefined,
              "NETWORK_ERROR"
            );
          }
        } else {
          lastError = new ApiClientError(
            "Unknown error occurred",
            0,
            "Unknown Error",
            undefined,
            "UNKNOWN_ERROR"
          );
        }

        // Check if we should retry network errors
        if (
          attempt < retries &&
          (lastError.code === "TIMEOUT" ||
            lastError.code === "NETWORK_ERROR") &&
          (apiConfig.errorHandling.retryOnTimeout ||
            apiConfig.errorHandling.retryOnNetworkError)
        ) {
          const delay =
            apiConfig.api.retries.delay *
            Math.pow(apiConfig.api.retries.backoffMultiplier, attempt);
          await sleep(delay);
          continue;
        }

        break;
      }
    }

    // Log the final error
    if (lastError) {
      this.logError(lastError, url, method, correlationId);
      throw lastError;
    }

    throw new ApiClientError(
      "Maximum retries exceeded",
      0,
      "Max Retries",
      undefined,
      "MAX_RETRIES"
    );
  }

  // HTTP method helpers
  async get<T>(
    path: string,
    params?: Record<string, any>,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ): Promise<ApiResponse<T>> {
    const url = addQueryParams(buildUrl(this.config.baseUrl, path), params);
    return this.makeRequest<T>(url, { ...options, method: "GET" });
  }

  async post<T>(
    path: string,
    data?: any,
    options: Omit<ApiRequestOptions, "method"> = {}
  ): Promise<ApiResponse<T>> {
    const url = buildUrl(this.config.baseUrl, path);
    return this.makeRequest<T>(url, { ...options, method: "POST", body: data });
  }

  async put<T>(
    path: string,
    data?: any,
    options: Omit<ApiRequestOptions, "method"> = {}
  ): Promise<ApiResponse<T>> {
    const url = buildUrl(this.config.baseUrl, path);
    return this.makeRequest<T>(url, { ...options, method: "PUT", body: data });
  }

  async patch<T>(
    path: string,
    data?: any,
    options: Omit<ApiRequestOptions, "method"> = {}
  ): Promise<ApiResponse<T>> {
    const url = buildUrl(this.config.baseUrl, path);
    return this.makeRequest<T>(url, {
      ...options,
      method: "PATCH",
      body: data,
    });
  }

  async delete<T>(
    path: string,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ): Promise<ApiResponse<T>> {
    const url = buildUrl(this.config.baseUrl, path);
    return this.makeRequest<T>(url, { ...options, method: "DELETE" });
  }

  // Specialized methods for common patterns
  async getById<T>(
    path: string,
    id: string | number,
    options?: Omit<ApiRequestOptions, "method" | "body">
  ): Promise<ApiResponse<T>> {
    return this.get<T>(path, undefined, options);
  }

  async uploadFile<T>(
    path: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const url = buildUrl(this.config.baseUrl, path);

    // Don't set Content-Type for FormData - let browser set it with boundary
    const headers = this.getHeaders();
    delete (headers as any)["Content-Type"];

    return this.makeRequest<T>(url, {
      method: "POST",
      headers: headers as Record<string, string>,
      body: formData,
      isFormData: true,
    });
  }

  // Helper methods for logging
  private sanitizeHeaders(headers?: Record<string, string>): Record<string, string> {
    if (!headers) return {};
    
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
      if (sanitized[header.toLowerCase()]) {
        sanitized[header.toLowerCase()] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  private getRequestSize(body?: any): number | undefined {
    if (!body) return undefined;
    if (typeof body === 'string') return body.length;
    if (body instanceof FormData) return undefined; // Can't easily measure FormData size
    return JSON.stringify(body).length;
  }

  private getResponseSize(data?: any): number | undefined {
    if (!data) return undefined;
    if (typeof data === 'string') return data.length;
    return JSON.stringify(data).length;
  }
}

// Create default API client instance
export const apiClient = new ApiClient();

// Export configuration for use in other modules
export { apiConfig };
