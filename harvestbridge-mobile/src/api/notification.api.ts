import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse, LaravelPaginatedData } from '@/types/api';

export interface NotificationDto {
  id: string;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string | null;
}

export type NotificationsPage = LaravelPaginatedData<NotificationDto>;

type NotificationApiPage =
  | NotificationsPage
  | {
      data: NotificationsPage;
    };

const emptyNotificationsPage: NotificationsPage = {
  data: [],
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
  from: null,
  to: null,
  first_page_url: '',
  last_page_url: '',
  next_page_url: null,
  prev_page_url: null,
  links: [],
};

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

export function getNotificationsQueryKey() {
  return ['notifications'] as const;
}

export async function getNotifications() {
  const response = await apiClient.get<ApiSuccessResponse<NotificationApiPage>>(
    '/notifications',
  );

  const payload = response.data.data;

  if (!payload) {
    return emptyNotificationsPage;
  }

  if ('data' in payload && Array.isArray(payload.data)) {
    return payload;
  }

  if ('data' in payload && payload.data && Array.isArray(payload.data.data)) {
    return payload.data;
  }

  return emptyNotificationsPage;
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
