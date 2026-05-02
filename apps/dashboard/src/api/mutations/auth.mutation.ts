import type { LoginResponse } from '@trackflow/shared-types';
import { apiClient } from '../axios';

const ACCESS_TOKEN_KEY = 'tf_access_token';
const REFRESH_TOKEN_KEY = 'tf_refresh_token';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  return data;
}

export async function refreshTokens(): Promise<LoginResponse | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;
  try {
    const { data } = await apiClient.post<LoginResponse>('/auth/refresh', { refreshToken });
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    return data;
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}
