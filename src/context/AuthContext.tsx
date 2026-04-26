import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get<{ user: User }>('/auth/me')
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data.user);
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ user: User; token: string; refreshToken: string }>('/auth/login', {
      email,
      password,
    });

    if (!res.success || !res.data) {
      throw new Error(res.message || 'Login failed');
    }

    localStorage.setItem('token', res.data.token);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setUser(res.data.user);
  };

  const register = async (data: RegisterData) => {
    const res = await api.post<{ user: User; token: string; refreshToken: string }>('/auth/register', data);

    if (!res.success || !res.data) {
      throw new Error(res.message || 'Registration failed');
    }

    localStorage.setItem('token', res.data.token);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

