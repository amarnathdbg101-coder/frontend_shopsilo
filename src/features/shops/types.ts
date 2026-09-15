export interface Shop {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  pincode?: string;
  whatsapp_number?: string;
  whatsapp_url?: string;
  google_maps_url?: string;
  logo_url?: string;
  banners?: string[];
  timing?: string;
  opening_time?: string;
  closing_time?: string;
  weekly_off?: string;
  is_open: boolean;
  is_currently_open: boolean;
  is_active: boolean;
  distance_km?: number;
  average_rating: number;
  total_reviews: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ShopFilter {
  search?: string;
  category?: string;
  city?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  page?: number;
  limit?: number;
}

export interface ShopPaginationResponse {
  shops: Shop[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ShopDailyDigest {
  date: string;
  today_sales_amount: number;
  today_sales_count: number;
  active_reservations: number;
  low_stock_count: number;
  total_khata_udhar: number;
  total_khata_customers: number;
}

export interface ShopReview {
  id: string;
  shop_id: string;
  user_id: string;
  user_name?: string;
  rating: number;
  comment?: string;
  is_verified_visitor?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ReviewPaginationResponse {
  reviews: ShopReview[];
  average_rating: number;
  total_reviews: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CreateShopReviewRequest {
  rating: number;
  comment?: string;
}

