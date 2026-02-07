// API Client for FhirHubServer
// Simple HTTP client for making API calls to the backend

import { ApiException, API_ERROR_CODES } from "@/types";

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  getAccessToken?: () => string | null;
}

export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private getAccessToken?: () => string | null;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.timeout = config.timeout ?? 30000;
    this.getAccessToken = config.getAccessToken;
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      params?: URLSearchParams;
      body?: unknown;
    }
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;

    if (options?.params) {
      const queryString = options.params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      const token = this.getAccessToken?.();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage: string;
        let errorCode: string = API_ERROR_CODES.INTERNAL_ERROR;

        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.message || errorJson.error || errorBody;
          errorCode =
            errorJson.code || this.mapStatusToErrorCode(response.status);
        } catch {
          errorMessage = errorBody || response.statusText;
          errorCode = this.mapStatusToErrorCode(response.status);
        }

        throw new ApiException(errorCode, errorMessage, response.status);
      }

      // Handle empty responses
      const text = await response.text();
      if (!text) {
        return undefined as T;
      }

      return JSON.parse(text) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiException) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new ApiException(
            API_ERROR_CODES.TIMEOUT,
            "Request timed out",
            408
          );
        }

        throw new ApiException(
          API_ERROR_CODES.NETWORK_ERROR,
          error.message || "Network error occurred",
          0
        );
      }

      throw new ApiException(
        API_ERROR_CODES.INTERNAL_ERROR,
        "An unexpected error occurred",
        500
      );
    }
  }

  private mapStatusToErrorCode(status: number): string {
    switch (status) {
      case 400:
        return API_ERROR_CODES.VALIDATION_ERROR;
      case 401:
        return API_ERROR_CODES.UNAUTHORIZED;
      case 403:
        return API_ERROR_CODES.FORBIDDEN;
      case 404:
        return API_ERROR_CODES.NOT_FOUND;
      case 408:
        return API_ERROR_CODES.TIMEOUT;
      default:
        return API_ERROR_CODES.INTERNAL_ERROR;
    }
  }

  async get<T>(path: string, params?: URLSearchParams): Promise<T> {
    return this.request<T>("GET", path, { params });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, { body });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, { body });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, { body });
  }

  async delete(path: string): Promise<void> {
    return this.request<void>("DELETE", path);
  }

  async getBlob(path: string): Promise<Blob> {
    const url = `${this.baseUrl}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {};

      const token = this.getAccessToken?.();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        const errorCode = this.mapStatusToErrorCode(response.status);
        throw new ApiException(
          errorCode,
          errorBody || response.statusText,
          response.status
        );
      }

      return await response.blob();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiException) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new ApiException(
            API_ERROR_CODES.TIMEOUT,
            "Request timed out",
            408
          );
        }

        throw new ApiException(
          API_ERROR_CODES.NETWORK_ERROR,
          error.message || "Network error occurred",
          0
        );
      }

      throw new ApiException(
        API_ERROR_CODES.INTERNAL_ERROR,
        "An unexpected error occurred",
        500
      );
    }
  }
}

// Default API base URL from environment
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5197";

// Create a default client instance
export function createApiClient(
  baseUrl?: string,
  getAccessToken?: () => string | null
): ApiClient {
  return new ApiClient({
    baseUrl: baseUrl || API_BASE_URL,
    getAccessToken,
  });
}
