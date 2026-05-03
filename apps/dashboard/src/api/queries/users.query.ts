import { apiClient } from '../axios';
import type { User, UserListQuery, PaginatedResponse } from '@trackflow/shared-types';

export async function getUsers(query: UserListQuery): Promise<PaginatedResponse<User>> {
  const { data } = await apiClient.get<PaginatedResponse<User>>('/users', { params: query });
  return data;
}

export async function getUserById(id: string): Promise<User> {
  const { data } = await apiClient.get<User>(`/users/${id}`);
  return data;
}
