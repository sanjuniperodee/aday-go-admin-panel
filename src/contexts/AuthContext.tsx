import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import { AdminAuth, AdminSMSRequest, AdminSMSConfirm } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (credentials: AdminAuth) => Promise<void>;
  sendSMSCode: (request: AdminSMSRequest) => Promise<{ smscode?: string }>;
  confirmSMSCode: (request: AdminSMSConfirm) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем аутентификацию при загрузке
    const checkAuth = () => {
      const authenticated = apiService.isAuthenticated();
      setIsAuthenticated(authenticated);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: AdminAuth) => {
    try {
      await apiService.adminLogin(credentials);
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    setIsAuthenticated(false);
  };

  const sendSMSCode = async (request: AdminSMSRequest) => {
    try {
      const response = await apiService.sendSMSCode(request);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const confirmSMSCode = async (request: AdminSMSConfirm) => {
    try {
      await apiService.confirmSMSCode(request);
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    }
  };

  const value = {
    isAuthenticated,
    login,
    logout,
    sendSMSCode,
    confirmSMSCode,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 