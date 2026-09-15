import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CustomerAction {
  type: "SHOP" | "PRODUCT" | "DEALS" | "SCANNER" | "LOCATION";
  label: string;
  payload?: string; // slug for shop, id for product, etc.
}

export interface StoredCustomerMessage {
  id: string;
  sender: "gemini" | "user";
  text: string;
  actions?: CustomerAction[];
  timestamp?: number;
}

const STORAGE_KEYS = {
  CHAT_HISTORY: "shopsilo_customer_gemini_chat_history",
  LEARNED_PREFERENCES: "shopsilo_customer_gemini_learned_facts",
} as const;

/**
 * Loads persisted customer chat history from device storage
 */
export async function loadCustomerChatHistory(): Promise<StoredCustomerMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("[CustomerGeminiMemory] Failed to load chat history:", err);
    return [];
  }
}

/**
 * Persists the latest customer conversation history (keeps last 30 messages)
 */
export async function saveCustomerChatHistory(messages: StoredCustomerMessage[]): Promise<void> {
  try {
    const trimmed = messages.slice(-30);
    await AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn("[CustomerGeminiMemory] Failed to save chat history:", err);
  }
}

/**
 * Loads learned preferences, favourite items, or home locality notes
 */
export async function loadCustomerPreferences(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LEARNED_PREFERENCES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("[CustomerGeminiMemory] Failed to load preferences:", err);
    return [];
  }
}

/**
 * Records a new learned customer preference (e.g. "prefers organic milk", "lives in Sector 4")
 */
export async function saveCustomerPreference(preference: string): Promise<void> {
  try {
    if (!preference.trim()) return;
    const existing = await loadCustomerPreferences();
    if (!existing.includes(preference.trim())) {
      const updated = [...existing.slice(-20), preference.trim()];
      await AsyncStorage.setItem(STORAGE_KEYS.LEARNED_PREFERENCES, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn("[CustomerGeminiMemory] Failed to save preference:", err);
  }
}

/**
 * Clears customer chat history and learned preferences
 */
export async function clearCustomerMemory(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.CHAT_HISTORY,
      STORAGE_KEYS.LEARNED_PREFERENCES,
    ]);
  } catch (err) {
    console.warn("[CustomerGeminiMemory] Failed to clear memory:", err);
  }
}

/**
 * Zero-Server Offline Knowledge Cache:
 * Provides instant 0ms offline guidance for every buyer/customer feature on Shopsilo.
 * Completely eliminates Gemini API consumption for basic app navigation and guides.
 */
export function getCustomerOfflineKnowledgeResponse(
  query: string
): { text: string; actions?: CustomerAction[] } | null {
  const q = query.toLowerCase().trim();

  // 1. How Pickup Order Works
  if (
    q.includes("pickup order") ||
    q.includes("pickup kya") ||
    q.includes("pickup kaise") ||
    q.includes("store pickup")
  ) {
    return {
      text: "🛍️ **Shopsilo Store Pickup Kaise Kaam Karta Hai?**\n\n1. App me apni pasandida paas ki dukaan chuniye aur items cart me add kijiye.\n2. Checkout par **Store Pickup** select karke order place karein.\n3. Dukandar aapka saaman pack karke ready rakhega.\n4. Aapko app par ek **4-digit Pickup OTP** milega.\n5. Dukaan par jakar bina line me lage counter se apna bag collect kijiye aur OTP dikhaiye!",
      actions: [
        { type: "DEALS", label: "🔥 View Today's Deals" },
      ],
    };
  }

  // 2. Pickup OTP Details
  if (
    q.includes("otp") ||
    q.includes("pickup code") ||
    q.includes("otp kahan") ||
    q.includes("code dikhana")
  ) {
    return {
      text: "🔢 **Pickup OTP Kya Hai?**\n\n- Jab aap koi order place karte hain, to **Orders Tab** me aapke order ke niche ek 4-digit secret OTP dikhai deta hai.\n- Jab aap dukaan par saaman lene jaate hain, to dukandar ko ye OTP batayein.\n- Dukandar apne app me OTP verify karke aapko saaman hand-over kar dega.",
    };
  }

  // 3. How to Order / Saaman kaise mangayein
  if (
    q.includes("order kaise") ||
    q.includes("kaise kharide") ||
    q.includes("saaman kaise") ||
    q.includes("buy kaise")
  ) {
    return {
      text: "🛒 **Shopsilo Par Kharidari (Shopping) Kaise Karein?**\n\n1. **Dukan Ya Saaman Khojein**: Home screen par search bar me kisi bhi item ya dukan ka naam type karein.\n2. **Product Page**: Saaman par click karein aur uski price, expiry, aur details dekhein.\n3. **Reserve / Add to Cart**: 'Reserve for Pickup' dabakar quantity chuniye.\n4. **Counter Pickup**: Dukaan se bina intezar kiye saaman collect karein!",
      actions: [
        { type: "DEALS", label: "🔥 Deals & Offers" },
      ],
    };
  }

  // 4. Barcode Scanner Guide
  if (
    q.includes("scanner") ||
    q.includes("barcode") ||
    q.includes("scan kaise") ||
    q.includes("camera")
  ) {
    return {
      text: "📷 **Shopsilo Barcode Scanner:**\n\nJab aap physical dukaan ke andar hote hain, to kisi bhi product ke packet par bana Barcode scan kar sakte hain:\n- Isse turant product ka actual rate, discount aur details dikh jati hain.\n- Header me bane 📷 Camera icon par click karein aur barcode samne layein!",
      actions: [
        { type: "SCANNER", label: "📷 Open Barcode Scanner" },
      ],
    };
  }

  // 5. Change Location / Area
  if (
    q.includes("location") ||
    q.includes("area kaise") ||
    q.includes("shehar") ||
    q.includes("pincode") ||
    q.includes("jagah kaise")
  ) {
    return {
      text: "📍 **Location Kaise Badlein?**\n\n- Home screen ke sabse upar bane Location Chip (jaise 'HSR Layout' ya 'Current Location') par tap karein.\n- Apna naya locality, colony ya city search karke select karein.\n- App turant aapke naye area ki dukan aur products dikhane lagega!",
      actions: [
        { type: "LOCATION", label: "📍 Change Location" },
      ],
    };
  }

  // 6. Contact Shopkeeper / WhatsApp
  if (
    q.includes("whatsapp") ||
    q.includes("dukandar se baat") ||
    q.includes("call kaise") ||
    q.includes("contact shop") ||
    q.includes("phone number")
  ) {
    return {
      text: "📞 **Dukandar Se Sampark (Contact) Kaise Karein?**\n\n- Kisi bhi shop ke page par jayein.\n- Wahan aapko **WhatsApp Chat** aur **Direct Call** ke green buttons milenge.\n- Aap direct dukandar se stock ya kisi khas item ke bare me baat kar sakte hain!",
    };
  }

  // 7. Bargaining & Discounts
  if (
    q.includes("bargain") ||
    q.includes("mol bhaav") ||
    q.includes("discount kaise") ||
    q.includes("rate kam")
  ) {
    return {
      text: "💰 **Mol-Bhaav (Bargain) Aur Discounts:**\n\n- Kuch select products par 'Make an Offer' (Bargain) button hota hai.\n- Agar aap zyada quantity le rahe hain to aap apna offer price de sakte hain.\n- Dukandar accept kar lega to aapko usi discount rate par saaman mil jayega!",
      actions: [
        { type: "DEALS", label: "🔥 Top Discounts Dekhein" },
      ],
    };
  }

  return null;
}
