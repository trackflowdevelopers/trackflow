import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser, LoginResponse } from "@trackflow/shared-types";
import { AuthContext } from "./authContext";
import { getMe } from "@/api/queries/auth.query";
import {
  refreshTokens,
  logout as clearTokens,
  getStoredAccessToken,
} from "@/api/mutations/auth.mutation";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function restoreSession() {
    const token = getStoredAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const currentUser = await getMe(token);
      setUser(currentUser);
      setAccessToken(token);
    } catch {
      const refreshed = await refreshTokens();
      if (refreshed) {
        setUser(refreshed.user);
        setAccessToken(refreshed.accessToken);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function setSession(data: LoginResponse) {
    setUser(data.user);
    setAccessToken(data.accessToken);
  }

  function logout() {
    clearTokens();
    setUser(null);
    setAccessToken(null);
  }

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, setSession, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
