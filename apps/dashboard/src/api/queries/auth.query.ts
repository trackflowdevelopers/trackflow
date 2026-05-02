import type { AuthUser } from '@trackflow/shared-types';
import { apiClient } from '../axios';

export async function getMe(accessToken: string): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}
