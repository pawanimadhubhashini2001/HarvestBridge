import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';
import type { AuthSession, UserRole } from '@/types/auth';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: Exclude<UserRole, 'admin'>;
}

export interface ForgotPasswordPayload {
  email: string;
}

export async function login(payload: LoginPayload) {
  const response = await apiClient.post<ApiSuccessResponse<AuthSession>>('/login', payload);

  return response.data.data;
}

export async function register(payload: RegisterPayload) {
  const response = await apiClient.post<ApiSuccessResponse<AuthSession>>('/register', payload);

  return response.data.data;
}

export async function logout() {
  const response = await apiClient.post<ApiSuccessResponse<null>>('/logout');

  return response.data;
}

export async function forgotPassword(payload: ForgotPasswordPayload) {
  const response = await apiClient.post<ApiSuccessResponse<null>>('/forgot-password', payload);

  return response.data;
}
