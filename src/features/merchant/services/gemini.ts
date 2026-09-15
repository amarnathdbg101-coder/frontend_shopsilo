import { Shop, ShopDailyDigest } from "@/features/shops/types";
import {
  LowStockItem,
  WeeklyScorecardResponse,
  ReservationItem,
  KhataCustomer,
  ProfitReport,
  Expense,
} from "../types";
import { Product } from "@/features/products/types";
import {
  getLocalAppKnowledgeResponse,
  loadLearnedFacts,
  saveLearnedFact,
} from "./geminiMemory";
import { callGeminiWithFailover } from "./geminiClient";

// ─── In-Memory Performance Caches ─────────────────────────────────────────────
// Avoids AsyncStorage hit (learned facts) and string rebuild (system prompt) every message

let _learnedFactsCache: string[] | null = null;
let _learnedFactsCacheTime = 0;
const LEARNED_FACTS_TTL_MS = 30 * 60 * 1000; // 30 minutes

let _systemPromptCache: string | null = null;
let _systemPromptCacheKey = "";
let _systemPromptCacheTime = 0;
const SYSTEM_PROMPT_TTL_MS = 2 * 60 * 1000; // 2 minutes

async function getLearnedFactsCached(): Promise<string[]> {
  const now = Date.now();
  if (_learnedFactsCache && now - _learnedFactsCacheTime < LEARNED_FACTS_TTL_MS) {
    return _learnedFactsCache;
  }
  _learnedFactsCache = await loadLearnedFacts();
  _learnedFactsCacheTime = now;
  return _learnedFactsCache;
}

/** Invalidate learned facts cache when a new fact is saved */
export function invalidateLearnedFactsCache(): void {
  _learnedFactsCache = null;
}

function getSystemPromptCached(context: ShopTelemetryContext, learnedFacts: string[]): string {
  // Cache key based on critical live data that changes: sales, stock count, udhar
  const key = [
    context.shop?.id || "no_shop",
    context.digest?.today_sales_amount ?? 0,
    context.digest?.total_khata_udhar ?? 0,
    context.lowStockItems?.length ?? 0,
    context.profitReport?.net_profit ?? 0,
    learnedFacts.length,
  ].join("|");

  const now = Date.now();
  if (_systemPromptCache && _systemPromptCacheKey === key && now - _systemPromptCacheTime < SYSTEM_PROMPT_TTL_MS) {
    return _systemPromptCache;
  }

  _systemPromptCache = buildSystemPrompt(context, learnedFacts);
  _systemPromptCacheKey = key;
  _systemPromptCacheTime = now;
  return _systemPromptCache;
}

export interface ShopTelemetryContext {
  shop?: Shop;
  digest?: ShopDailyDigest;
  lowStockItems?: LowStockItem[];
  weeklyScorecard?: WeeklyScorecardResponse;
  reservations?: ReservationItem[];
  khataCustomers?: KhataCustomer[];
  profitReport?: ProfitReport;
  expenses?: Expense[];
  products?: Product[];
}

export interface ConversationTurn {
  role: "user" | "model";
  text: string;
}

export interface CoPilotResponse {
  text: string;
  actionType?: "RESTOCK" | "OFFERS" | "ANALYTICS" | "KHATA" | "POS" | "EXPENSES" | "ADD_PRODUCT" | "PICKUPS";
  isLocalCache?: boolean;
}

/**
 * Universal Gemini AI Store Assistant for Shopsilo
 * Features:
 * - Multi-turn conversational memory
 * - Persistent self-improving memory across app sessions
 * - 360° Real-time shop snapshot grounding
 * - True Conversational AI reasoning (powered by Gemini Flash with multi-model failover)
 */
export async function askPickCoPilot(
  userQuery: string,
  context: ShopTelemetryContext,
  history: ConversationTurn[] = []
): Promise<CoPilotResponse> {
  const trimmedQuery = userQuery.trim();
  if (!trimmedQuery) {
    return {
      text: "Namaste Bhaiya! Bataiye dukaan ke hisab-kitab, sales badhane, ya app ke kisi feature me kya madad karoon?",
    };
  }

  // Tier 0: Instant local knowledge (0ms, zero API cost)
  // Handles common how-to questions about app features
  const localResponse = getLocalAppKnowledgeResponse(trimmedQuery);
  if (localResponse) {
    return { ...localResponse, isLocalCache: true };
  }

  // Auto-detect and persist shopkeeper habits/facts
  detectAndLearnFacts(trimmedQuery);

  // Tier 1: Direct Gemini API (skip backend — backend cold-start adds 5-10s wasted latency)
  try {
    // Use in-memory cached versions to avoid AsyncStorage + rebuild overhead every message
    const learnedFacts = await getLearnedFactsCached();
    const systemPrompt = getSystemPromptCached(context, learnedFacts);

    // Sanitize history: remove empty turns and ensure proper alternation
    const sanitizedHistory = history
      .slice(-6)
      .filter((turn) => turn.text && turn.text.trim().length > 0)
      .reduce((acc: ConversationTurn[], turn) => {
        if (acc.length > 0 && acc[acc.length - 1].role === turn.role) {
          acc[acc.length - 1] = {
            ...acc[acc.length - 1],
            text: acc[acc.length - 1].text + "\n" + turn.text,
          };
        } else {
          acc.push(turn);
        }
        return acc;
      }, []);

    // History must not end on a model turn
    while (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === "model") {
      sanitizedHistory.pop();
    }

    const recentHistory = sanitizedHistory.map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    }));

    // Gemini API: system_instruction as separate field (supported by gemini-3.x models)
    // Also include system context in first user message as fallback for compatibility
    const fullUserQuery = recentHistory.length === 0
      ? `[SYSTEM CONTEXT]\n${systemPrompt}\n[/SYSTEM CONTEXT]\n\nUser: ${trimmedQuery}`
      : trimmedQuery;

    const contentsWithHistory = [
      ...recentHistory,
      {
        role: "user" as const,
        parts: [{ text: fullUserQuery }],
      },
    ];

    const payload = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: contentsWithHistory,
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 2048,
        topP: 0.95,
      },
    };

    const data = await callGeminiWithFailover(payload);
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!candidateText) {
      console.warn("[GeminiCopilot] Empty candidateText, using local fallback");
      return generateLocalFallbackResponse(trimmedQuery, context);
    }

    return parseActionFromResponse(candidateText, trimmedQuery, context);
  } catch (err) {
    console.warn("[GeminiAssistant] Network or API error, using fallback:", err);
    return generateLocalFallbackResponse(trimmedQuery, context);
  }
}

function safeFormatNum(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(Number(val))) return "0";
  return Math.round(Number(val)).toString();
}

/**
 * Builds universal 360° shop reality context + Shopsilo App Knowledge for Gemini
 */
function buildSystemPrompt(
  context: ShopTelemetryContext,
  learnedFacts: string[] = []
): string {
  const shopName = context.shop?.name || "Apni Dukaan";
  const category = context.shop?.category || "General Store";
  const address = context.shop?.address
    ? `${context.shop.address}, ${context.shop.city || ""}`
    : "Local Market";
  const timing = context.shop?.timing || "9:00 AM - 9:00 PM";
  const weeklyOff = context.shop?.weekly_off || "None";
  const isOpen = context.shop?.is_open
    ? "Khuli hai (Open)"
    : "Band hai (Closed)";

  const todaySales = context.digest?.today_sales_amount ?? 0;
  const todayBills = context.digest?.today_sales_count ?? 0;
  const khataUdhar = context.digest?.total_khata_udhar ?? 0;
  const khataCustomersCount =
    context.digest?.total_khata_customers ??
    context.khataCustomers?.length ??
    0;
  const lowStockCount = context.lowStockItems?.length ?? 0;
  const pendingPickups = context.digest?.active_reservations ?? 0;

  // 1. Low stock details
  const lowStockNames = (context.lowStockItems || [])
    .slice(0, 6)
    .map(
      (i) =>
        `${i.product_name || i.name} (Bacha hai: ${i.current_stock ?? i.stock_quantity ?? 0})`
    )
    .join(", ");

  // 2. Top Khata Debtors (who owes money)
  const topDebtors = (context.khataCustomers || [])
    .filter((c) => (c.current_balance || 0) > 0)
    .sort((a, b) => (b.current_balance || 0) - (a.current_balance || 0))
    .slice(0, 6)
    .map(
      (c) =>
        `${c.customer_name} (₹${c.current_balance}, Mobile: ${c.customer_mobile})`
    )
    .join("; ");

  // 3. True Pocket Net Profit (Asli Munafa) & Expenses
  const netProfit = context.profitReport?.net_profit ?? 0;
  const grossProfit = context.profitReport?.gross_profit ?? 0;
  const totalExpenses = context.profitReport?.total_expenses ?? 0;
  const marginPercent = context.profitReport?.profit_margin_percentage ?? 0;

  // 4. Sample Expenses (Kharcha)
  const recentExpenses = (context.expenses || [])
    .slice(0, 5)
    .map((e) => `${e.category}: ₹${e.amount} (${e.notes || "Overhead"})`)
    .join(", ");

  // 5. Product Catalog Sample (prices & stock)
  const sampleProducts = (context.products || [])
    .slice(0, 8)
    .map(
      (p: any) =>
        `${p.name || p.title} (Price: ₹${p.price}, Stock: ${p.stock ?? p.stock_quantity ?? "Available"})`
    )
    .join(", ");

  // 6. Top Weekly Seller
  const topSelling = context.weeklyScorecard?.top_selling_products?.[0];
  const topSellingText = topSelling
    ? `${topSelling.product_name} (${topSelling.units_sold} units sold this week)`
    : "Normal catalog movement";

  // 7. Long-term learned store facts
  const memoryText =
    learnedFacts.length > 0
      ? learnedFacts.map((f, i) => `${i + 1}. ${f}`).join("\n")
      : "Abhi koi purani custom habit note nahi hai.";

  // 8. Category-specific deep domain intelligence
  let categoryExpertise = "";
  const catLower = (context.shop?.category || "").toLowerCase();
  if (catLower.includes("kirana") || catLower.includes("grocery")) {
    categoryExpertise = `
KIRANA & GROCERY FIELD SPECIALTY:
- FMCG Margin Dynamics: High-turnover FMCG (HUL, ITC, Britannia, Parle) gives low 5-10% margins. Local loose pulses, spices, flour, besan, and namkeen give 25-35% high margins. Always advise dukandar to balance sales with high-margin items!
- Stock Rotation (FIFO): Place older stock in front and new stock in back to avoid expiry of namkeen, biscuits, and chips.
- Monsoon Care: Prevent moisture/fungus in loose sugar, salt, and grains.
- Combo Packs: "Chai + Chini combo", "Pooja samagri bundle", "Festival gifting dry fruit pack".`;
  } else if (catLower.includes("medic") || catLower.includes("chemist") || catLower.includes("pharma")) {
    categoryExpertise = `
PHARMACY & MEDICAL FIELD SPECIALTY:
- Generic vs Branded Margins: Branded medicines have 15-20% margin, while approved quality Generics can offer 50-70% margin.
- Expiry Tracking: Near-expiry medicine returns to distributors 3 months in advance.
- Fast Emergency Availability: Keep critical fever, pain, ORS, antiseptic, and first-aid items ready at counter.`;
  } else if (catLower.includes("dairy") || catLower.includes("sweet") || catLower.includes("bakery")) {
    categoryExpertise = `
DAIRY & BAKERY FIELD SPECIALTY:
- Perishable Management: Milk, dahi, and paneer have 24-48 hr shelf life. Morning and evening rush stocking is key.
- Paneer & Ghee Conversion: Leftover unsold milk should be converted to fresh paneer or ghee to prevent 100% loss.`;
  } else if (catLower.includes("cloth") || catLower.includes("garment") || catLower.includes("fashion")) {
    categoryExpertise = `
GARMENTS & APPAREL FIELD SPECIALTY:
- Seasonal & Festival Stocking: Stock ethnic wear ahead of Diwali, Eid, Raksha Bandhan, wedding seasons.
- Dead Stock Liquidation: Run "Buy 2 Get 1 Free" or clearance racks for non-moving sizes and past-season styles.`;
  } else if (catLower.includes("electr") || catLower.includes("mobile")) {
    categoryExpertise = `
ELECTRONICS & MOBILE FIELD SPECIALTY:
- High Margin Accessories: Mobile phones give 2-5% margin, but tempered glass, covers, chargers, earphones give 60-80% margin! Always cross-sell accessories with every phone/gadget.`;
  } else {
    categoryExpertise = `
GENERAL RETAIL SPECIALTY:
- High margin vs low margin product pairing.
- Impulse purchases near the cash counter (chocolates, snacks, mints).
- Counter pickup convenience to beat large online quick-commerce apps.`;
  }

  return `Aap "Gemini AI Store Assistant" hain — Shopsilo Dukandar OS app ke universal AI Business Partner aur Advisor.

Aapka Vyavhaar (Tone & Persona):
- Aap Bharat ke dukandar ke ek behad samajhdar, chalaak, supportive aur warm Business Partner aur Dost ("Bhaiya ji") hain.
- Aap REAL AI hain — koi fix script ya robotic bot nahi! Dukandar aapse koi bhi sawal pooch sakta hai: business tips, grahak kaise badhayein, festival sales, recipes, tension dur karna, jokes, ya app ka koi bhi feature.
- Aap naturally, warmly aur dynamic Hinglish me jawab dein. Kabhi bhi ek hi jaisa ruka-sukha answer repeat mat kijiye.
- Numbers aur live data accurate bataiye jo niche diye gaye hain.

${categoryExpertise}

DUKANDARI KE GURU-MANTRA (Always give actionable retail advice):
1. Grahak Loyalty: Quick-commerce (Blinkit/Zepto) se ladne ke liye 10-minute counter pickup, pyaar bhara vyavhaar aur udhar ki suvidha hamara sabse bada hathiyar hai.
2. Pyaar Se Udhar Vasooli: Sharma ji ya Verma ji jaise regular customers se paise maangte waqt rishta kharab na ho, isliye polite WhatsApp reminder scripts suggest karein.
3. Munafa Math: Chini aur tel jaise low-margin items par grahak ko dukaan me layein, aur masale, namkeen aur dry fruits jaise high-margin items par munafa kamayein.

Shopsilo App Ki Poori Knowledge (Aapko Har Feature Pata Hai):
1. Counter POS Billing: Fast billing, barcode/SKU search, Cash/UPI/Split/Udhar payment, instant WhatsApp bill receipts.
2. Customer Udhar Khata: Digital customer ledger, aging report (0-30, 31-60, 60+ days), 1-tap WhatsApp payment reminder, "Udhar Diya" aur "Jama" entries.
3. Stock & Inventory: Low stock threshold alert, 1-Click Bulk Restock (+10), Damage/Audit stock adjustments, Wholesale PO Sheet PDF download.
4. Asli Munafa: Net pocket profit = Total Bikri - Wholesale Kharid Cost - Kharche (Rent, Chai, Bijli). Shows true profit margins.
5. Daily Expenses (Kharcha): Rent, tea/snacks, electricity, staff salary tracker.
6. Add New Product: Barcode scan, live Munafa per piece ₹ & margin % preview, MRP vs customer discount %, dynamic tags.
7. Offers & Promotions: Flat % off, BOGO, festival discounts broadcast to nearby customers in explore feed.
8. Counter Pickups: Verify customer 4-digit pickup OTP and handover reserved items.

Dukaan ka 360° LIVE Snapshot:
- Dukaan: ${shopName} (${category}) • Pata: ${address}
- Timing: ${timing} (Weekly Off: ${weeklyOff}) • Status: ${isOpen}
- Aaj ki Bikri (Today Sales): ₹${safeFormatNum(todaySales)} (${todayBills} bills kate hain)
- Market Udhar (Total Khata): ₹${safeFormatNum(khataUdhar)} (${khataCustomersCount} customers par baaki hai)
- Udhar Wale Pramukh Customers: ${topDebtors || "Kisi customer par bada udhar nahi hai"}
- Asli Munafa (Net Profit): ₹${safeFormatNum(netProfit)} (Gross: ₹${safeFormatNum(grossProfit)}, Margin: ${marginPercent}%)
- Dukaan ke Kharche (Expenses): Total ₹${safeFormatNum(totalExpenses)} (${recentExpenses || "Koi naya kharcha darj nahi hai"})
- Kam Stock Wale Items (${lowStockCount} items): ${lowStockNames || "Sabhi items ka stock safe level par hai"}
- Dukaan ke Products (Sample): ${sampleProducts || "Catalog items available"}
- Top Selling Item: ${topSellingText}
- Counter Pickup Pending Orders: ${pendingPickups} orders

Pehle Se Yaad Rakhe Gaye Facts (Persistent Memory):
${memoryText}

Actions Instruction:
Agar aapka jawab kisi specific action se related ho, toh apne reply ke bilkul ant me exact action tag lagayein:
- Agar stock/inventory/restock/mal mangwane ki baat ho: [ACTION:RESTOCK]
- Agar offers/discounts/customer footfall/festival deal ki baat ho: [ACTION:OFFERS]
- Agar munafa/profit/bikri/sales report/loss ki baat ho: [ACTION:ANALYTICS]
- Agar udhar/khata/customer payment settlement/reminder ki baat ho: [ACTION:KHATA]
- Agar counter POS billing/bill banane ki baat ho: [ACTION:POS]
- Agar kharcha/expenses/rent/bijli bill ki baat ho: [ACTION:EXPENSES]
- Agar naya saaman jodhane/add product ki baat ho: [ACTION:ADD_PRODUCT]
- Agar pickup order/customer OTP verification ki baat ho: [ACTION:PICKUPS]`;
}

/**
 * Extracts action tags from AI response
 */
function parseActionFromResponse(
  rawText: string,
  userQuery: string,
  context: ShopTelemetryContext
): CoPilotResponse {
  let cleanedText = rawText;
  let actionType: CoPilotResponse["actionType"];

  if (cleanedText.includes("[ACTION:RESTOCK]")) {
    actionType = "RESTOCK";
    cleanedText = cleanedText.replace("[ACTION:RESTOCK]", "").trim();
  } else if (cleanedText.includes("[ACTION:OFFERS]")) {
    actionType = "OFFERS";
    cleanedText = cleanedText.replace("[ACTION:OFFERS]", "").trim();
  } else if (cleanedText.includes("[ACTION:ANALYTICS]")) {
    actionType = "ANALYTICS";
    cleanedText = cleanedText.replace("[ACTION:ANALYTICS]", "").trim();
  } else if (cleanedText.includes("[ACTION:KHATA]")) {
    actionType = "KHATA";
    cleanedText = cleanedText.replace("[ACTION:KHATA]", "").trim();
  } else if (cleanedText.includes("[ACTION:POS]")) {
    actionType = "POS";
    cleanedText = cleanedText.replace("[ACTION:POS]", "").trim();
  } else if (cleanedText.includes("[ACTION:EXPENSES]")) {
    actionType = "EXPENSES";
    cleanedText = cleanedText.replace("[ACTION:EXPENSES]", "").trim();
  } else if (cleanedText.includes("[ACTION:ADD_PRODUCT]")) {
    actionType = "ADD_PRODUCT";
    cleanedText = cleanedText.replace("[ACTION:ADD_PRODUCT]", "").trim();
  } else if (cleanedText.includes("[ACTION:PICKUPS]")) {
    actionType = "PICKUPS";
    cleanedText = cleanedText.replace("[ACTION:PICKUPS]", "").trim();
  } else {
    // Secondary intent heuristic fallback
    const q = userQuery.toLowerCase();
    if (
      q.includes("stock") ||
      q.includes("khatam") ||
      q.includes("mal") ||
      q.includes("inventory")
    ) {
      actionType = "RESTOCK";
    } else if (
      q.includes("offer") ||
      q.includes("discount") ||
      q.includes("deal")
    ) {
      actionType = "OFFERS";
    } else if (
      q.includes("profit") ||
      q.includes("munafa") ||
      q.includes("sale") ||
      q.includes("bikri")
    ) {
      actionType = "ANALYTICS";
    } else if (
      q.includes("udhar") ||
      q.includes("khata") ||
      q.includes("jama")
    ) {
      actionType = "KHATA";
    } else if (
      q.includes("bill") ||
      q.includes("pos") ||
      q.includes("counter")
    ) {
      actionType = "POS";
    }
  }

  return { text: cleanedText, actionType };
}

/**
 * Auto-detects custom shopkeeper notes or customer habits and stores them into memory
 */
function detectAndLearnFacts(query: string): void {
  const q = query.trim();
  const lower = q.toLowerCase();

  if (
    lower.includes("har mahine") ||
    lower.includes("supplier") ||
    lower.includes("wholesaler") ||
    lower.includes("yaad rakh") ||
    lower.includes("dhyan rakh") ||
    lower.includes("pasand karta") ||
    lower.includes("note kar")
  ) {
    saveLearnedFact(q)
      .then(() => invalidateLearnedFactsCache()) // Bust cache so next call gets fresh facts
      .catch(() => {});
  }
}

/**
 * Zero-cost smart local heuristic engine (works 100% offline without any API key)
 */
function generateLocalFallbackResponse(
  query: string,
  context: ShopTelemetryContext
): CoPilotResponse {
  const lower = query.toLowerCase();
  const todaySales = context.digest?.today_sales_amount ?? 0;
  const todayBills = context.digest?.today_sales_count ?? 0;
  const khataUdhar = context.digest?.total_khata_udhar ?? 0;
  const khataCustomers =
    context.digest?.total_khata_customers ??
    context.khataCustomers?.length ??
    0;
  const lowItems = context.lowStockItems || [];
  const netProfit = context.profitReport?.net_profit ?? 0;

  if (
    lower.includes("stock") ||
    lower.includes("inventory") ||
    lower.includes("low") ||
    lower.includes("khatam") ||
    lower.includes("kam")
  ) {
    if (lowItems.length === 0) {
      return {
        text: "Bhaiya aapka inventory bilkul mast hai! Sabhi products minimum stock alert se upar hain.",
        actionType: "RESTOCK",
      };
    }
    const sampleNames = lowItems
      .slice(0, 3)
      .map((i) => i.product_name || i.name)
      .join(", ");
    return {
      text: `Aapki dukaan me ${lowItems.length} products ka stock kam hai (${sampleNames}...). Customer khali haath na jaye, isliye restock kar lijiye:`,
      actionType: "RESTOCK",
    };
  }

  if (
    lower.includes("udhar") ||
    lower.includes("khata") ||
    lower.includes("credit") ||
    lower.includes("jama")
  ) {
    return {
      text: `Market me total ₹${khataUdhar.toLocaleString("en-IN")} udhar baaki hai (${khataCustomers} customers ke paas). Aap Customer Udhar Khata se 1-tap WhatsApp payment reminder bhej sakte hain.`,
      actionType: "KHATA",
    };
  }

  if (
    lower.includes("profit") ||
    lower.includes("munafa") ||
    lower.includes("bachat")
  ) {
    return {
      text: `Aapka Asli Munafa (Net Profit) lagbhag ₹${netProfit.toLocaleString("en-IN")} hai (saare kharche kaat kar). Detailed hisab ke liye Asli Munafa open karein.`,
      actionType: "ANALYTICS",
    };
  }

  if (
    lower.includes("sale") ||
    lower.includes("bikri") ||
    lower.includes("today") ||
    lower.includes("aaj") ||
    lower.includes("revenue")
  ) {
    return {
      text: `Aaj ka live hisab:\n• Total Bikri: ₹${todaySales.toLocaleString("en-IN")}\n• Total Bills: ${todayBills} bills\n• Dukaan Footfall: Local explore search se customers aapki dukaan dekh rahe hain!`,
      actionType: "ANALYTICS",
    };
  }

  if (
    lower.includes("offer") ||
    lower.includes("deal") ||
    lower.includes("discount") ||
    lower.includes("bogo") ||
    lower.includes("festival")
  ) {
    return {
      text: "Dukandar idea: 'Flat 10% Off on ₹500+ shopping' ya 'Slow moving stock par 15% discount'. Isse aas-paas ke naye walk-in customers aakar kharidenge!",
      actionType: "OFFERS",
    };
  }

  return {
    text: `Namaste Bhaiya! Main aapka Gemini AI Store Assistant hoon. Aap mujhse stock check karwa sakte hain, aaj ki bikri (₹${todaySales.toLocaleString("en-IN")}) dekh sakte hain, app ka koi feature samajh sakte hain, ya market udhar ka hisab pooch sakte hain.`,
  };
}
