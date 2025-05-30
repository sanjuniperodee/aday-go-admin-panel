import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  authError: string | null;
  login: (phone: string, smscode: string) => Promise<void>;
  logout: () => void;
  clearAuthError: () => void;
  validateSession: () => Promise<boolean>;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (apiService.isAuthenticated()) {
          // Проверяем, действителен ли токен
          const isValid = await apiService.validateToken();
          if (isValid) {
            setIsAuthenticated(true);
          } else {
            // Токен недействителен, выходим
            apiService.logout();
            setIsAuthenticated(false);
            setAuthError('Сессия истекла. Необходимо войти в систему заново.');
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (phone: string, smscode: string) => {
    try {
      setAuthError(null);
      setLoading(true);
      await apiService.confirmSMSCode({ phone, smscode });
      setIsAuthenticated(true);
    } catch (error: any) {
      setAuthError(error.message || 'Ошибка авторизации');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiService.logout();
    setIsAuthenticated(false);
    setAuthError(null);
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const validateSession = async (): Promise<boolean> => {
    try {
      const isValid = await apiService.validateToken();
      if (!isValid) {
        setIsAuthenticated(false);
        setAuthError('Сессия истекла. Необходимо войти в систему заново.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    loading,
    authError,
    login,
    logout,
    clearAuthError,
    validateSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 