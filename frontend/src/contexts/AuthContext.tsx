import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/apiClient';

interface User {
  id: number;
  username: string;
  role: string;
  admin_level: number;
  admin_title: string;
  is_active: boolean;
  email?: string;
  created_at?: string;
  last_login?: string;
  failed_login_attempts: number;
  account_locked_until?: string;
  created_by?: number;
  permissions: Record<string, boolean>;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    username: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/api/v1/auth/check');
      const data = await api.parseResponse(response);

      if (response.ok && data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
        // Redirect to login if not authenticated and not already on login page
        if (window.location.pathname !== '/login') {
          navigate('/login');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      // Redirect to login on any auth error
      if (window.location.pathname !== '/login') {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    username: string,
    password: string,
    rememberMe = false
  ): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);

      const response = await api.post('/api/v1/auth/login', {
        username,
        password,
        remember_me: rememberMe,
      });

      const data = await api.parseResponse(response);

      if (response.ok) {
        setUser(data.user);
        return { success: true, message: data.message || 'Login successful' };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      api.clearToken(); // Clear CSRF token
      setUser(null);
      navigate('/login');
    }
  };

  const clearAuth = () => {
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth,
    clearAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
