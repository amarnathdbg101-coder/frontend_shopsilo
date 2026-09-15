import { Config } from "@/constants/config";
import { Endpoints } from "@/api/endpoints";
import { useAuthStore } from "@/store/useAuthStore";
import { SecureStorage } from "@/utils/secure-storage";

export interface CleanUserError {
  title: string;
  message: string;
  code: string;
}

/**
 * Enterprise User-Friendly Error Sanitizer:
 * Converts raw technical stack traces (AxiosError, HTTP 500, PGX pool, JSON syntax)
 * into warm, polite, non-technical Indian retail messages for shopkeepers and customers.
 */
export function getUserFriendlyError(err: any): CleanUserError {
  if (!err) {
    return {
      title: "Choti Si Samasya",
      message: "Ek baar network check karke dobara try karein!",
      code: "ERR_UNKNOWN",
    };
  }

  const status = err?.status || err?.statusCode || err?.response?.status;
  const rawMsg = (err?.response?.data?.message || err?.message || "").toString().toLowerCase();

  // 1. Session & Auth Expired
  if (status === 401 || status === 403 || rawMsg.includes("unauthorized") || rawMsg.includes("token")) {
    return {
      title: "Session Expire Ho Gaya",
      message: "Aapka secure session update hone ki zarurat hai. Kripya dobara login karein!",
      code: "AUTH_EXPIRED",
    };
  }

  // 2. Resource Not Found
  if (status === 404 || rawMsg.includes("not found")) {
    return {
      title: "Item / Page Nahi Mila",
      message: "Yeh saaman ya jankari catalog me abhi majood nahi hai. Naya product add kar sakte hain!",
      code: "NOT_FOUND",
    };
  }

  // 3. Too Many Requests / Rate Limit
  if (status === 429 || rawMsg.includes("rate limit") || rawMsg.includes("429") || rawMsg.includes("quota")) {
    return {
      title: "Tez Requests",
      message: "Bohot saari requests ek sath aayi hain. Kripya 10 second ruk kar retry karein!",
      code: "RATE_LIMITED",
    };
  }

  // 4. Network / Internet Offline
  if (
    rawMsg.includes("network error") ||
    rawMsg.includes("timeout") ||
    rawMsg.includes("failed to fetch") ||
    rawMsg.includes("econnrefused")
  ) {
    return {
      title: "Internet Connection Slow",
      message: "Aapka Wi-Fi ya Mobile Data thoda slow hai. Kripya connection check karke dobara try karein!",
      code: "NETWORK_SLOW",
    };
  }

  // 5. Default Polite Error
  return {
    title: "Dukaan System Notice",
    message: "Aapka task perform ho raha hai. Agar koi dikkat aaye toh 1-tap me retry karein!",
    code: `SYS_ERR_${status || "500"}`,
  };
}

/**
 * 24-Hour Developer Telemetry Auto-Reporter:
 * Asynchronously posts raw technical stack traces and route details to the Go backend
 * (`POST /reports/telemetry-error`) in background (0ms UI impact).
 * Uses native `fetch` instead of `apiClient` to prevent circular require cycles (client -> errorFormatter -> error-sanitizer -> client).
 */
export async function logDeveloperErrorTelemetry(
  err: any,
  context: { requestPath?: string; userFriendlyMsg?: string } = {}
): Promise<void> {
  try {
    const rawTrace = err?.stack || (typeof err === "object" ? JSON.stringify(err) : String(err));
    const userMsg = context.userFriendlyMsg || getUserFriendlyError(err).message;
    const status = err?.status || err?.statusCode || err?.response?.status || 500;

    const payload = {
      error_code: `ERR_${status}`,
      user_friendly_msg: userMsg,
      developer_stack_trace: rawTrace,
      request_path: context.requestPath || "frontend_telemetry",
    };

    const token =
      useAuthStore.getState().accessToken || (await SecureStorage.getAccessToken().catch(() => null));

    // Fire and forget (asynchronous non-blocking background request)
    fetch(`${Config.API_BASE_URL}${Endpoints.REPORTS}/telemetry-error`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    // Suppress telemetry logging failures
  }
}
