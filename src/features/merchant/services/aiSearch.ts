import { Product } from "@/features/products/types";
import { callGeminiWithFailover } from "./geminiClient";

// In-memory query cache — zero redundant API calls for same query
const semanticCache = new Map<string, string[]>();

/**
 * Hindi/Hinglish synonym expansion map.
 * Expands colloquial terms -> standard search keywords for better Tier 1 local match accuracy.
 * This runs in <1ms and avoids unnecessary Gemini calls for common synonym queries.
 */
const HINDI_SYNONYMS: Record<string, string[]> = {
  // Grocery synonyms
  namak: ["salt", "namak"],
  cheeni: ["sugar", "cheeni", "shakkar"],
  tel: ["oil", "tel", "sarson", "sunflower"],
  atta: ["flour", "atta", "gehu"],
  chawal: ["rice", "chawal"],
  dal: ["lentil", "dal", "daal"],
  doodh: ["milk", "doodh"],
  chai: ["tea", "chai"],
  sabun: ["soap", "sabun"],
  shampoo: ["shampoo", "baal", "hair"],
  toothpaste: ["toothpaste", "colgate", "brush"],
  biscuit: ["biscuit", "cookie", "parle"],
  maggi: ["maggi", "noodles", "instant"],
  // Clothing synonyms
  shirt: ["shirt", "kamij", "kamiz"],
  pant: ["pant", "trouser", "jeans"],
  jute: ["jute", "jutey", "shoes", "chappal"],
  // Common intents
  "thand ke liye": ["winter", "warm", "heater", "blanket", "sweater"],
  "garmi ke liye": ["summer", "cool", "fan", "ac"],
  "bukhar ke liye": ["fever", "paracetamol", "crocin", "dawa"],
  "baby ke liye": ["baby", "infant", "child", "bachcha", "diaper"],
  "pooja ke liye": ["pooja", "agarbatti", "diya", "camphor"],
};

/** Expands a query with Hindi synonyms for better local match accuracy */
function expandQueryWithSynonyms(query: string): string[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const expanded = new Set<string>(tokens);

  // Add synonym expansions
  for (const [key, synonyms] of Object.entries(HINDI_SYNONYMS)) {
    if (query.toLowerCase().includes(key)) {
      synonyms.forEach((s) => expanded.add(s));
    }
  }

  return Array.from(expanded);
}

/**
 * 2-Tier High Efficiency Product Search:
 * Tier 1 (<1ms): Ultra-fast local token matching with Hindi synonym expansion
 * Tier 2: Gemini Semantic Intent AI (only when local finds nothing)
 */
export async function searchProductsWithAISemantic(
  query: string,
  products: Product[] = []
): Promise<{ results: Product[]; isSemanticMatch: boolean }> {
  const safeProducts: Product[] = Array.isArray(products)
    ? products
    : Array.isArray((products as any)?.products)
    ? (products as any).products
    : [];

  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return { results: safeProducts, isSemanticMatch: false };

  // Tier 1: Fast local matching with synonym expansion
  const expandedTokens = expandQueryWithSynonyms(cleanQuery);

  const localMatches = safeProducts.filter((p) => {
    const title = (p.title || (p as any).name || "").toLowerCase();
    const desc = (p.description || "").toLowerCase();
    const category = (p.category || (p as any).category_name || "").toLowerCase();
    const tags = Array.isArray((p as any).tags)
      ? (p as any).tags.join(" ").toLowerCase()
      : ((p as any).tags || "").toLowerCase();

    // All original tokens must match OR all expanded synonyms must match
    const originalMatch = cleanQuery.split(/\s+/).filter(Boolean).every(
      (tok) => title.includes(tok) || desc.includes(tok) || category.includes(tok) || tags.includes(tok)
    );
    if (originalMatch) return true;

    // Synonym-expanded matching — any token hits
    const hitCount = expandedTokens.filter(
      (tok) => tok.length >= 3 && (title.includes(tok) || desc.includes(tok) || category.includes(tok) || tags.includes(tok))
    ).length;
    return hitCount >= Math.min(2, expandedTokens.length);
  });

  if (localMatches.length > 0) {
    return { results: localMatches, isSemanticMatch: false };
  }

  // Tier 2: AI Semantic (only for complex/conversational queries with no local result)
  if (cleanQuery.length < 3 || safeProducts.length === 0) {
    return { results: [], isSemanticMatch: false };
  }

  // Shop-scoped cache key
  const shopInventoryKey = safeProducts.map((p) => p.id).join("|");
  const cacheKey = `${cleanQuery}_${shopInventoryKey}`;

  // Check in-memory cache
  if (semanticCache.has(cacheKey)) {
    const cachedIds = semanticCache.get(cacheKey) || [];
    const matched = safeProducts.filter((p) => cachedIds.includes(p.id));
    return { results: matched, isSemanticMatch: true };
  }

  // Build compact catalog (ID + title + category only — minimize tokens)
  const catalogSummary = safeProducts
    .slice(0, 120)
    .map((p) => `${p.id}|${p.title || (p as any).name}|${p.category || ""}`)
    .join("\n");

  const prompt = `Indian retail store assistant. Customer wants: "${cleanQuery}"
Store inventory (ID|Title|Category):
${catalogSummary}

Return ONLY valid JSON: {"matched_ids":["id1","id2"]}
Match by intent, synonym, Hindi/Hinglish meaning. Empty array if nothing matches.`;

  try {
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.05,
        maxOutputTokens: 300,
      },
    };

    const json = await callGeminiWithFailover(payload);
    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let parsed: any = {};
    try { parsed = JSON.parse(rawText); }
    catch {
      const m = rawText.match(/\{[\s\S]*\}/);
      if (m) try { parsed = JSON.parse(m[0]); } catch { /* */ }
    }

    const matchedIds: string[] = parsed.matched_ids || [];
    semanticCache.set(cacheKey, matchedIds);

    // Auto-evict cache if it grows too large
    if (semanticCache.size > 200) {
      const firstKey = semanticCache.keys().next().value;
      if (firstKey) semanticCache.delete(firstKey);
    }

    const matchedProducts = safeProducts.filter((p) => matchedIds.includes(p.id));
    return { results: matchedProducts, isSemanticMatch: matchedProducts.length > 0 };
  } catch {
    return { results: [], isSemanticMatch: false };
  }
}
