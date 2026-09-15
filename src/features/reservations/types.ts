import { Shop } from "@/features/shops/types";
import { Product } from "@/features/catalog/types";

export type ReservationStatus =
  | "active"
  | "completed"
  | "cancelled"
  | "expired";

export interface Reservation {
  id: string;
  reservation_number: string;
  user_id: string;
  shop_id: string;
  product_id: string;
  quantity: number;
  pickup_code: string;
  status: ReservationStatus;
  expires_at: string;
  completed_at?: string | null;
  notes?: string;
  created_at: string;
  updated_at: string;
  shop?: Shop;
  product?: Product;
  time_remaining_minutes: number;
}

export interface CreateReservationRequest {
  product_id: string;
  quantity: number;
  hold_hours?: number;
  notes?: string;
}

export interface ReservationFilter {
  status?: string;
  page?: number;
  limit?: number;
}

export interface ReservationPaginationResponse {
  reservations: Reservation[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}
