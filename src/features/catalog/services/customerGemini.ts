import { Shop } from "@/features/shops/types";
import { Product, Category } from "../types";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import {
  CustomerAction,
  StoredCustomerMessage,
  loadCustomerPreferences,
  saveCustomerPreference,
} from "./customerGeminiMemory";

export interface CustomerAIContext {
  currentLocation?: {
    city?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  nearbyShops?: Shop[];
  catalogProducts?: Product[];
  categories?: Category[];
}

export interface CustomerAIResponse {
  text: string;
  actions: CustomerAction[];
}

const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const FALLBACK_API_KEY = "AQ.Ab8RN6J1hv1iC1XjUBgKpt-OijUlutFi7VkMQTOlYBHghGCIOA";

/**
 * Extracts [ACTION:...] and [REMEMBER:...] tags from Gemini's response
 */
function parseResponseTags(rawText: string): {
  cleanText: string;
  actions: CustomerAction[];
  rememberFacts: string[];
} {
  const actions: CustomerAction[] = [];
  const rememberFacts: string[] = [];

  // 1. Extract [REMEMBER: fact]
  let cleaned = rawText.replace(/\[REMEMBER:\s*([^\]]+)\]/gi, (_, fact) => {
    if (fact && fact.trim()) {
      rememberFacts.push(fact.trim());
    }
    return "";
  });

  // 2. Extract [ACTION:SHOP:slug:Name]
  cleaned = cleaned.replace(/\[ACTION:SHOP:([^:]+):?([^\]]*)\]/gi, (_, slug, name) => {
    const trimmedSlug = slug.trim();
    const label = name ? `🏪 Visit ${name.trim()}` : "🏪 Visit Shop";
    if (!actions.some((a) => a.type === "SHOP" && a.payload === trimmedSlug)) {
      actions.push({ type: "SHOP", label, payload: trimmedSlug });
    }
    return "";
  });

  // 3. Extract [ACTION:PRODUCT:id:Name:Price]
  cleaned = cleaned.replace(/\[ACTION:PRODUCT:([^:]+):?([^:]*):?([^\]]*)\]/gi, (_, id, name, price) => {
    const trimmedId = id.trim();
    const label = name ? `🛒 View ${name.trim()}${price ? ` (₹${price.trim()})` : ""}` : "🛒 View Item";
    if (!actions.some((a) => a.type === "PRODUCT" && a.payload === trimmedId)) {
      actions.push({ type: "PRODUCT", label, payload: trimmedId });
    }
    return "";
  });

  // 4. Extract [ACTION:DEALS]
  cleaned = cleaned.replace(/\[ACTION:DEALS\]/gi, () => {
    if (!actions.some((a) => a.type === "DEALS")) {
      actions.push({ type: "DEALS", label: "🔥 View Today's Deals" });
    }
    return "";
  });

  // 5. Extract [ACTION:SCANNER]
  cleaned = cleaned.replace(/\[ACTION:SCANNER\]/gi, () => {
    if (!actions.some((a) => a.type === "SCANNER")) {
      actions.push({ type: "SCANNER", label: "📷 Open Barcode Scanner" });
    }
    return "";
  });

  // 6. Extract [ACTION:LOCATION]
  cleaned = cleaned.replace(/\[ACTION:LOCATION\]/gi, () => {
    if (!actions.some((a) => a.type === "LOCATION")) {
      actions.push({ type: "LOCATION", label: "📍 Change Location" });
    }
    return "";
  });

  return {
    cleanText: cleaned.trim(),
    actions,
    rememberFacts,
  };
}

/**
 * Feature flag: Customer AI is currently disabled to prevent quota exhaustion.
 */
export const CUSTOMER_AI_ENABLED = false;

/**
 * Main Customer AI reasoning function.
 * Powered by live Gemini 3.6 Flash.
 * Answers ANY question with high intelligence, empathy, humor, and depth.
 */
export async function askCustomerGemini(
  prompt: string,
  history: StoredCustomerMessage[],
  context: CustomerAIContext
): Promise<CustomerAIResponse> {
  // 💡 Safe Circuit Breaker: Disabled to protect Gemini API quota
  if (!CUSTOMER_AI_ENABLED) {
    return {
      text: "Customer AI Assistant abhi temporarily offline hai. Aap direct local shops aur items browse kar sakte hain.",
      actions: [],
    };
  }

  const trimmed = prompt.trim();
  if (!trimmed) {
    return {
      text: "Bataiye, main aapki kya madad kar sakta hoon? Koi dukaan, saaman, ya recipe/advice ke baare me poochiye!",
      actions: [],
    };
  }

  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim() || FALLBACK_API_KEY;

  // Prepare Live Customer Context
  const learnedPrefs = await loadCustomerPreferences();
  const shops = context.nearbyShops || [];
  const products = context.catalogProducts || [];
  const categories = context.categories || [];
  const locationName =
    context.currentLocation?.city ||
    context.currentLocation?.address ||
    "Current Locality";

  const shopsSummary =
    shops.length > 0
      ? shops
          .slice(0, 15)
          .map(
            (s) =>
              `- "${s.name}" (Slug: "${s.slug}", Category: "${s.category || "General"}", Open: ${s.is_open ? "YES" : "NO"}, Rating: ★${s.average_rating || "4.5"}, Distance: ${s.distance_km ? `${s.distance_km}km` : "Nearby"}, Address: "${s.address || ""}")`
          )
          .join("\n")
      : "No live shops found currently in this area.";

  const productsSummary =
    products.length > 0
      ? products
          .slice(0, 20)
          .map(
            (p) =>
              `- "${p.name}" (ID: "${p.id}", Price: ₹${p.price}, MRP: ₹${p.compare_price || p.price}, Stock: ${p.stock_quantity > 0 ? `${p.stock_quantity} available` : "Out of stock"}, Shop: "${p.shop_name || ""}", ShopSlug: "${p.shop_slug || ""}")`
          )
          .join("\n")
      : "No live products loaded in catalog.";

  const categoriesSummary =
    categories.length > 0
      ? categories.map((c) => c.name).join(", ")
      : "Grocery, Dairy, Snacks, Daily Essentials, Medicine, Fruits, Vegetables";

  // 1. Try Go Backend AI Endpoint First (Production Security Best Practice)
  try {
    const backendRes = await apiClient.post(Endpoints.AI.CUSTOMER_CHAT, {
      prompt: trimmed,
      history: history.slice(-6).map((turn) => ({
        role: turn.sender === "user" ? "user" : "model",
        text: turn.text,
      })),
      current_location: locationName,
      latitude: context.currentLocation?.latitude || 0,
      longitude: context.currentLocation?.longitude || 0,
      nearby_shops: shopsSummary,
      catalog_products: productsSummary,
    });

    const aiData = backendRes.data?.data;
    if (aiData?.text) {
      return {
        text: aiData.text,
        actions: aiData.actions || [],
      };
    }
  } catch (backendErr) {
    console.warn("[CustomerGemini] Backend AI route unavailable, using local client fallback:", backendErr);
  }

  // System instructions: TRUE Conversational AI, NOT a robotic script
  const systemInstruction = `
You are "Gemini AI Shopping Sathi" (शॉपिंग साथी) — a brilliant, warm, witty, and deeply helpful AI companion for Shopsilo (India's hyper-local shopping & store pickup app).

CRITICAL DIRECTIVE:
- You are a REAL, highly intelligent AI (like ChatGPT / Gemini). You are NOT a rigid bot with fixed answers!
- Never give canned, robotic, or repetitive responses. Think on your feet!
- You can answer ANYTHING: shopping queries, recipe ideas (e.g., what to cook, what ingredients are needed and where to buy them), price comparisons, life advice, local recommendations, casual chat, jokes, or technical app help.
- Speak in natural, vibrant, everyday Hinglish (Hindi written in Roman English script with genuine Indian warmth). Feel like a smart, knowledgeable local friend or brother.

USER CONTEXT:
- Current Locality / City: "${locationName}"
- User Coordinates: Lat ${context.currentLocation?.latitude || "N/A"}, Lng ${context.currentLocation?.longitude || "N/A"}
- User Saved Preferences & Memory: ${learnedPrefs.length > 0 ? learnedPrefs.join("; ") : "None yet"}

LIVE LOCAL SHOPS AROUND THE USER:
${shopsSummary}

LIVE PRODUCTS IN LOCAL STORES:
${productsSummary}

POPULAR CATEGORIES:
${categoriesSummary}

SHOPSILO APP FEATURES (Explain naturally when asked, never copy-paste manuals):
- Store Pickup: User selects items -> places order -> gets a 4-digit secret Pickup OTP in Orders tab -> walks to shop -> shows OTP at counter -> collects packed bag without standing in line.
- Barcode Scanner: In-store camera scanner (camera icon in header) to scan any product barcode and check live price/discount.
- Location: Tap the top location badge to switch area/colony/city.
- Contact: Every shop page has green WhatsApp & Call buttons to talk directly to the dukandar.
- Bargain: On select items, users can make a price offer for bulk/custom orders.

ACTION BUTTONS (VERY IMPORTANT):
Whenever you mention or recommend a shop or product, or suggest deals or the scanner, ALWAYS append these tags at the very end of your response so the app renders one-tap clickable buttons for the user:
- Link to a shop: [ACTION:SHOP:<slug>:<Shop Name>]
- Link to a product: [ACTION:PRODUCT:<id>:<Product Name>:<Price>]
- View today's deals: [ACTION:DEALS]
- Open barcode scanner: [ACTION:SCANNER]
- Change location: [ACTION:LOCATION]

LONG-TERM MEMORY:
If the user shares personal habits, diet, favorite brands, or locality (e.g. "mujhe Amul pasand hai", "main vegetarian hoon", "Sector 4 me rehta hoon"), append:
[REMEMBER: <short factual summary>]

Keep your responses conversational, helpful, energetic, and engaging!
`;

  // Build conversation turns
  const historyTurns = history.slice(-6).map((turn) => ({
    role: turn.sender === "user" ? "user" : "model",
    parts: [{ text: turn.text }],
  }));

  const payload = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      ...historyTurns,
      {
        role: "user",
        parts: [{ text: trimmed }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800,
      topP: 0.9,
    },
  };

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[CustomerGemini] API error ${res.status}:`, errText);
      return {
        text: "Arre dost, lagta hai network thoda slow hai! Bataiye aapko kis dukan ya saaman ke baare me janna hai, main turant check karta hoon.",
        actions: [{ type: "DEALS", label: "🔥 View Today's Deals" }],
      };
    }

    const data = await res.json();
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!candidateText) {
      return {
        text: "Ji dost, bataiye aapko aas-paas kaunsi dukaan ya saaman dhoondhna hai? Main aapki poori madad karunga!",
        actions: [],
      };
    }

    const { cleanText, actions, rememberFacts } = parseResponseTags(candidateText);

    // Save learned facts asynchronously
    if (rememberFacts.length > 0) {
      for (const fact of rememberFacts) {
        saveCustomerPreference(fact);
      }
    }

    return {
      text: cleanText || candidateText,
      actions,
    };
  } catch (err) {
    console.error("[CustomerGemini] Exception during API call:", err);
    return {
      text: "Arre dost, lagta hai internet connection me thodi rukawat hai. Kripya ek baar dobara poochiye!",
      actions: [],
    };
  }
}
