/**
 * API Client for Test Setup and Cleanup
 * ======================================
 * Provides reusable API utilities for:
 * - Authentication token retrieval
 * - Test data setup/teardown
 * - Backend state verification
 *
 * Environment Variables:
 *   - API_BASE_URL: Base URL for API endpoints (e.g., https://api.staging.bluworks.io)
 *   - API_AUTH_TOKEN: Pre-configured auth token (optional, for CI)
 *
 * Usage:
 *   import { ApiClient } from '../api/apiClient';
 *   const api = new ApiClient();
 *   await api.authenticate('user@example.com', 'password');
 *   const data = await api.get('/endpoint');
 */

import { request, APIRequestContext, APIResponse } from '@playwright/test';

export interface ApiClientOptions {
  baseURL?: string;
  authToken?: string;
  timeout?: number;
}

export interface ApiError extends Error {
  status?: number;
  response?: unknown;
}

export class ApiClient {
  private baseURL: string;
  private authToken: string | null = null;
  private timeout: number;
  private context: APIRequestContext | null = null;

  constructor(options: ApiClientOptions = {}) {
    this.baseURL = options.baseURL || process.env.API_BASE_URL || '';
    this.authToken = options.authToken || process.env.API_AUTH_TOKEN || null;
    this.timeout = options.timeout || 30_000;

    if (!this.baseURL) {
      console.warn(
        '[ApiClient] API_BASE_URL not configured. API calls will fail. ' +
          'Set API_BASE_URL in .env or pass baseURL in constructor.',
      );
    }
  }

  /**
   * Initialize the API request context
   */
  async init(): Promise<void> {
    if (this.context) return;

    this.context = await request.newContext({
      baseURL: this.baseURL,
      timeout: this.timeout,
      extraHTTPHeaders: this.getHeaders(),
    });
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
    this.context = null; // Force re-initialization with new token
  }

  /**
   * Authenticate and obtain a token (implementation depends on your API)
   */
  async authenticate(email: string, password: string): Promise<string> {
    if (!this.baseURL) {
      throw new Error('[ApiClient] Cannot authenticate: API_BASE_URL not configured');
    }

    await this.init();

    const response = await this.context!.post('/auth/login', {
      data: { email, password },
    });

    if (!response.ok()) {
      const error: ApiError = new Error(`Authentication failed: ${response.status()}`);
      error.status = response.status();
      try {
        error.response = await response.json();
      } catch {
        error.response = await response.text();
      }
      throw error;
    }

    const data = await response.json();
    const token = data.token || data.accessToken || data.access_token;

    if (!token) {
      throw new Error('[ApiClient] No token in authentication response');
    }

    this.setAuthToken(token);
    return token;
  }

  /**
   * Make a GET request
   */
  async get<T = unknown>(endpoint: string, params?: Record<string, string>): Promise<T> {
    await this.init();

    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    const response = await this.context!.get(url, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make a POST request
   */
  async post<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    await this.init();

    const response = await this.context!.post(endpoint, {
      data,
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make a PUT request
   */
  async put<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    await this.init();

    const response = await this.context!.put(endpoint, {
      data,
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make a PATCH request
   */
  async patch<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    await this.init();

    const response = await this.context!.patch(endpoint, {
      data,
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make a DELETE request
   */
  async delete<T = unknown>(endpoint: string): Promise<T> {
    await this.init();

    const response = await this.context!.delete(endpoint, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: APIResponse): Promise<T> {
    if (!response.ok()) {
      const error: ApiError = new Error(`API request failed: ${response.status()} ${response.statusText()}`);
      error.status = response.status();
      try {
        error.response = await response.json();
      } catch {
        error.response = await response.text();
      }
      throw error;
    }

    const contentType = response.headers()['content-type'] || '';
    if (contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return response.text() as unknown as T;
  }

  /**
   * Cleanup and dispose of the context
   */
  async dispose(): Promise<void> {
    if (this.context) {
      await this.context.dispose();
      this.context = null;
    }
  }

  // ===========================================================================
  // Test Data Helpers (customize based on your application's API)
  // ===========================================================================

  /**
   * Create test user (example - adjust to your API)
   */
  async createTestUser(userData: { email: string; name: string }): Promise<{ id: string; email: string }> {
    return this.post('/users', userData);
  }

  /**
   * Delete test user (example - adjust to your API)
   */
  async deleteTestUser(userId: string): Promise<void> {
    await this.delete(`/users/${userId}`);
  }

  /**
   * Get current user profile (example - adjust to your API)
   */
  async getCurrentUser(): Promise<{ id: string; email: string; name: string }> {
    return this.get('/users/me');
  }

  /**
   * Verify backend health
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.init();
      const response = await this.context!.get('/health');
      return response.ok();
    } catch {
      return false;
    }
  }
}

// Export singleton instance for convenience
export const apiClient = new ApiClient();
