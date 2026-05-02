import { useContext } from 'react';
import type { AuthContextValue } from './authContext';
import { AuthContext } from './authContext';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
