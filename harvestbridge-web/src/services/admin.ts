import { api, toPaginated, unwrap } from '../lib/api';
import type {
  AdminUser,
  AdminUserProfile,
  AnalyticsPayload,
  AuditLogRecord,
  AuthSession,
  CompostRecord,
  DashboardPayload,
  DonationRecord,
  ProductRecord,
  ReportRecord,
  StoreRecord,
  StoryRecord,
  SalesPeriod,
  UserStatus,
} from '../types/api';

export interface ListParams {
  search?: string;
  status?: string;
  role?: string;
  business_status?: string;
  is_suspended?: string;
  state?: string;
  content_type?: string;
  district?: string;
  per_page?: number;
  page?: number;
  from?: string;
  to?: string;
}

export async function loginAdmin(email: string, password: string) {
  return unwrap<AuthSession>(api.post('/login', { email, password }));
}

export async function logoutAdmin() {
  return unwrap<null>(api.post('/logout'));
}

export async function getDashboard() {
  return unwrap<DashboardPayload>(api.get('/admin/dashboard'));
}

export async function getAnalytics(params: { period?: SalesPeriod } = {}) {
  return unwrap<AnalyticsPayload>(api.get('/admin/analytics', { params }));
}

export async function getAuditLogs(params: ListParams = {}) {
  const payload = await unwrap<unknown>(api.get('/admin/audit-logs', { params }));
  return toPaginated<AuditLogRecord>(payload);
}

export async function getUsers(params: ListParams = {}) {
  const payload = await unwrap<unknown>(api.get('/admin/users', { params }));
  return toPaginated<AdminUser>(payload);
}

export async function getUser(id: number) {
  return unwrap<AdminUserProfile>(api.get(`/admin/users/${id}`));
}

export async function updateUserStatus(id: number, status: UserStatus) {
  return unwrap<AdminUser>(api.patch(`/admin/users/${id}/status`, { status }));
}

export async function suspendUser(id: number) {
  return unwrap<AdminUser>(api.patch(`/admin/users/${id}/suspend`));
}

export async function activateUser(id: number) {
  return unwrap<AdminUser>(api.patch(`/admin/users/${id}/activate`));
}

export async function getStores(params: ListParams = {}) {
  const payload = await unwrap<unknown>(api.get('/admin/moderation/stores', { params }));
  return toPaginated<StoreRecord>(payload);
}

export async function getProducts(params: ListParams = {}) {
  const payload = await unwrap<unknown>(api.get('/admin/moderation/products', { params }));
  return toPaginated<ProductRecord>(payload);
}

export async function getStories(params: ListParams = {}) {
  const payload = await unwrap<unknown>(api.get('/admin/moderation/stories', { params }));
  return toPaginated<StoryRecord>(payload);
}

export async function getDonations(params: ListParams = {}) {
  const payload = await unwrap<unknown>(api.get('/admin/moderation/donations', { params }));
  return toPaginated<DonationRecord>(payload);
}

export async function getCompostListings(params: ListParams = {}) {
  const payload = await unwrap<unknown>(api.get('/admin/moderation/compost-listings', { params }));
  return toPaginated<CompostRecord>(payload);
}

export async function getReports(params: ListParams = {}) {
  const payload = await unwrap<unknown>(api.get('/admin/moderation/reports', { params }));
  return toPaginated<ReportRecord>(payload);
}

export async function hideProduct(id: number) {
  return unwrap<ProductRecord>(api.patch(`/admin/moderation/products/${id}/hide`));
}

export async function deleteProduct(id: number) {
  return unwrap<null>(api.delete(`/admin/moderation/products/${id}`));
}

export async function suspendStore(id: number) {
  return unwrap<StoreRecord>(api.patch(`/admin/moderation/stores/${id}/suspend`));
}

export async function hideStory(id: number) {
  return unwrap<StoryRecord>(api.patch(`/admin/moderation/stories/${id}/hide`));
}

export async function deleteStory(id: number) {
  return unwrap<null>(api.delete(`/admin/moderation/stories/${id}`));
}

export async function hideDonation(id: number) {
  return unwrap<DonationRecord>(api.patch(`/admin/moderation/donations/${id}/hide`));
}

export async function deleteDonation(id: number) {
  return unwrap<null>(api.delete(`/admin/moderation/donations/${id}`));
}

export async function hideCompostListing(id: number) {
  return unwrap<CompostRecord>(api.patch(`/admin/moderation/compost-listings/${id}/hide`));
}

export async function deleteCompostListing(id: number) {
  return unwrap<null>(api.delete(`/admin/moderation/compost-listings/${id}`));
}
