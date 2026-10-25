import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { authApi } from '../api/client.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  devOtpNotice: string | null;
  setDevOtpNotice: (otp: string | null) => void;
  loginInitiate: (email: string, password: string, adminSecretKey?: string) => Promise<{ success: boolean; devOtp?: string; message: string; role?: string }>;
  loginVerify: (email: string, otp: string) => Promise<{ success: boolean; user: User }>;
  registerInitiate: (data: {
    name: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    adminSecretKey?: string;
  }) => Promise<{ success: boolean; devOtp?: string; message: string }>;
  registerVerify: (email: string, otp: string) => Promise<{ success: boolean; user: User }>;
  resendOtp: (email: string, type: 'signup' | 'login' | 'forgot_password') => Promise<{ success: boolean; devOtp?: string; message: string }>;
  forgotPasswordInitiate: (email: string) => Promise<{ success: boolean; devOtp?: string; message: string }>;
  resetPasswordVerify: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cinepass_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cinepass_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [devOtpNotice, setDevOtpNotice] = useState<string | null>(null);

  // Validate session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('cinepass_token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          setUser(res.user);
          localStorage.setItem('cinepass_user', JSON.stringify(res.user));
        } catch (err) {
          console.warn('Session expired or invalid token');
          localStorage.removeItem('cinepass_token');
          localStorage.removeItem('cinepass_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const loginInitiate = async (email: string, password: string, adminSecretKey?: string) => {
    const res = await authApi.loginInitiate(email, password, adminSecretKey);
    if (res.devOtp) {
      setDevOtpNotice(res.devOtp);
    }
    return res;
  };

  const loginVerify = async (email: string, otp: string) => {
    const res = await authApi.loginVerify(email, otp);
    if (res.token && res.user) {
      localStorage.setItem('cinepass_token', res.token);
      localStorage.setItem('cinepass_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      setDevOtpNotice(null);
    }
    return res;
  };

  const registerInitiate = async (data: {
    name: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    adminSecretKey?: string;
  }) => {
    const res = await authApi.registerInitiate(data);
    if (res.devOtp) {
      setDevOtpNotice(res.devOtp);
    }
    return res;
  };

  const registerVerify = async (email: string, otp: string) => {
    const res = await authApi.registerVerify(email, otp);
    if (res.token && res.user) {
      localStorage.setItem('cinepass_token', res.token);
      localStorage.setItem('cinepass_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      setDevOtpNotice(null);
    }
    return res;
  };

  const resendOtp = async (email: string, type: 'signup' | 'login' | 'forgot_password') => {
    const res = await authApi.resendOtp(email, type);
    if (res.devOtp) {
      setDevOtpNotice(res.devOtp);
    }
    return res;
  };

  const forgotPasswordInitiate = async (email: string) => {
    const res = await authApi.forgotPasswordInitiate(email);
    if (res.devOtp) {
      setDevOtpNotice(res.devOtp);
    }
    return res;
  };

  const resetPasswordVerify = async (email: string, otp: string, newPassword: string) => {
    const res = await authApi.resetPasswordVerify(email, otp, newPassword);
    setDevOtpNotice(null);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('cinepass_token');
    localStorage.removeItem('cinepass_user');
    setToken(null);
    setUser(null);
    setDevOtpNotice(null);
  };

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        devOtpNotice,
        setDevOtpNotice,
        loginInitiate,
        loginVerify,
        registerInitiate,
        registerVerify,
        resendOtp,
        forgotPasswordInitiate,
        resetPasswordVerify,
        logout,
        isAdmin,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
