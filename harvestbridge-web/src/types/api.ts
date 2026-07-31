export type UserRole = 'admin' | 'farmer' | 'consumer' | 'ngo' | 'compost_business';
export type UserStatus = 'active' | 'inactive' | 'blocked';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string | null;
  district?: string | null;
  organization_name?: string | null;
  company_name?: string | null;
  profile_photo?: string | null;
  can_suspend?: boolean;
  can_activate?: boolean;
  created_at?: string | null;
}

export interface AdminUserProfile extends AdminUser {
  address?: string | null;
  email_verified_at?: string | null;
  counts?: Record<string, number>;
  updated_at?: string | null;
}

export interface AuthSession {
  token: string;
  user: AdminUser;
}

export interface DashboardOverview {
  total_users?: number;
  total_farmers?: number;
  total_consumers?: number;
  total_ngos?: number;
  total_compost_businesses?: number;
  total_stores?: number;
  total_products?: number;
  available_products?: number;
  sold_out_products?: number;
  hidden_products?: number;
  story_count?: number;
  donation_listings?: number;
  compost_listings?: number;
  favorite_products?: number;
  favorite_stores?: number;
  nearby_searches?: number;
  average_store_rating?: number | null;
}

export interface DashboardPayload {
  users?: number;
  active_users?: number;
  farms?: number;
  crops?: number;
  predictions?: number;
  weather_alerts?: number;
  market_prices?: number;
  audit_logs?: number;
  overview?: DashboardOverview;
  generated_at?: string;
}

export interface AnalyticsPayload {
  overview?: DashboardOverview;
  charts?: {
    monthly_user_registrations?: Array<{ month: string; label: string; total: number }>;
    popular_products?: Array<Record<string, unknown>>;
    top_rated_stores?: Array<Record<string, unknown>>;
    most_active_farmers?: Array<Record<string, unknown>>;
  };
  users_by_role?: Array<{ role: UserRole; total: number }>;
  prediction_trends?: Array<{ month: string | null; total: number }>;
  favorite_rate?: {
    total_predictions?: number;
    total_favorites?: number;
  };
  top_selling_analysis?: TopSellingAnalysis;
  generated_at?: string;
}

export type SalesPeriod = 'monthly' | 'three_months' | 'annual';

export interface TopSellingCrop {
  crop_name: string;
  crop_category?: string | null;
  orders_count: number;
  total_quantity: number;
  total_revenue: number;
}

export interface FarmerSellingBreakdown {
  farmer_id: number | null;
  farmer_name: string;
  store_name?: string | null;
  top_crop: string;
  orders_count: number;
  total_quantity: number;
  total_revenue: number;
  crops: TopSellingCrop[];
}

export interface TopSellingAnalysis {
  period: SalesPeriod;
  label: string;
  from: string;
  to: string;
  confirmed_statuses: string[];
  orders_count: number;
  total_quantity: number;
  total_revenue: number;
  top_crops: TopSellingCrop[];
  farmer_breakdown: FarmerSellingBreakdown[];
}

export interface StoreRecord {
  id: number;
  store_name?: string | null;
  store_image_url?: string | null;
  store_logo_url?: string | null;
  owner?: { id: number; name: string; email?: string | null; phone?: string | null };
  district?: string | null;
  address?: string | null;
  business_status?: string | null;
  store_status?: string | null;
  is_suspended?: boolean;
  active_crop_count?: number;
  harvest_listings_count?: number;
  average_rating?: number | null;
  created_at?: string | null;
}

export interface ProductRecord {
  id: number;
  crop?: string | null;
  crop_name?: string | null;
  crop_category?: string | null;
  farmer?: string | null;
  farm?: string | null;
  district?: string | null;
  quantity?: number | string | null;
  available_quantity?: number | string | null;
  reserved_quantity?: number | string | null;
  sold_quantity?: number | string | null;
  unit?: string | null;
  price_per_unit?: number | string | null;
  status?: string | null;
  status_label?: string | null;
  is_featured?: boolean;
  is_available?: boolean;
  created_at?: string | null;
  primary_image?: { url?: string | null; image_url?: string | null } | null;
  description?: string | null;
}

export interface StoryRecord {
  id: number;
  caption?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  is_hidden?: boolean;
  view_count?: number;
  store?: { store_name?: string | null; district?: string | null };
  created_at?: string | null;
  expires_at?: string | null;
}

export interface DonationRecord {
  id: number;
  status?: string | null;
  quantity?: number | string | null;
  unit?: string | null;
  price_per_unit?: number | string | null;
  description?: string | null;
  pickup_location?: string | null;
  product?: { crop_name?: string | null; crop_category?: string | null };
  farmer?: { name?: string | null; email?: string | null };
  store?: { store_name?: string | null; district?: string | null };
  created_at?: string | null;
}

export interface CompostRecord {
  id: number;
  waste_type?: string | null;
  crop_category?: string | null;
  quantity?: number | string | null;
  unit?: string | null;
  price_per_unit?: number | string | null;
  pickup_location?: string | null;
  status?: string | null;
  farmer?: { name?: string | null };
  store?: { store_name?: string | null; district?: string | null };
  created_at?: string | null;
}

export interface ReportRecord {
  id: number;
  content_type?: string | null;
  reason?: string | null;
  description?: string | null;
  status?: string | null;
  reporter?: { name?: string | null; email?: string | null };
  reportable?: { title?: string | null; status?: string | null };
  created_at?: string | null;
}

export interface AuditLogRecord {
  id: number;
  action?: string | null;
  description?: string | null;
  created_at?: string | null;
  user?: { name?: string | null; email?: string | null };
}
