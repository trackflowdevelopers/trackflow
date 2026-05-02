import axios from 'axios';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});
