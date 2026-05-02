import { createContext } from 'react';
import type { AuthUser, LoginResponse } from '@trackflow/shared-types';

export interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  setSession: (data: LoginResponse) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
