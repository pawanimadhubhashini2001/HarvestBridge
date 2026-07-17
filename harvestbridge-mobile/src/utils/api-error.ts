import axios from 'axios';

import type { ApiErrorResponse, FieldErrorMap } from '@/types/api';

export class AppApiError extends Error {
  status?: number;
  errors?: FieldErrorMap;

  constructor(message: string, status?: number, errors?: FieldErrorMap) {
    super(message);
    this.name = 'AppApiError';
    this.status = status;
    this.errors = errors;
  }
}

export function normalizeApiError(error: unknown): AppApiError {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const status = error.response?.status;
    const payload = error.response?.data;

    return new AppApiError(
      payload?.message ?? error.message ?? 'Something went wrong.',
      status,
      payload?.errors ?? undefined,
    );
  }

  if (error instanceof Error) {
    return new AppApiError(error.message);
  }

  return new AppApiError('Something went wrong.');
}
