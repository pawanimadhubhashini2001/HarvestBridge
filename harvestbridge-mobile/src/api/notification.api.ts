import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse, LaravelPaginatedData } from '@/types/api';

export interface NotificationDto {
  id: string;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string | null;
}

export interface SendEmailNotificationPayload {
  user_id: number;
  subject: string;
  message: string;
}

export interface SendSmsNotificationPayload {
  user_id: number;
  message: string;
}

export interface StoreInAppNotificationPayload {
  user_id: number;
  title: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface DispatchWeatherAlertPayload {
  district: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  weather_data?: Record<string, unknown>;
}

export interface DispatchRecommendationAlertPayload {
  prediction_history_id: number;
}

export async function getNotifications() {
  const response = await apiClient.get<ApiSuccessResponse<LaravelPaginatedData<NotificationDto>>>(
    '/notifications',
  );

  return response.data.data;
}

export async function markNotificationAsRead(notificationId: string) {
  const response = await apiClient.patch<ApiSuccessResponse<NotificationDto>>(
    `/notifications/${notificationId}/read`,
  );

  return response.data.data;
}

export async function sendEmailNotification(payload: SendEmailNotificationPayload) {
  const response = await apiClient.post<ApiSuccessResponse<null>>('/notifications/email', payload);

  return response.data;
}

export async function sendSmsNotification(payload: SendSmsNotificationPayload) {
  const response = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(
    '/notifications/sms',
    payload,
  );

  return response.data.data;
}

export async function createInAppNotification(payload: StoreInAppNotificationPayload) {
  const response = await apiClient.post<ApiSuccessResponse<null>>(
    '/notifications/in-app',
    payload,
  );

  return response.data;
}

export async function dispatchWeatherAlerts(payload: DispatchWeatherAlertPayload) {
  const response = await apiClient.post<ApiSuccessResponse<unknown[]>>(
    '/notifications/weather-alerts',
    payload,
  );

  return response.data.data;
}

export async function dispatchRecommendationAlert(
  payload: DispatchRecommendationAlertPayload,
) {
  const response = await apiClient.post<ApiSuccessResponse<null>>(
    '/notifications/recommendation-alerts',
    payload,
  );

  return response.data;
}
