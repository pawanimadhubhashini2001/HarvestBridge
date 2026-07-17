const fallbackApiBaseUrl = 'http://127.0.0.1:8000/api';
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackApiBaseUrl;

export const env = {
  apiBaseUrl,
} as const;
