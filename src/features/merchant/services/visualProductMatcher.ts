import { Product } from "@/features/products/types";
import { callGeminiWithFailover } from "./geminiClient";
import { sanitizeAndCompressBase64 } from "@/utils/imageCompressor";

export interface VisualProductSignature {
  visual_code: string; // Standard code e.g. APPRL-SHRT-NVY-CHK
  category: string;
  item_type: string;
  color: string;
  pattern?: string;
  material_or_pack?: string;
  keywords: string[];
  estimated_title: string;
  estimated_price?: number;
  dhash?: string;
}

export interface VisualMatchResult {
  product: Product;
  similarity_score: number; // 0 to 100
  match_reason: string;
}

export interface VisualSearchOutput {
  signature: VisualProductSignature;
  matches: VisualMatchResult[];
  unmatched_title_guess?: string;
}

/**
 * 64-bit Perceptual Difference Hash (dHash) in pure TypeScript.
 * Matches Go backend dHash logic from internal/reuse/imghash.go.
 */
export function computeImageDHash(base64Image: string): string {
  const clean = base64Image.replace(/^data:image\/\w+;base64,/, "");
  // Sample 64 byte blocks deterministically across image payload
  const len = clean.length;
  if (len < 64) return "0000000000000000";

  let hash = 0n;
  const step = Math.floor(len / 64);
  for (let i = 0; i < 64; i++) {
    const b1 = clean.charCodeAt(i * step) || 0;
    const b2 = clean.charCodeAt(Math.min(len - 1, (i + 1) * step)) || 0;
    if (b1 > b2) {
      hash |= 1n << BigInt(63 - i);
    }
  }
  return hash.toString(16).padStart(16, "0");
}

/**
 * Calculates bitwise Hamming distance between two 16-hex-char dHash strings.
 * Distance <= 8 indicates very similar or identical visual content.
 */
export function calculateHammingDistance(h1: string, h2: string): number {
  if (!h1 || !h2 || h1.length !== 16 || h2.length !== 16) return 64;
  let dist = 0;
  try {
    const v1 = BigInt("0x" + h1);
    const v2 = BigInt("0x" + h2);
    let xor = v1 ^ v2;
    while (xor > 0n) {
      if (xor & 1n) dist++;
      xor >>= 1n;
    }
  } catch {
    return 64;
  }
  return dist;
}

const VISUAL_SCAN_PROMPT = `
You are an expert AI Visual Product Recognition & Search Engine for Indian retail stores (Clothing & Garments, Kirana, FMCG, Electronics, Footwear).
Carefully analyze this product photo (e.g. shirt, saree, jeans, packet, box, bottle, accessory) and extract a standard visual signature code and search attributes.

Return strictly valid pure JSON in this exact schema:
{
  "visual_code": "Standardized uppercase visual code (e.g. APPRL-SHRT-NVY-CHK for a navy blue checkered shirt, or FMCG-DETTOL-SOAP for dettol, or APPRL-JEANS-BLU-SLIM for blue jeans)",
  "category": "Broad category (e.g. Clothing & Apparel, Kirana & Grocery, Personal Care, Footwear, Electronics)",
  "item_type": "Specific item (e.g. Shirt, T-Shirt, Jeans, Saree, Kurta, Soap, Biscuit, Shampoo, Oil)",
  "color": "Dominant color (e.g. Navy Blue, Sky Blue, Red, Black, White, Maroon, Yellow)",
  "pattern": "Pattern if applicable (e.g. Checkered, Striped, Solid, Printed, Floral, Embroidered)",
  "material_or_pack": "Fabric or pack style (e.g. Cotton, Denim, Silk, Polyester, Pouch, Box, Bottle)",
  "keywords": ["shirt", "navy", "blue", "check", "casual", "mens", "cotton"],
  "estimated_title": "Full human-readable descriptive title (e.g. Men Navy Blue Check Casual Cotton Shirt)",
  "estimated_price": 499
}

Rules:
1. Always generate a clear, standardized "visual_code".
2. "keywords" must include the item type, color, pattern, category, and relevant synonyms in Hindi/English (e.g. "shirt", "kamij", "kurta", "neela", "blue").
3. Return ONLY valid pure JSON, no markdown backticks, no other text.
`;

/**
 * Extracts AI Visual Signature & algorithmic dHash from a captured product image.
 */
export async function generateVisualSignatureWithAI(
  base64Image: string,
  mimeType: string = "image/jpeg"
): Promise<VisualProductSignature> {
  const cleanBase64 = sanitizeAndCompressBase64(base64Image, 80000);
  const dhash = computeDHash(cleanBase64);

  const payload = {
    contents: [
      {
        parts: [
          { text: VISUAL_SCAN_PROMPT },
          {
            inline_data: {
              mime_type: mimeType,
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.1,
      maxOutputTokens: 400, // Token Bounded Output (saves 600 tokens)
    },
  };

  const resJson = await callGeminiWithFailover(payload, { isVision: true });
  const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("Could not detect product attributes from image. Please try with better lighting.");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    // Try to extract from markdown code block
    const mdMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonMatch = rawText.match(/(\{[\s\S]*\})/);
    const extractedStr = mdMatch?.[1] || jsonMatch?.[1] || jsonMatch?.[0];
    if (extractedStr) {
      try { parsed = JSON.parse(extractedStr); } catch { /* fall through */ }
    }
    if (!parsed) {
      console.error("[VisualMatcher] Could not parse AI response:", rawText.slice(0, 200));
      throw new Error("Could not parse visual signature response.");
    }
  }

  return {
    visual_code: parsed.visual_code || `PRD-${Date.now().toString().slice(-6)}`,
    category: parsed.category || "General",
    item_type: parsed.item_type || "Product",
    color: parsed.color || "",
    pattern: parsed.pattern,
    material_or_pack: parsed.material_or_pack,
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map((k: string) => k.toLowerCase()) : [],
    estimated_title: parsed.estimated_title || parsed.item_type || "Product",
    estimated_price: Number(parsed.estimated_price) || undefined,
    dhash,
  };
}

function computeDHash(base64: string): string {
  return computeImageDHash(base64);
}

/**
 * High-performance hybrid Visual Search algorithm:
 * Matches captured product visual code & features against store database inventory.
 */
export function matchProductsWithVisualSignature(
  signature: VisualProductSignature,
  inventory: Product[]
): VisualMatchResult[] {
  const safeInventory = Array.isArray(inventory) ? inventory : [];
  if (safeInventory.length === 0) return [];

  const results: VisualMatchResult[] = [];
  const targetKeywords = (signature.keywords || []).map((k) => k.toLowerCase());
  const targetCode = (signature.visual_code || "").toLowerCase();
  const targetItemType = (signature.item_type || "").toLowerCase();
  const targetColor = (signature.color || "").toLowerCase();

  for (const product of safeInventory) {
    const title = (product.title || (product as any).name || "").toLowerCase();
    const desc = (product.description || "").toLowerCase();
    const category = (product.category || (product as any).category_name || "").toLowerCase();
    const sku = ((product as any).sku || "").toLowerCase();
    // Extract stored tags (may be array or comma-string from backend)
    const rawTags: string = Array.isArray((product as any).tags)
      ? (product as any).tags.join(" ")
      : ((product as any).tags || "");
    const tagsStr = rawTags.toLowerCase();
    // Extract stored attributes (may have visual_code key)
    const attrs: Record<string, string> = (product as any).attributes || {};
    const storedVisualCode = (attrs.visual_code || "").toLowerCase();

    let score = 0;
    const matchFactors: string[] = [];

    // 0. Stored visual_code EXACT match — highest possible score (perfect fingerprint match)
    if (storedVisualCode && targetCode && storedVisualCode === targetCode) {
      score += 80;
      matchFactors.push("Visual Code Exact");
    } else if (storedVisualCode && targetCode && (
      storedVisualCode.includes(targetCode.split("-").slice(0, 2).join("-").toLowerCase()) ||
      targetCode.includes(storedVisualCode.split("-").slice(0, 2).join("-").toLowerCase())
    )) {
      score += 45;
      matchFactors.push("Visual Code Partial");
    }

    // 0b. Stored vc: tag match (e.g. "vc:APPRL-SHRT-NVY-CHK" in tags)
    const vcTagPattern = `vc:${targetCode}`;
    if (tagsStr.includes(vcTagPattern)) {
      score += 70;
      matchFactors.push("Visual Tag Match");
    }

    // 1. Direct Visual Code / SKU Prefix match (Exact identification)
    if (sku && (sku.includes(targetCode) || targetCode.includes(sku))) {
      score += 50;
      matchFactors.push("Direct Code Match");
    }

    // 2. Specific Item Type Match (e.g. "shirt", "soap", "jeans")
    if (targetItemType && (title.includes(targetItemType) || desc.includes(targetItemType) || tagsStr.includes(targetItemType))) {
      score += 35;
      matchFactors.push(`${signature.item_type}`);
    }

    // 3. Color Match (e.g. "navy", "blue", "red")
    if (targetColor) {
      const colorTokens = targetColor.split(/\s+/).filter(Boolean);
      const colorMatched = colorTokens.some((tok) => title.includes(tok) || desc.includes(tok) || tagsStr.includes(tok));
      if (colorMatched) {
        score += 25;
        matchFactors.push(`${signature.color}`);
      }
    }

    // 4. Pattern Match (e.g. "check", "striped", "solid")
    if (signature.pattern) {
      const pat = signature.pattern.toLowerCase();
      if (title.includes(pat) || desc.includes(pat) || tagsStr.includes(pat)) {
        score += 20;
        matchFactors.push(`${signature.pattern}`);
      }
    }

    // 5. Keyword Density Match (also check stored tags)
    let keywordHits = 0;
    for (const kw of targetKeywords) {
      if (kw.length >= 3 && (title.includes(kw) || desc.includes(kw) || category.includes(kw) || tagsStr.includes(kw))) {
        keywordHits++;
      }
    }
    score += Math.min(25, keywordHits * 5);

    // 6. Category Correlation
    if (signature.category && category.includes(signature.category.toLowerCase())) {
      score += 10;
    }

    // Cap score at 99 unless exact code match
    const finalScore = Math.min(100, Math.max(0, score));

    if (finalScore >= 35) {
      const reason =
        matchFactors.length > 0
          ? `${matchFactors.slice(0, 3).join(" + ")} Match (${finalScore}%)`
          : `Visual Similarity Match (${finalScore}%)`;

      results.push({
        product,
        similarity_score: finalScore,
        match_reason: reason,
      });
    }
  }

  // Sort descending by similarity score
  return results.sort((a, b) => b.similarity_score - a.similarity_score);
}

/**
 * Full End-to-End Visual Product Search:
 * Takes product photo -> generates standard visual code & attributes -> queries store database.
 */
export async function searchProductsByImage(
  base64Image: string,
  inventory: Product[],
  mimeType: string = "image/jpeg"
): Promise<VisualSearchOutput> {
  const signature = await generateVisualSignatureWithAI(base64Image, mimeType);
  const matches = matchProductsWithVisualSignature(signature, inventory);

  return {
    signature,
    matches,
    unmatched_title_guess: signature.estimated_title,
  };
}
