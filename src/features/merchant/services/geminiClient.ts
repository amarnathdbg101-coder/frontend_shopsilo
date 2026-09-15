import axios from "axios";

/**
 * ============================================================
 * Gemini AI Client — Shopsilo
 * Exact Requested Gemini Model Stack (Frontend & Backend Aligned):
 *   1. gemini-3.8-flash       <- Autonomous agents & long-horizon reasoning
 *   2. gemini-3.7-flash       <- Reliable multi-step execution
 *   3. gemini-3.6-flash       <- Multimodal balance & speed
 *   4. gemini-3.5-flash       <- Legacy stable routine workload
 *   5. gemini-3.5-flash-lite  <- Fastest, high-throughput tasks
 *   6. gemini-3.1-pro-preview <- Advanced intelligence & complex problem-solving
 * ============================================================
 */

export const ACTIVE_GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-pro-preview",
];

export function getGeminiApiKeys(): string[] {
  const keys: string[] = [];
  const primary = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
  const k2 = process.env.EXPO_PUBLIC_GEMINI_API_KEY_2?.trim();
  const k3 = process.env.EXPO_PUBLIC_GEMINI_API_KEY_3?.trim();

  if (primary) keys.push(primary);
  if (k2) keys.push(k2);
  if (k3) keys.push(k3);

  if (keys.length === 0) {
    keys.push("AQ.Ab8RN6J1hv1iC1XjUBgKpt-OijUlutFi7VkMQTOlYBHghGCIOA");
  }

  return keys;
}

export function getGeminiApiKey(): string {
  return getGeminiApiKeys()[0];
}

export interface GeminiResponsePart {
  text?: string;
}

export interface GeminiCandidate {
  content?: { parts?: GeminiResponsePart[]; role?: string };
  finishReason?: string;
}

export interface GeminiApiResponse {
  candidates?: GeminiCandidate[];
  error?: { code: number; message: string; status?: string };
}

/**
 * In-flight request deduplication:
 * If the exact same payload fires twice (double-tap), only 1 actual HTTP call is made.
 */
const _inFlight = new Map<string, Promise<GeminiApiResponse>>();

/**
 * Universal resilient Gemini caller using Axios:
 * - Multi-API Key Failover
 * - Aligned Model Stack (gemini-3.8-flash -> 3.7-flash -> 3.6-flash -> 3.5-flash -> 3.5-flash-lite -> 3.1-pro-preview)
 * - Request deduplication
 */
export async function callGeminiWithFailover(
  payload: Record<string, unknown>,
  options: { timeoutMs?: number; isVision?: boolean } = {}
): Promise<GeminiApiResponse> {
  const timeoutMs = options.timeoutMs ?? 25000;

  // Dedup key based on first 300 chars of serialized payload
  const dedupKey = JSON.stringify(payload).slice(0, 300) + (options.isVision ? "_v" : "");
  if (_inFlight.has(dedupKey)) {
    return _inFlight.get(dedupKey)!;
  }

  const promise = _runWithFailoverAxios(payload, timeoutMs);
  _inFlight.set(dedupKey, promise);
  promise.finally(() => _inFlight.delete(dedupKey));
  return promise;
}

async function _runWithFailoverAxios(
  payload: Record<string, unknown>,
  optionsTimeoutMs: number
): Promise<GeminiApiResponse> {
  const keys = getGeminiApiKeys();
  let lastError: Error | null = null;

  for (const apiKey of keys) {
    for (const model of ACTIVE_GEMINI_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      try {
        const res = await axios.post<GeminiApiResponse>(url, payload, {
          headers: { "Content-Type": "application/json" },
          timeout: optionsTimeoutMs,
        });

        const json = res.data;

        if (json.error) {
          console.warn(`[GeminiClient] X ${model} API error:`, json.error.message?.slice(0, 100));
          lastError = new Error(json.error.message);
          continue;
        }

        if (!json.candidates?.length) {
          console.warn(`[GeminiClient] ! ${model} -> No candidates`);
          continue;
        }

        const candidate = json.candidates[0];
        const finish = candidate.finishReason;

        if (finish === "SAFETY" || finish === "OTHER") {
          console.warn(`[GeminiClient] ! ${model} -> Safety blocked (${finish}), trying next`);
          continue;
        }

        if (candidate.content?.parts?.length) {
          console.log(`[GeminiClient] OK ${model} -> (${finish ?? "STOP"})`);
          return json;
        }

        console.warn(`[GeminiClient] ! ${model} -> Empty parts`);
      } catch (err: any) {
        const isRateLimit = err?.response?.status === 429 || (err?.message || "").includes("429") || (err?.message || "").includes("quota");
        const errMsg = err?.response?.data?.error?.message || err?.message || "Axios HTTP error";
        console.warn(`[GeminiClient] ${isRateLimit ? "RATE_LIMIT_429" : "ERR"} ${model}:`, errMsg.slice(0, 100));
        lastError = new Error(errMsg);

        if (isRateLimit) {
          console.log("[GeminiClient] 429 Limit hit, rotating to next available API key / model...");
          break; // Try next API key
        }
      }
    }
  }

  throw lastError ?? new Error("All Gemini keys and models failed. Please try again in a moment.");
}
