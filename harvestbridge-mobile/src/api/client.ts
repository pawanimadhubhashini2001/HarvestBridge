import axios from 'axios';

import { API_TIMEOUT_MS } from '@/constants/app';
import { getStoredToken } from '@/services/auth-storage';
import { env } from '@/utils/env';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: API_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
