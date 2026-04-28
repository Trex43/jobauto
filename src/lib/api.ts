const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  token?: string;
  refreshToken?: string;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success && data.data?.tokens?.accessToken) {
      localStorage.setItem('token', data.data.tokens.accessToken);
      if (data.data.tokens.refreshToken) {
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
      }
      return data.data.tokens.accessToken;
    }

    return null;
  } catch {
    return null;
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
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
        // Attempt token refresh on 401 if we haven't already retried
        if (response.status === 401 && retry && token) {
          if (!isRefreshing) {
            isRefreshing = true;
            const newToken = await refreshAccessToken();
            isRefreshing = false;

            if (newToken) {
              onRefreshed(newToken);
              // Retry original request with new token
              return this.request<T>(endpoint, options, false);
            } else {
              // Refresh failed — clear auth state
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              window.location.href = '/login';
              const error: any = new Error('Session expired. Please log in again.');
              error.status = 401;
              throw error;
            }
          } else {
            // Wait for refresh to complete, then retry
            return new Promise((resolve, reject) => {
              addRefreshSubscriber((newToken) => {
                const retryHeaders: Record<string, string> = {
                  'Content-Type': 'application/json',
                  ...((options.headers as Record<string, string>) || {}),
                  Authorization: `Bearer ${newToken}`,
                };
                fetch(url, { ...options, headers: retryHeaders })
                  .then(async (retryRes) => {
                    const d = await retryRes.json().catch(() => ({}));
                    if (!retryRes.ok) {
                      const err: any = new Error(d.message || `HTTP ${retryRes.status}`);
                      err.status = retryRes.status;
                      err.data = d;
                      reject(err);
                    } else {
                      resolve(d);
                    }
                  })
                  .catch(reject);
              });
            });
          }
        }

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

