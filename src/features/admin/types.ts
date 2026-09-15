import { Shop } from "@/features/shops/types";
import { User } from "@/features/auth/types";

export interface AdminStatsResponse {
  total_shops: number;
  active_shops: number;
  pending_shops: number;
  flagged_shops: number;
  banned_shops: number;
  pending_reports: number;
  total_reports: number;
  banned_entities: number;
  total_users: number;
  total_products: number;
  total_categories: number;
}

export type ShopModerationStatus =
  | "active"
  | "pending_review"
  | "flagged"
  | "suspended"
  | "banned";

export interface UpdateShopStatusRequest {
  status: ShopModerationStatus;
  reason?: string;
}

export interface AdminReport {
  id: string;
  target_type: "shop" | "product" | "review";
  target_id: string;
  reason: string;
  details?: string;
  status: "pending" | "reviewed" | "action_taken" | "dismissed";
  created_at: string;
}
