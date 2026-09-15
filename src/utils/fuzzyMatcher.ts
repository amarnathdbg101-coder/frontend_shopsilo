/**
 * ============================================================================
 * WHAT: Client-Side Jaro-Winkler, Levenshtein & Bilingual Hinglish Offline Fuzzy Matcher.
 * HOW: Maps rural/everyday Hinglish retail keywords ("doodh", "tel", "atta", "sabun")
 *      to English equivalents, and runs high-speed Jaro-Winkler matching on local inventory.
 * WHY: Enables village & local customers to search naturally in Hinglish or English,
 *      delivering instant 0ms responses without requiring exact English spelling.
 * WHERE: src/utils/fuzzyMatcher.ts
 * ============================================================================
 */
import { Product } from "@/features/products/types";

// Bilingual Hinglish <-> English Common Retail Dictionary
export const HINGLISH_SYNONYMS: Record<string, string[]> = {
  // Dairy & Breakfast
  doodh: ["doodh", "milk", "dudh", "dairy"],
  dudh: ["milk", "doodh", "dairy"],
  dhoodh: ["milk", "doodh"],
  milk: ["milk", "doodh", "dudh", "dairy"],
  dahi: ["curd", "dahi", "yogurt"],
  curd: ["curd", "dahi"],
  paneer: ["paneer", "cheese", "panir"],
  panir: ["paneer", "cheese"],
  cheese: ["cheese", "paneer"],
  makhan: ["butter", "makhan", "makkhan"],
  butter: ["butter", "makhan"],
  anda: ["egg", "anda", "ande"],
  ande: ["egg", "anda", "ande"],
  egg: ["egg", "anda", "ande"],
  bread: ["bread", "pav", "bun"],
  pav: ["bread", "pav"],

  // Cooking Oil & Ghee
  tel: ["oil", "tel", "mustard", "sarson", "refined", "sunflower"],
  tail: ["oil", "tel", "mustard"],
  oil: ["oil", "tel", "mustard", "refined", "sunflower"],
  sarson: ["mustard", "sarson", "oil", "tel"],
  sarso: ["mustard", "sarson", "oil", "tel"],
  mustard: ["mustard", "sarson", "oil", "tel"],
  ghee: ["ghee", "ghi"],
  ghi: ["ghee", "ghi"],

  // Grains, Rice, Atta & Pulses
  chawal: ["rice", "chawal", "chaawal", "basmati"],
  chaawal: ["rice", "chawal", "basmati"],
  rice: ["rice", "chawal", "basmati"],
  atta: ["atta", "flour", "gehu", "wheat", "chakki", "aata"],
  aata: ["atta", "flour", "gehu", "wheat", "chakki"],
  flour: ["flour", "atta", "maida", "besan"],
  gehu: ["wheat", "atta", "flour"],
  wheat: ["wheat", "atta", "flour"],
  maida: ["maida", "flour"],
  besan: ["besan", "gram flour", "chana"],
  suji: ["suji", "sooji", "semolina"],
  sooji: ["sooji", "suji", "semolina"],
  poha: ["poha", "chura", "flattened rice"],
  chura: ["poha", "chura"],
  dal: ["dal", "daal", "pulse", "lentil", "arhar", "toor", "moong", "chana"],
  daal: ["dal", "daal", "pulse", "lentil", "arhar", "toor", "moong", "chana"],
  arhar: ["arhar", "toor", "dal"],
  toor: ["toor", "arhar", "dal"],
  chana: ["chana", "gram", "chhole"],
  rajma: ["rajma", "kidney beans"],

  // Spices & Condiments
  cheeni: ["sugar", "cheeni", "chini", "shakkar"],
  chini: ["sugar", "cheeni", "chini"],
  sugar: ["sugar", "cheeni", "chini"],
  namak: ["salt", "namak", "iodized"],
  salt: ["salt", "namak"],
  masala: ["masala", "spice", "powder"],
  masale: ["masala", "spice"],
  mirch: ["chilli", "chili", "mirch", "mirchi"],
  mirchi: ["chilli", "chili", "mirch"],
  haldi: ["turmeric", "haldi"],
  turmeric: ["turmeric", "haldi"],
  dhaniya: ["coriander", "dhaniya"],
  jeera: ["jeera", "zeera", "cumin"],
  adrak: ["ginger", "adrak"],
  lehsun: ["garlic", "lehsun", "lahsun"],
  lahsun: ["garlic", "lehsun"],
  garlic: ["garlic", "lehsun"],

  // Tea, Beverages & Water
  chai: ["tea", "chai", "chaipatti"],
  chaipatti: ["tea", "chai", "chaipatti"],
  tea: ["tea", "chai", "chaipatti"],
  coffee: ["coffee", "kafi"],
  paani: ["water", "paani", "pani", "soda"],
  pani: ["water", "paani", "pani"],
  water: ["water", "paani", "pani"],
  "cold drink": ["drink", "beverage", "soda", "coke", "pepsi", "sprite"],
  juice: ["juice", "drink"],

  // Biscuits & Snacks
  biscuit: ["biscuit", "biskut", "cookie", "rusk"],
  biskut: ["biscuit", "biskut", "cookie"],
  cookies: ["biscuit", "cookie"],
  rusk: ["rusk", "toast", "biscuit"],
  toast: ["rusk", "toast"],
  namkeen: ["namkeen", "bhujia", "sev", "mixture"],
  bhujia: ["bhujia", "namkeen"],
  chips: ["chips", "wafer", "snack", "kurkure", "lays"],
  kurkure: ["kurkure", "chips", "snack"],
  chocolate: ["chocolate", "choclate", "cadbury", "sweet", "dairy milk"],

  // Personal Care & Cleaning
  sabun: ["soap", "sabun", "saabun", "bar", "bath"],
  saabun: ["soap", "sabun", "bar"],
  soap: ["soap", "sabun", "bar"],
  shampoo: ["shampoo", "shampu", "hair"],
  manjan: ["toothpaste", "paste", "colgate", "manjan"],
  paste: ["toothpaste", "paste", "colgate"],
  colgate: ["colgate", "toothpaste", "paste"],
  toothpaste: ["toothpaste", "colgate", "paste"],
  brush: ["toothbrush", "brush"],
  surf: ["detergent", "surf", "washing powder", "ghadi", "tide"],
  detergent: ["detergent", "surf", "washing powder", "ghadi", "tide"],
  nirma: ["detergent", "nirma", "washing powder"],
  ghadi: ["ghadi", "detergent", "soap"],
  harpic: ["harpic", "cleaner", "toilet"],

  // Health & Medicine
  dawa: ["medicine", "dawa", "davai", "tablet", "syrup"],
  davai: ["medicine", "dawa", "davai", "tablet"],
  medicine: ["medicine", "dawa", "davai", "tablet"],
  tablet: ["tablet", "medicine", "capsule", "goli"],
  goli: ["tablet", "medicine", "goli"],

  // Vegetables & Essentials
  aloo: ["potato", "aloo", "aalu"],
  aalu: ["potato", "aloo", "aalu"],
  potato: ["potato", "aloo", "aalu"],
  pyaz: ["onion", "pyaz", "pyaaz"],
  pyaaz: ["onion", "pyaz"],
  onion: ["onion", "pyaz"],
  tamatar: ["tomato", "tamatar"],
  tomato: ["tomato", "tamatar"],
  nimbu: ["lemon", "nimbu"],
  kela: ["banana", "kela"],
  aam: ["mango", "aam"],
  seb: ["apple", "seb"],
};

/**
 * Expands any word into its Hinglish / English synonym set.
 */
export function expandHinglishSynonyms(word: string): string[] {
  const clean = word.toLowerCase().trim();
  if (!clean) return [];
  if (HINGLISH_SYNONYMS[clean]) {
    return HINGLISH_SYNONYMS[clean];
  }
  return [clean];
}

/**
 * Calculates Jaro-Winkler similarity score (0.0 to 1.0) between two strings.
 */
export function jaroWinklerDistance(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();

  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  const matchDistance = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
  const str1Matches = new Array(str1.length).fill(false);
  const str2Matches = new Array(str2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, str2.length);

    for (let j = start; j < end; j++) {
      if (str2Matches[j]) continue;
      if (str1[i] !== str2[j]) continue;
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < str1.length; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / str1.length +
      matches / str2.length +
      (matches - transpositions / 2) / matches) /
    3.0;

  // Winkler prefix scaling
  let prefix = 0;
  const maxPrefix = 4;
  for (let i = 0; i < Math.min(maxPrefix, str1.length, str2.length); i++) {
    if (str1[i] === str2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

export interface LocalFuzzyMatchResult {
  product: Product;
  confidence: number; // 0 to 100
}

/**
 * Matches a query term (e.g. "doodh", "tel", "cheeni", "maggi") against store inventory locally in 0ms.
 * Automatically expands Hinglish synonyms so village customers find items instantly.
 */
export function findLocalFuzzyMatch(
  term: string,
  inventory: Product[],
  minConfidence: number = 70
): LocalFuzzyMatchResult | null {
  const cleanTerm = term.toLowerCase().trim();
  if (!cleanTerm || !inventory || inventory.length === 0) return null;

  // Expand term into synonyms (e.g. "doodh" -> ["doodh", "milk", "dudh", "dairy"])
  const searchVariants = expandHinglishSynonyms(cleanTerm);

  let bestMatch: Product | null = null;
  let bestScore = 0;

  for (const p of inventory) {
    const title = (p.title || (p as any).name || "").toLowerCase();
    const titleWords = title.split(/\s+/);

    for (const variant of searchVariants) {
      const score = jaroWinklerDistance(variant, title) * 100;

      // Substring & whole-word bonus
      const hasExactWord = titleWords.includes(variant);
      const hasPartialWord = titleWords.some(
        (w: string) => w.startsWith(variant) || variant.startsWith(w)
      );

      const bonus = hasExactWord ? 35 : hasPartialWord ? 20 : 0;
      const finalScore = Math.min(100, score + bonus);

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestMatch = p;
      }
    }
  }

  if (bestMatch && bestScore >= minConfidence) {
    return { product: bestMatch, confidence: Math.round(bestScore) };
  }

  return null;
}
