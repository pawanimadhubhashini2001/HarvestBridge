import axios from 'axios';

import type { ApiErrorResponse, AppError, AppErrorCode, FieldErrorMap } from '@/types/api';

function mapStatusToCode(status?: number): AppErrorCode {
  switch (status) {
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 422:
      return 'VALIDATION_ERROR';
    default:
      if (status && status >= 500) {
        return 'SERVER_ERROR';
      }

      return 'UNKNOWN_ERROR';
  }
}

export function createAppError(params: {
  code: AppErrorCode;
  message: string;
  status?: number;
  errors?: FieldErrorMap;
  isNetworkError?: boolean;
  isTimeoutError?: boolean;
}) {
  const error = new Error(params.message) as AppError;

  error.name = 'AppError';
  error.code = params.code;
  error.status = params.status;
  error.errors = params.errors;
  error.isNetworkError = params.isNetworkError ?? false;
  error.isTimeoutError = params.isTimeoutError ?? false;

  return error;
}

export function normalizeApiError(error: unknown): AppError {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const status = error.response?.status;
    const payload = error.response?.data;
    const isTimeoutError = error.code === 'ECONNABORTED';
    const isNetworkError = !error.response;

    if (isTimeoutError) {
      return createAppError({
        code: 'TIMEOUT_ERROR',
        message: 'The request took too long to complete.',
        status,
        isTimeoutError: true,
      });
    }

    if (isNetworkError) {
      return createAppError({
        code: 'NETWORK_ERROR',
        message: 'Unable to reach the server. Check your connection and try again.',
        isNetworkError: true,
      });
    }

    return createAppError({
      code: mapStatusToCode(status),
      message: payload?.message ?? error.message ?? 'Something went wrong.',
      status,
      errors: payload?.errors ?? undefined,
    });
  }

  if (error instanceof Error) {
    return createAppError({
      code: 'UNKNOWN_ERROR',
      message: error.message,
    });
  }

  return createAppError({
    code: 'UNKNOWN_ERROR',
    message: 'Something went wrong.',
  });
}
