import Constants from 'expo-constants';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export class ApiClient {
  private baseUrl: string;
  private timeoutMs: number = 10000;

  constructor() {
    // Dynamically retrieve base API URL configured in app.config.ts extras
    const extra = Constants.expoConfig?.extra || {};
    this.baseUrl = extra.apiUrl || 'http://10.0.2.2:3000/api';
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeoutMs);

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

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
      return {
        data: null,
        error: e.name === 'AbortError' ? 'Request Timeout' : e.message || 'Unknown network error',
        status: 0
      };
    }
  }
}

export const apiClient = new ApiClient();
