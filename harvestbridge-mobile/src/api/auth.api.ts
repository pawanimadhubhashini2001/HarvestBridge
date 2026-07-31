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

export interface OtpPayload {
  email: string;
  otp: string;
}

export async function login(payload: LoginPayload) {
  const response = await apiClient.post<ApiSuccessResponse<AuthSession>>('/login', payload);

  return response.data.data;
}

export async function register(payload: RegisterPayload) {
  const response = await apiClient.post<ApiSuccessResponse<AuthSession>>('/register', payload);

  return response.data.data;
}

export async function requestRegistrationOtp(payload: RegisterPayload) {
  const response = await apiClient.post<ApiSuccessResponse<null>>(
    '/auth/register/request-otp',
    payload,
  );

  return response.data;
}

export async function verifyRegistrationOtp(payload: OtpPayload) {
  const response = await apiClient.post<ApiSuccessResponse<AuthSession>>(
    '/auth/register/verify-otp',
    payload,
  );

  return response.data.data;
}

export async function requestLoginOtp(payload: LoginPayload) {
  const response = await apiClient.post<ApiSuccessResponse<null>>(
    '/auth/login/request-otp',
    payload,
  );

  return response.data;
}

export async function verifyLoginOtp(payload: OtpPayload) {
  const response = await apiClient.post<ApiSuccessResponse<AuthSession>>(
    '/auth/login/verify-otp',
    payload,
  );

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
