import AsyncStorage from "@react-native-async-storage/async-storage";

export interface StoredMessage {
  id: string;
  sender: "pick" | "user";
  text: string;
  actionType?: "RESTOCK" | "OFFERS" | "ANALYTICS" | "KHATA" | "POS" | "EXPENSES" | "ADD_PRODUCT" | "PICKUPS";
  timestamp?: number;
}

const STORAGE_KEYS = {
  CHAT_HISTORY: "shopsilo_gemini_chat_history",
  LEARNED_FACTS: "shopsilo_gemini_learned_facts",
} as const;

/**
 * Loads persisted conversation history from device storage
 */
export async function loadChatHistory(): Promise<StoredMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("[GeminiMemory] Failed to load chat history:", err);
    return [];
  }
}

/**
 * Persists the latest conversation history to storage (keeps last 30 messages)
 */
export async function saveChatHistory(messages: StoredMessage[]): Promise<void> {
  try {
    const trimmed = messages.slice(-30);
    await AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn("[GeminiMemory] Failed to save chat history:", err);
  }
}

/**
 * Loads learned facts, customer habits, and shopkeeper notes
 */
export async function loadLearnedFacts(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LEARNED_FACTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("[GeminiMemory] Failed to load learned facts:", err);
    return [];
  }
}

/**
 * Records a new learned fact or habit into long-term memory
 */
export async function saveLearnedFact(fact: string): Promise<void> {
  try {
    if (!fact.trim()) return;
    const existing = await loadLearnedFacts();
    if (!existing.includes(fact.trim())) {
      const updated = [...existing.slice(-20), fact.trim()];
      await AsyncStorage.setItem(STORAGE_KEYS.LEARNED_FACTS, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn("[GeminiMemory] Failed to save learned fact:", err);
  }
}

/**
 * Clears stored chat history and learned facts
 */
export async function clearAllMemory(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.CHAT_HISTORY,
      STORAGE_KEYS.LEARNED_FACTS,
    ]);
  } catch (err) {
    console.warn("[GeminiMemory] Failed to clear memory:", err);
  }
}

/**
 * Auto-detects key customer habits or shopkeeper notes from query and saves them
 */
export function detectAndLearnFacts(query: string): void {
  if (!query) return;
  const q = query.toLowerCase();
  if (q.includes("sharma ji") || q.includes("verma ji") || q.includes("gupta ji")) {
    saveLearnedFact(`Important regular customer mentioned: "${query.slice(0, 60)}"`);
  } else if (q.includes("weekly off") || q.includes("dukaan band")) {
    saveLearnedFact(`Shop timing/off note: "${query.slice(0, 60)}"`);
  }
}

/**
 * Zero-Server Offline Knowledge Cache:
 * Provides immediate, offline step-by-step guidance for every single feature in Shopsilo.
 * Saves Gemini API requests and responds in under 1 millisecond.
 */
export function getLocalAppKnowledgeResponse(
  query: string
): { text: string; actionType?: "RESTOCK" | "OFFERS" | "ANALYTICS" | "KHATA" } | null {
  const q = query.toLowerCase().trim();

  // 1. POS Billing Guide
  if (
    q.includes("bill kaise") ||
    q.includes("pos kaise") ||
    q.includes("billing kaise") ||
    q.includes("counter billing") ||
    q.includes("bill banana")
  ) {
    return {
      text: `🛒 Counter POS Billing Ka Simple Tarika:\n1. Niche "Counter POS" tool open karein.\n2. Product search karein ya tap karke bill cart me add karein.\n3. Quantity (+ / -) set karein.\n4. Payment mode chunein: Cash, UPI, Split, ya Udhar.\n5. "Complete Sale" dabate hi customer ko WhatsApp bill receipt bhejne ka option mil jayega!`,
      actionType: "ANALYTICS",
    };
  }

  // 2. Customer Udhar Khata Guide
  if (
    q.includes("udhar kaise") ||
    q.includes("khata kaise") ||
    q.includes("udhar likhna") ||
    q.includes("jama kaise") ||
    q.includes("khata kya hai")
  ) {
    return {
      text: `📒 Customer Udhar Khata Ka Tarika:\n1. "Customer Udhar Khata" tool open karein.\n2. Naya credit dene ke liye "Udhar Diya" dabayein (Customer mobile number & amount dalein).\n3. Jab customer payment de, toh "Jama" dabakar Cash/UPI settlement record karein.\n4. Agar koi customer paise nahi de raha, toh card par bane WhatsApp icon se 1-tap me payment reminder bhejein!`,
      actionType: "KHATA",
    };
  }

  // 3. Stock & Inventory Guide
  if (
    q.includes("stock kaise") ||
    q.includes("inventory kaise") ||
    q.includes("mal kaise") ||
    q.includes("restock kaise") ||
    q.includes("stock check")
  ) {
    return {
      text: `📦 Stock & Inventory Management:\n1. "Stock & Inventory" tool me aapko wo saare items dikhenge jo minimum alert level se kam hain.\n2. Yahan se aap "1-Click Bulk Restock" kar sakte hain.\n3. Damaged ya audit correction ke liye "Adjust Stock" use karein.\n4. Wholesale supplier ko order bhejne ke liye "Wholesale PO Sheet (PDF)" download kar sakte hain!`,
      actionType: "RESTOCK",
    };
  }

  // 4. Asli Munafa & Net Profit Guide
  if (
    q.includes("munafa kaise") ||
    q.includes("asli munafa kya") ||
    q.includes("profit kaise") ||
    q.includes("pocket profit") ||
    q.includes("munafa kya hai")
  ) {
    return {
      text: `💰 Asli Munafa (Net Profit) Formula:\nAsli Munafa = Total Bikri - Wholesale Kharid Lagat (Cost) - Dukaan Ke Kharche (Rent, Chai, Bijli).\nShopsilo aapko raw sales ke bajaye ye batata hai ki din ya mahine ke ant me aapki jeb me sach me kitna net profit bacha! "Asli Munafa" tool me jaakar apna live profit margin check karein.`,
      actionType: "ANALYTICS",
    };
  }

  // 5. Daily Expenses (Kharcha) Guide
  if (
    q.includes("kharcha kaise") ||
    q.includes("expenses kaise") ||
    q.includes("rent kaise") ||
    q.includes("bijli bill")
  ) {
    return {
      text: `☕ Daily Expenses (Kharcha) Entry:\n1. "Daily Expenses" tool open karein.\n2. Category chunein: Shop Rent, Chai-Nashta, Bijli Bill, Staff Salary, ya Other Packaging.\n3. Amount aur payment mode (Cash/UPI) daalkar "Save Expense" karein.\nYe kharche aapke Asli Munafa calculation me automatically deduct ho jate hain!`,
    };
  }

  // 6. Add New Product Guide
  if (
    q.includes("product kaise") ||
    q.includes("item kaise add") ||
    q.includes("naya saaman") ||
    q.includes("saaman kaise jodhe")
  ) {
    return {
      text: `🏷️ Naya Product Add Karne Ka Tarika:\n1. "Add New Product" card par tap karein.\n2. Product ka naam aur category chunein.\n3. Selling Price aur Wholesale Cost Price dalein — app aapko live "Munafa per piece ₹" aur margin % dikhayega.\n4. MRP aur customer discount % set karein.\n5. Stock quantity aur alert limit set karke "Publish to Catalog" karein!`,
    };
  }

  // 7. Offers & Promotions Guide
  if (
    q.includes("offer kaise") ||
    q.includes("deal kaise") ||
    q.includes("discount kaise") ||
    q.includes("walk in customer")
  ) {
    return {
      text: `🔥 Offers & Live Promotions:\n1. "Offers & Live Promotions" tool me jayein.\n2. Discount type chunein: Flat % Discount, Buy 1 Get 1 (BOGO), ya Festival Deal.\n3. Minimum shopping amount aur validity dalein.\nYe offer aapke area ke nearby sabhi customers ke Shopsilo Explore feed me live dikhega jisse counter walk-in badhenge!`,
      actionType: "OFFERS",
    };
  }

  // 8. Counter Pickup Desk Guide
  if (
    q.includes("pickup kaise") ||
    q.includes("otp kaise") ||
    q.includes("counter pickup") ||
    q.includes("order kaise de")
  ) {
    return {
      text: `🛍️ Counter Pickup Order Fulfillment:\n1. Jab koi customer aapki dukaan se online saaman book karega, toh use 4-digit ka Pickup OTP milega.\n2. Customer counter par aakar OTP batayega.\n3. "Counter Pickup Desk" tool me jakar wo OTP verify karein aur saaman handover kar dein!`,
    };
  }

  // 9. All Features / App Overview
  if (
    q.includes("kya kya features") ||
    q.includes("app me kya hai") ||
    q.includes("all features") ||
    q.includes("poora feature") ||
    q.includes("help") ||
    q.includes("features batao")
  ) {
    return {
      text: `✨ Shopsilo Dukandar OS Ke 8 Bade Features:\n1. 🧾 Fast Counter POS (Cash/UPI/WhatsApp Bill)\n2. 📒 Customer Digital Udhar Khata & WhatsApp Reminder\n3. 📦 Stock & Inventory (1-Click Restock & PO Sheet)\n4. 💰 Asli Munafa (True Net Profit Calculation)\n5. ☕ Daily Expenses / Kharcha Tracker\n6. 🏷️ Add New Product (Live Margin & Discount Tool)\n7. 🔥 Offers & Nearby Customer Promotions\n8. 🛍️ Counter Pickups & OTP Verification\n\nAap inme se kisi bhi feature ke baare me mujhse pooch sakte hain!`,
    };
  }

  return null;
}
