# Walkthrough: Complete Shop Owner (Merchant / Dukandar OS) & Store Management Suite

We have implemented the full **Shop Owner (Dukandar OS)** suite, Flexible Dynamic Attributes (JSONB/NoSQL), and Store Management features in `shopsilo`, integrated directly with the Go backend (`https://shop-me-t48p.onrender.com`).

---

## What Was Implemented

### 1. Flexible NoSQL / JSONB Dynamic Specifications & Search Tags (`ProductAttributesSection.tsx`)
- **Dynamic Key-Value Pairs**: Dukandar can add custom product specifications without any schema restrictions:
  - Common quick chips: `Brand`, `Size / Unit`, `Color`, `Flavor`, `Material`, `Expiry`.
  - `+ Add Field` button to add custom dynamic specifications.
  - Stored directly into PostgreSQL's `attributes JSONB` column (MongoDB-style flexible document storage in Go).
- **Search Tags**: Comma-separated search keywords (`tags: []string`) for fast catalog discovery.

---

### 2. High-Level Hub: Merchant Dashboard (`app/merchant/dashboard.tsx`)
- **Store Status Switch**: Live store toggle (Open / Closed) via `PATCH /shops/me/status` with real-time UI state.
- **Header Settings & QR Buttons**: Fast 1-tap navigation to Store Settings and Counter QR.
- **4-Tile Digest Grid**:
  - Today's Sales Amount & Count (`GET /shops/me/digest`)
  - Market Udhar & Customer Count
  - Active Pickups
  - Low Stock Alerts
- **Counter QR Modal (`ShopQRModal.tsx`)**: High-res QR code generator allowing customers to scan and browse the store catalog or pick up orders, with a 1-tap WhatsApp share button.
- **Tools Navigation**: 7 cards navigating directly to specialized Dukandar OS modules:
  - Add New Product
  - Counter POS Billing
  - Customer Udhar Khata
  - Stock & Inventory
  - Daily Expenses
  - Asli Munafa
  - Counter Pickups
- **Switch to Customer Mode**: 1-tap swap back to regular customer browsing.

---

### 3. Add New Product (`app/merchant/add-product.tsx`)
- **Catalog Management**: Form with:
  - Product Name (min 2 chars)
  - Barcode / SKU with 1-tap **"Auto"** SKU generator
  - Dynamic Category Chips (`useCategories()`)
  - Selling Price (`price`)
  - Wholesale Cost Price (`cost_price`) with **live Munafa per piece ₹ and margin %**
  - MRP (`compare_price`) with **live Customer Discount %**
  - Initial Stock Quantity (`stock_quantity`) and Alert Min Stock (`min_stock`)
  - Weight in kg
  - Flexible Specifications (`attributes: map[string]interface{}`)
  - Search Tags (`tags: []string`)
  - Description
- **Backend Mutation**: `useCreateProduct()` calling `POST /products`.
- **Instant Cache Invalidation**: Updates product lists and warehouse inventory.

---

### 4. Store Profile & Timings Settings (`app/merchant/settings.tsx`)
- **Configurable Store Profile**: Edit Shop Name, Contact/WhatsApp Phone, Operating Timings (e.g. `9:00 AM - 9:00 PM`), Weekly Off, Address, and City.
- **Backend Mutation**: `useUpdateMyShop()` calling `PUT /shops/me`.

---

### 5. Customer Onboarding: "Open Your Shop" Banner (`ProfileRoleCards.tsx`)
- Regular customer profiles display an engaging banner:
  - *"Open Your Shop on shopsilo: Are you a local shopkeeper? Start POS billing, digital Khata & accept counter pickup orders."*
  - 1-tap button navigating to `/merchant/register-shop`.

---

### 6. Counter POS Billing (`app/merchant/pos.tsx`)
- **Interactive Catalog & Search**: Fast product picker (`POSProductPicker.tsx`) to search and add items to the active bill with one tap.
- **Bill Cart Items (`POSCartItem.tsx`)**: Line items with `+` / `-` quantity adjustments and delete buttons.
- **Flexible Payment Modes (`POSPaymentSelector.tsx`)**: `Cash`, `UPI`, `Split`, `Udhar`.
- **WhatsApp Bill Receipt (`POSReceiptModal.tsx`)**: Instant post-sale receipt with 1-tap WhatsApp share.

---

### 7. Customer Udhar Khata (`app/merchant/khata.tsx`)
- **Debt Aging Analysis (`KhataAgingCard.tsx`)**: Breakdown of market credit (0-30, 31-60, 60+ days overdue).
- **Customer Ledger Cards (`KhataCustomerCard.tsx`)**: Outstanding balance in ₹, 1-tap WhatsApp reminder, and Jama payment button.
- **Transaction Modal (`RecordTransactionModal.tsx`)**: Record both "Udhar Diya" (new credit) and "Jama" (payment settlement via Cash or UPI).

---

### 8. Stock & Inventory Management (`app/merchant/inventory.tsx`)
- **Low Stock Threshold Alerts**: Fetches products running below minimum thresholds (`GET /shops/me/inventory/low-stock`).
- **1-Tap Supplier WhatsApp Order**: Pre-composes restock requirement messages with product name, SKU, and current stock.
- **Stock Adjustment Modal (`StockAdjustModal.tsx`)**: Record `Restock` (+), `Damage` (-), or `Audit` corrections via `POST /shops/me/inventory/adjust`.

---

### 9. Daily Expenses (Kharcha) (`app/merchant/expenses.tsx`)
- **Category Overheads**: Tea & Snacks, Shop Rent, Electricity, Staff Salary, Packaging, and Other.
- **Quick Logging (`AddExpenseModal.tsx`)**: Amount, notes, and payment mode (Cash/UPI) via `POST /shops/me/expenses`.
- **Expense Ledger (`ExpenseItemCard.tsx`)**: Chronological expense cards with category icons and formatted amounts.

---

### 10. Asli Munafa & Analytics (`app/merchant/analytics.tsx`)
- **True Pocket Net Profit**:
  $$\text{Asli Munafa} = \text{Revenue (Gross Sales)} - \text{COGS (Cost of Goods)} - \text{Daily Expenses (Overheads)}$$
- **Time Periods**: Filter by Today, This Week, and This Month with Net Profit Margin %.

---

### 11. Counter Pickup Desk (`app/merchant/pickups.tsx`)
- **Quick OTP Input Bar**: Fast 4-digit OTP input for merchants at the counter.
- **OTP Verification Modal (`VerifyPickupModal.tsx`)**: Calls `POST /shops/me/reservations/verify` and displays order handover confirmation.

---

## 🏪 19. Complete Dukandar OS & Shop Creation Suite

### 1. Rich Shop Registration & Media Assets ([`app/merchant/register-shop.tsx`](file:///c:/Go/shopsilo/app/merchant/register-shop.tsx))
- **Shop Logo & Promotional Banners ([`ShopMediaUploadSection.tsx`](file:///c:/Go/shopsilo/src/features/merchant/components/ShopMediaUploadSection.tsx))**:
  - Upload real square shop logo and up to 2 high-res store promotion banners using `expo-image-picker` with Camera and Gallery options.
  - Image preview with 1-tap removal badge (`X`) and visual banner slots (`Banner 1 (Featured)`, `Banner 2`).
- **Comprehensive Go Backend DTO Alignment**:
  - Mapped directly to Go backend `CreateShopRequest` (`internal/handler/dto/shop.go`):
    - `name` (required), `category` (required), `address` (required)
    - `city`, `pincode` (6-digit postal code)
    - `phone`, `whatsapp_number` (direct WhatsApp customer ordering)
    - `timing` (e.g. `9:00 AM - 9:00 PM`), `weekly_off` (e.g. `Sunday` or `None`)
    - `description` (store specialties, nearby landmark)
    - `logo_url`, `banners` (`[]string`, max 2)
- **Modular Component Split**:
  - Split into [`ShopBasicInfoSection.tsx`](file:///c:/Go/shopsilo/src/features/merchant/components/ShopBasicInfoSection.tsx), [`ShopMediaUploadSection.tsx`](file:///c:/Go/shopsilo/src/features/merchant/components/ShopMediaUploadSection.tsx), and [`ShopOperationalDetailsSection.tsx`](file:///c:/Go/shopsilo/src/features/merchant/components/ShopOperationalDetailsSection.tsx) to ensure `register-shop.tsx` stays clean at **135 lines** (< 150 lines).

### 2. Flexible Add Product with Real Go Attributes & Asli Munafa ([`app/merchant/add-product.tsx`](file:///c:/Go/shopsilo/app/merchant/add-product.tsx))
- **Flexible JSONB Attributes ([`ProductAttributesSection.tsx`](file:///c:/Go/shopsilo/src/features/merchant/components/ProductAttributesSection.tsx))**:
  - Implemented dynamic key-value attributes matching Go backend `attributes JSONB` (`map[string]interface{}`).
  - Quick-add attribute chips: `Brand`, `Size / Unit`, `Color`, `Flavor`, `Material`, `Expiry Date`.
  - Comma-separated search tags (`tags: []string`).
- **Real-Time Asli Munafa & Margin Calculator ([`ProductPricingSection.tsx`](file:///c:/Go/shopsilo/src/features/merchant/components/ProductPricingSection.tsx))**:
  - Selling Price (`price`) and Wholesale Cost Price (`cost_price`).
  - Live pocket profit badge: calculates `₹ Unit Profit` and `% Profit Margin` in real time as the merchant types.
  - Maximum Retail Price / Compare Price (`compare_price`): calculates and displays consumer discount percentage (e.g. `20% OFF`).
- **Dynamic Category Selector ([`ProductCategorySelector.tsx`](file:///c:/Go/shopsilo/src/features/merchant/components/ProductCategorySelector.tsx))**:
  - Fetches live categories from `GET /categories` (`useCategories()`) and renders horizontal selectable chips with checkmarks.
- **Stock, Threshold & Weight ([`ProductStockSection.tsx`](file:///c:/Go/shopsilo/src/features/merchant/components/ProductStockSection.tsx))**:
  - Opening stock quantity (`stock_quantity`), minimum stock threshold for alerts (`min_stock`), and package weight in kg (`weight`).
- **1-Tap Auto Barcode / SKU Generator**:
  - Generates unique store SKUs (e.g. `TAT-4829`) from product name with a single tap of the **Auto** magic wand button.

### 3. Interactive Merchant Dashboard ([`app/merchant/dashboard.tsx`](file:///c:/Go/shopsilo/app/merchant/dashboard.tsx))
- **Live Interactive KPI Grid ([`MerchantKPIGrid.tsx`](file:///c:/Go/shopsilo/src/features/merchant/components/MerchantKPIGrid.tsx))**:
  - **Today's Sales**: Tapping navigates directly to Counter POS Billing (`/merchant/pos`).
  - **Market Udhar**: Tapping navigates directly to Customer Khata (`/merchant/khata`).
  - **Counter Pickups**: Tapping navigates directly to Pickup Desk OTP verification (`/merchant/pickups`).
  - **Stock Alerts**: Tapping navigates directly to Low Stock & Inventory (`/merchant/inventory`).
- **Pull-to-Refresh**: Native `RefreshControl` instantly refreshes store status and daily digest from the Go backend.

### 4. Store Profile & Banners Editor ([`app/merchant/settings.tsx`](file:///c:/Go/shopsilo/app/merchant/settings.tsx))
- Real-time pre-filling from `GET /shops/me`.
- Update logo, promotional banners, operating hours, weekly off, pincode, and address via `PUT /shops/me`.

### 5. Shop Inventory & Stock Verification Fix ([`app/merchant/inventory.tsx`](file:///c:/Go/shopsilo/app/merchant/inventory.tsx))
- **Root Cause Identified & Fixed ([`useInventory.ts`](file:///c:/Go/shopsilo/src/features/merchant/api/useInventory.ts))**:
  - Go backend endpoint `GET /shops/me/inventory/low-stock` returns a response object with schema `{ total_low_stock_items: number, items: LowStockProduct[] }` rather than a raw array.
  - Calling `(items ?? []).filter()` directly on this object caused a runtime `TypeError: items.filter is not a function`, crashing the stock check screen.
  - Updated `useLowStockItems` to safely unwrap `data?.items || data || []` guaranteeing an array return.
- **Dual Tab Mode (All Products vs. Low Stock Alerts)**:
  - **All Products Tab**: Displays complete store catalog stock (`stock_quantity`) using `useShopProducts(shop?.slug)`.
  - **Low Stock Alerts Tab**: Specifically isolates urgent items whose stock is `<= min_threshold`.
- **Dynamic Stock Level Badges ([`InventoryItemCard.tsx`](file:///c:/Go/shopsilo/src/features/merchant/components/InventoryItemCard.tsx))**:
  - Green badge for healthy stock (`N in stock`), Red badge for low stock (`N left (Low)`).
  - 1-tap WhatsApp supplier restock message generator.
- **Robust Stock Adjustment ([`StockAdjustModal.tsx`](file:///c:/Go/shopsilo/src/features/merchant/components/StockAdjustModal.tsx))**:
  - Uses `product_id: item.product_id || item.id` preventing missing UUID validation errors.
  - Native `RefreshControl` pull-to-refresh to immediately synchronize changes with Neon PostgreSQL.

### 6. App Launch Unregistered Shop (404) Error Resolution
- **Root Cause**:
  - Whenever a user without a shop registered in the DB opened the app, queries calling `/shops/me`, `/shops/me/digest`, `/shops/me/pos/weekly-scorecard`, and `/shops/me/reservations` responded with HTTP 404: `"you have not registered a shop yet"`.
  - In `errorFormatter.ts`, `console.warn` triggered Expo's development LogBox banner directly on the user's screen.
  - Furthermore, dependent merchant dashboard queries executed concurrently even when `shop` was not registered.
- **Fixes Applied**:
  - Replaced `console.warn` in [`errorFormatter.ts`](file:///c:/Go/shopsilo/src/api/errorFormatter.ts) with `console.log` and suppressed noisy logging on expected `/shops/me` 404s.
  - Added role/auth gating (`enabled: isAuthenticated && isMerchant && enabled`) and graceful 404 catch handlers returning default fallback values (`null` or `[]`) across:
    - [`useMerchantStore.ts`](file:///c:/Go/shopsilo/src/features/merchant/api/useMerchantStore.ts) (`useMyShop`, `useDailyDigest`)
    - [`usePOS.ts`](file:///c:/Go/shopsilo/src/features/merchant/api/usePOS.ts) (`useWeeklyScorecard`, `usePOSDailySummary`)
    - [`useMerchantReservations.ts`](file:///c:/Go/shopsilo/src/features/merchant/api/useMerchantReservations.ts) (`useMerchantReservations`)
    - [`useInventory.ts`](file:///c:/Go/shopsilo/src/features/merchant/api/useInventory.ts) (`useLowStockItems`)
    - [`useKhata.ts`](file:///c:/Go/shopsilo/src/features/merchant/api/useKhata.ts) (`useKhataCustomers`, `useKhataAging`)
    - [`useAnalytics.ts`](file:///c:/Go/shopsilo/src/features/merchant/api/useAnalytics.ts) (`useProfitReport`, `useProductMatrix`)
  - Gated all dependent queries in [`dashboard.tsx`](file:///c:/Go/shopsilo/app/merchant/dashboard.tsx) on `hasShop = !!shop`.
  - Enabled intelligence queries in [`PickCoPilotModal.tsx`](file:///c:/Go/shopsilo/src/features/merchant/components/PickCoPilotModal.tsx) only when the modal is open and the shop exists.

---

## ✅ Code Health & Verification
- **TypeScript**: `npx tsc --noEmit` passes with **0 errors**.
- **File Lengths**: Every single file across `app/merchant`, `src/features/merchant`, and `src/features/profile` is **strictly under 150 lines**.
- **Currency & Localization**:
  - All amounts formatted with Indian Rupee symbol `₹`.
  - All WhatsApp URLs pre-formatted with India country code `+91`.

