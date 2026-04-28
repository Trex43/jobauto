const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  token?: string;
  refreshToken?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;

    // Debug logging for VS Code webview / browser console
    if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_API) {
      console.log(`[API] ${options.method || 'GET'} ${url}`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_API) {
        console.log(`[API] ${options.method || 'GET'} ${url} → ${response.status}`, data);
      }

      if (!response.ok) {
        const error: any = new Error(data.message || `HTTP ${response.status}`);
        error.errors = data.errors || [];
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err: any) {
      // Network / CORS errors
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        console.error(`[API] Network error: Cannot reach ${url}. Is the backend running?`);
        const networkError: any = new Error('Network error: Cannot reach the server. Please ensure the backend is running.');
        networkError.status = 0;
        throw networkError;
      }
      throw err;
    }
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(`${API_URL}/api`);

