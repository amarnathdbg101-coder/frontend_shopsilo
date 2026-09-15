export interface POSSaleItemRequest {
  product_id: string;
  quantity: number;
  unit_price?: number;
  discount_amount?: number;
}

export interface CreatePOSSaleRequest {
  customer_phone?: string;
  customer_name?: string;
  items: POSSaleItemRequest[];
  discount_amount?: number;
  payment_method: "cash" | "upi" | "card" | "credit" | "split";
  split_cash_amount?: number;
  split_upi_amount?: number;
}

export interface POSSaleResponse {
  id: string;
  bill_number: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  receipt_pdf_url?: string;
  whatsapp_receipt_url?: string;
}

export interface POSDailySummaryResponse {
  date: string;
  total_sales_amount: number;
  total_bills_count: number;
  cash_amount: number;
  upi_amount: number;
}

export interface WeeklyTopProductItem {
  product_id: string;
  product_name: string;
  units_sold: number;
  total_sales: number;
}

export interface WeeklyScorecardResponse {
  shop_id: string;
  shop_name: string;
  current_week_range: string;
  previous_week_range: string;
  current_week_revenue: number;
  previous_week_revenue: number;
  growth_percentage: number;
  total_bills_count: number;
  average_order_value: number;
  cash_collected: number;
  online_collected: number;
  khata_new_credit_issued: number;
  khata_recovered_cash: number;
  net_khata_cash_flow: number;
  khata_health_status: string;
  top_selling_products?: WeeklyTopProductItem[];
  out_of_stock_sellers_count?: number;
  whatsapp_summary_copy?: string;
  whatsapp_share_url?: string;
  generated_at?: string;
}

export interface KhataCustomer {
  id: string;
  customer_name: string;
  customer_mobile: string;
  credit_limit: number;
  current_balance: number;
  closure_status?: "ACTIVE" | "PENDING_OTP" | "CLOSED";
  credit_otp_required?: boolean;
  credit_otp_threshold?: number;
  promise_to_pay_date?: string;
  installment_target?: number;
  trust_score?: number;
  trust_badge?: string;
  closure_requested_by?: string;
  closure_otp?: string;
  is_registered?: boolean;
  last_activity_at: string;
}

export interface KhataAgingReport {
  total_outstanding: number;
  total_customers: number;
  bucket_0_to_30: number;
  bucket_31_to_60: number;
  bucket_60_plus: number;
}

export interface RecordCreditRequest {
  customer_name: string;
  customer_mobile: string;
  amount: number;
  notes?: string;
  bill_number?: string;
}

export interface RecordPaymentRequest {
  customer_name?: string;
  amount: number;
  payment_mode?: "cash" | "upi" | "card" | "other";
  payment_method?: string;
  notes?: string;
}

export interface KhataStatement {
  customer_name: string;
  customer_mobile: string;
  current_balance: number;
  transactions?: { id: string; amount: number; type: string; created_at: string }[];
}

export interface LowStockItem {
  product_id: string;
  id?: string;
  name?: string;
  product_name?: string;
  sku?: string;
  current_stock: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  min_threshold?: number;
  price?: number;
  cost_price?: number;
  image_url?: string;
  images?: string[];
}
export type LowStockProduct = LowStockItem;

export interface AdjustStockRequest {
  product_id: string;
  adjustment?: number;
  quantity_delta?: number;
  reason?: string;
  type?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  shop_id: string;
  category: string;
  amount: number;
  notes?: string;
  payment_method: string;
  created_at: string;
}

export type ShopExpense = Expense;

export interface CreateExpenseRequest {
  category: string;
  amount: number;
  notes?: string;
  payment_method: string;
}

export interface ProfitReport {
  month?: string;
  period?: string;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  net_profit: number;
  total_expenses: number;
  profit_margin_percentage?: number;
}

export type MonthlyProfitResponse = ProfitReport;

export interface ReservationItem {
  id: string;
  reservation_number: string;
  product_id: string;
  quantity: number;
  total_price: number;
  status: "pending" | "completed" | "cancelled" | "expired";
  pickup_code: string;
  customer_name?: string;
  customer_phone?: string;
  total_amount?: number;
}

export type MerchantReservation = ReservationItem;

export interface VerifyPickupRequest { pickup_code: string; }

export interface ShopOffer {
  id: string;
  shop_id: string;
  title: string;
  discount_text: string;
  description?: string;
  expires_at?: string;
  expires_in_days?: number;
  is_active: boolean;
  min_points_required?: number;
  created_at?: string;
}

export interface CreateOfferRequest {
  title: string;
  discount_text: string;
  description?: string;
  expires_in_days?: number;
  min_points_required?: number;
}

export interface ProfitableProduct {
  product_id: string;
  name: string;
  total_sold_qty: number;
  profit_margin_pct: number;
  total_profit: number;
}

export interface DeadStockProduct {
  product_id: string;
  name: string;
  current_stock: number;
  days_in_stock: number;
}

export interface ProductMatrixResponse {
  best_profitable?: ProfitableProduct[];
  old_dead_stock?: DeadStockProduct[];
}

export interface KhataTransactionDetail {
  id: string;
  transaction_type: "credit" | "payment" | "reversal";
  type?: "GIVE_CREDIT" | "RECEIVE_PAYMENT" | "REVERSAL";
  status?: "CONFIRMED" | "DISPUTED" | "RESOLVED_ACCEPTED" | "RESOLVED_REJECTED";
  dispute_reason?: string;
  resolution_action?: string;
  resolution_notes?: string;
  resolved_at?: string;
  reversal_of_id?: string;
  parchi_image_url?: string;
  items_summary?: string;
  balance_after?: number;
  bill_number?: string;
  amount: number;
  payment_mode?: string;
  notes?: string;
  created_at: string;
}

export interface CustomerKhataHistoryResponse {
  customer_name: string;
  customer_mobile: string;
  current_balance: number;
  transactions: KhataTransactionDetail[];
}

export interface ParsedParchiItem {
  product_id: string;
  product_name: string;
  sku: string;
  requested_quantity: number;
  parsed_unit?: string;
  unit_price: number;
  total_price: number;
  available_stock: number;
  in_stock: boolean;
}

export interface UnmatchedParchiLine {
  original_line: string;
  query_term: string;
  reason: string;
}

export interface ParseParchiResponse {
  total_lines_parsed: number;
  matched_count: number;
  unmatched_count: number;
  estimated_total_amount: number;
  matched_items: ParsedParchiItem[];
  unmatched_lines: UnmatchedParchiLine[];
}

import type { Shop, ShopDailyDigest } from "@/features/shops/types";

export interface MerchantDashboardData {
  shop: Shop;
  digest: ShopDailyDigest;
  weekly_scorecard?: WeeklyScorecardResponse;
  active_offers_count: number;
}
