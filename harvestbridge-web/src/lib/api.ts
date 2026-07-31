import axios, { AxiosError } from 'axios';

import type { ApiEnvelope, PaginatedResult, PaginationMeta } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api';
const TOKEN_KEY = 'harvestbridge_admin_token';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('harvestbridge_admin_user');
    }

    return Promise.reject(error);
  },
);

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function unwrap<T>(request: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const response = await request;
  return response.data.data;
}

export function getApiError(error: unknown) {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    const message = error.response?.data?.message ?? error.message;
    const errors = error.response?.data?.errors;
    const firstValidationError = errors ? Object.values(errors).flat()[0] : undefined;
    return firstValidationError ?? message;
  }

  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function toPaginated<T>(payload: unknown): PaginatedResult<T> {
  const source = payload as { data?: unknown; meta?: Partial<PaginationMeta> } | T[] | undefined;
  const itemsSource = Array.isArray(source)
    ? source
    : Array.isArray(source?.data)
      ? source.data
      : [];
  const metaSource = !Array.isArray(source) ? source?.meta : undefined;

  return {
    items: itemsSource as T[],
    meta: {
      current_page: Number(metaSource?.current_page ?? 1),
      last_page: Number(metaSource?.last_page ?? 1),
      per_page: Number(metaSource?.per_page ?? itemsSource.length),
      total: Number(metaSource?.total ?? itemsSource.length),
    },
  };
}
