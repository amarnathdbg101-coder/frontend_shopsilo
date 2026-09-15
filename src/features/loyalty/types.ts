export interface LoyaltySummary {
  user_id: string;
  user_name: string;
  points: number;
  tier: "Bronze" | "Silver" | "Gold VIP" | string;
  next_tier_points_needed: number;
}

export interface StoreOffer {
  id: string;
  shop_id: string;
  title: string;
  description?: string;
  discount_text: string;
  min_points_required: number;
  is_active: boolean;
  is_unlocked: boolean;
  shop_name?: string;
  shop_slug?: string;
  shop_category?: string;
  shop_logo_url?: string;
  created_at: string;
  expires_at?: string;
}
