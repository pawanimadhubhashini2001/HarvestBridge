const DEFAULT_API_TIMEOUT = 30000;

function getRequiredEnv(name: 'EXPO_PUBLIC_API_BASE_URL'): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getNumberEnv(name: 'EXPO_PUBLIC_API_TIMEOUT', fallback: number): number {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

export const config = {
  apiBaseUrl: getRequiredEnv('EXPO_PUBLIC_API_BASE_URL'),
  apiTimeout: getNumberEnv('EXPO_PUBLIC_API_TIMEOUT', DEFAULT_API_TIMEOUT),
  isDevelopment: __DEV__,
} as const;
