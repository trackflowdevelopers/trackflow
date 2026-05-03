import { apiClient } from '../axios';
import type { Company, CreateCompanyPayload, UpdateCompanyPayload } from '@trackflow/shared-types';

export async function createCompany(payload: CreateCompanyPayload): Promise<Company> {
  const { data } = await apiClient.post<Company>('/companies', payload);
  return data;
}

export async function updateCompany(id: string, payload: UpdateCompanyPayload): Promise<Company> {
  const { data } = await apiClient.patch<Company>(`/companies/${id}`, payload);
  return data;
}

export async function deleteCompany(id: string): Promise<void> {
  await apiClient.delete(`/companies/${id}`);
}
