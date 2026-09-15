export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string | null;
  is_active?: boolean;
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  slug: string;
  description: string;
  sku?: string;
  price: number;
  compare_price?: number;
  cost_price?: number;
  floor_price?: number;
  allow_bargain?: boolean;
  category_id: string;
  category_name?: string;
  stock_quantity: number;
  min_stock?: number;
  low_stock_threshold?: number;
  images: string[];
  weight?: number;
  is_active: boolean;
  is_featured: boolean;
  tags?: string[];
  shop_name?: string;
  shop_slug?: string;
  shop_phone?: string;
  shop_address?: string;
  shop_city?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductFilter {
  search?: string;
  category_id?: string;
  shop_id?: string;
  min_price?: number;
  max_price?: number;
  is_featured?: boolean;
  sort_by?: "price_asc" | "price_desc" | "newest" | "stock_desc" | "oldest";
  page?: number;
  limit?: number;
  lat?: number;
  lng?: number;
  radius_km?: number;
  city?: string;
}

export interface ProductPaginationResponse {
  products: Product[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface NearbyProductItem {
  product_id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  available_quantity: number;
  shop_id: string;
  shop_name: string;
  shop_slug: string;
  shop_address: string;
  shop_phone: string;
  distance_km: number;
  is_open: boolean;
  is_currently_open: boolean;
}

export interface NearbyProductResponse {
  products: NearbyProductItem[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
  radius_km: number;
}

export interface MakeOfferRequest {
  offered_price: number;
  quantity?: number;
  customer_phone: string;
  customer_name?: string;
}

export interface BargainNegotiationResponse {
  status: "DEAL_ACCEPTED" | "COUNTER_OFFER" | "BARGAIN_DISABLED" | string;
  product_id: string;
  product_name: string;
  original_price: number;
  offered_price: number;
  agreed_price: number;
  savings_amount: number;
  savings_percentage: number;
  deal_code?: string;
  message: string;
  whatsapp_order_url?: string;
}

export interface NotifyMeRequest {
  customer_phone: string;
  customer_name?: string;
}

export interface NotifyMeResponse {
  message: string;
}

export interface ScanProductResponse {
  product: Product;
  points_reward: number;
}


import type { Shop } from "../shops/types";

export interface HomeFeedData {
  categories: Category[];
  shops: Shop[];
  products: Product[];
}
