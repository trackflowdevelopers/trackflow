import { apiClient } from '../axios';
import type { Company, CompanyListQuery, PaginatedResponse } from '@trackflow/shared-types';

export async function getCompanies(query: CompanyListQuery): Promise<PaginatedResponse<Company>> {
  const { data } = await apiClient.get<PaginatedResponse<Company>>('/companies', { params: query });
  return data;
}

export async function getCompanyById(id: string): Promise<Company> {
  const { data } = await apiClient.get<Company>(`/companies/${id}`);
  return data;
}
