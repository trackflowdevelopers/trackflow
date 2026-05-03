import React, { createContext, useEffect, useState } from 'react';
import { AuthUser } from '@trackflow/shared-types';
import * as authService from '../services/authService';

export interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    const token = await authService.getStoredAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getMe(token);
      setUser(currentUser);
      setAccessToken(token);
    } catch {
      const refreshed = await authService.refreshTokens();
      if (refreshed) {
        setUser(refreshed.user);
        setAccessToken(refreshed.accessToken);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const data = await authService.login(email, password);
    setUser(data.user);
    setAccessToken(data.accessToken);
  }

  async function logout() {
    await authService.logout();
    setUser(null);
    setAccessToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

