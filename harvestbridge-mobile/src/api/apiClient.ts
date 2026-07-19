import axios from 'axios';

import { config } from '@/constants/config';
import { clearStoredToken, getStoredToken } from '@/services/auth-storage';
import { notifyUnauthorized } from '@/services/auth-session-events';
import { normalizeApiError } from '@/utils/errorHandler';

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeout,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (requestConfig) => {
  const existingAuthorizationHeader =
    requestConfig.headers?.Authorization ?? requestConfig.headers?.authorization;

  if (!existingAuthorizationHeader) {
    const token = await getStoredToken();

    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
  }

  if (typeof FormData !== 'undefined' && requestConfig.data instanceof FormData) {
    delete requestConfig.headers['Content-Type'];
    delete requestConfig.headers['content-type'];
  }

  if (config.isDevelopment) {
    console.log('[API Request]', {
      method: requestConfig.method?.toUpperCase(),
      url: `${requestConfig.baseURL ?? ''}${requestConfig.url ?? ''}`,
      params: requestConfig.params,
      data: requestConfig.data,
    });
  }

  return requestConfig;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const normalizedError = normalizeApiError(error);

    if (normalizedError.status === 401) {
      await clearStoredToken();
      await notifyUnauthorized('expired');
    }

    return Promise.reject(normalizedError);
  },
);
