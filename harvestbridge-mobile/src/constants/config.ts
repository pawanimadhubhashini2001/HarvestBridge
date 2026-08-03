const DEFAULT_API_TIMEOUT = 30000;

function getRequiredEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getNumberEnv(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

export const config = {
  apiBaseUrl: getRequiredEnv(
    process.env.EXPO_PUBLIC_API_BASE_URL,
    'EXPO_PUBLIC_API_BASE_URL',
  ),
  apiTimeout: getNumberEnv(
    process.env.EXPO_PUBLIC_API_TIMEOUT,
    DEFAULT_API_TIMEOUT,
  ),
  isDevelopment: __DEV__,
} as const;
