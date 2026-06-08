import Constants from 'expo-constants';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export class ApiClient {
  private baseUrl: string;
  private timeoutMs: number = 10000;
  private maxRetries: number = 3;
  private useMockData: boolean = false; // Toggle true for offline mock validations

  constructor() {
    // Dynamically retrieve base API URL configured in app.config.ts extras
    const extra = Constants.expoConfig?.extra || {};
    this.baseUrl = extra.apiUrl || 'http://10.0.2.2:3000/api';
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    if (this.useMockData) {
      // Mock response resolver
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: { message: "Mock Success data from ApiClient" } as unknown as T,
            error: null,
            status: 200
          });
        }, 500);
      });
    }

    const url = `${this.baseUrl}${path}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    let attempt = 0;
    while (attempt < this.maxRetries) {
      attempt++;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...defaultHeaders,
            ...options.headers
          },
          signal: controller.signal
        });

        clearTimeout(id);

        // Retry on Server Error (5xx)
        if (response.status >= 500 && attempt < this.maxRetries) {
          console.warn(`[ApiClient] Attempt ${attempt} failed with status ${response.status}. Retrying...`);
          continue;
        }

        if (!response.ok) {
          return {
            data: null,
            error: `HTTP Error: ${response.status} ${response.statusText}`,
            status: response.status
          };
        }

        const data = await response.json();
        return {
          data: data as T,
          error: null,
          status: response.status
        };
      } catch (e: any) {
        clearTimeout(id);
        const isTimeout = e.name === 'AbortError';
        
        // Retry on timeout or transient network failures
        if (attempt < this.maxRetries) {
          console.warn(`[ApiClient] Attempt ${attempt} failed: ${e.message}. Retrying...`);
          await new Promise((res) => setTimeout(res, 1000 * attempt)); // Exponential backoff
          continue;
        }

        return {
          data: null,
          error: isTimeout ? 'Request Timeout' : e.message || 'Unknown network error',
          status: 0
        };
      }
    }

    return {
      data: null,
      error: 'Max retries exceeded',
      status: 0
    };
  }
}

export const apiClient = new ApiClient();
