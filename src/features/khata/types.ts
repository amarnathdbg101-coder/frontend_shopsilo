export interface CustomerShopKhataItem {
  khata_id: string;
  shop_id: string;
  shop_name: string;
  shop_slug: string;
  shop_phone: string;
  shop_whatsapp?: string;
  shop_address?: string;
  shop_logo?: string;
  shop_upi_id?: string;
  current_balance: number;
  credit_limit: number;
  credit_otp_required?: boolean;
  credit_otp_threshold?: number;
  promise_to_pay_date?: string;
  installment_target?: number;
  trust_score?: number;
  trust_badge?: string;
  closure_status?: "ACTIVE" | "PENDING_OTP" | "CLOSED";
  closure_requested_by?: string;
  closure_otp?: string;
  last_activity_at?: string;
}

export interface CustomerKhataSummary {
  total_market_due: number;
  total_shops_count: number;
  shops: CustomerShopKhataItem[];
}

export interface KhataTransactionItem {
  id: string;
  khata_id: string;
  shop_id: string;
  type: "GIVE_CREDIT" | "RECEIVE_PAYMENT" | "REVERSAL";
  amount: number;
  balance_after: number;
  notes?: string;
  bill_number?: string;
  payment_mode?: string;
  status: "CONFIRMED" | "DISPUTED" | "RESOLVED_ACCEPTED" | "RESOLVED_REJECTED";
  resolution_action?: string;
  resolution_notes?: string;
  resolved_at?: string;
  reversal_of_id?: string;
  parchi_image_url?: string;
  items_summary?: string;
  dispute_reason?: string;
  disputed_at?: string;
  upi_ref_no?: string;
  created_at: string;
}

export interface CustomerKhataPassbook {
  shop: CustomerShopKhataItem;
  customer_name: string;
  transactions: KhataTransactionItem[];
}

export interface DisputeKhataRequest {
  transaction_id: string;
  reason: string;
}

export interface SubmitKhataUPIPaymentRequest {
  amount: number;
  upi_ref_no: string;
  notes?: string;
}

export interface SetCreditOTPProtectionRequest {
  required: boolean;
  threshold: number;
}

export interface SetPromiseToPayRequest {
  promise_date: string;
  installment_target?: number;
}

export interface CustomerTrustScoreResponse {
  customer_name: string;
  customer_mobile: string;
  trust_score: number;
  trust_badge: "TRUSTED" | "MODERATE" | "HIGH_RISK" | string;
  summary: string;
  on_time_rate: number;
  average_days_to_pay: number;
  total_transactions: number;
  current_balance: number;
  credit_limit: number;
  credit_otp_required: boolean;
  credit_otp_threshold: number;
}
