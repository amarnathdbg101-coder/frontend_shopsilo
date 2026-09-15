import axios, { AxiosError } from "axios";
import { ApiError, ApiErrorPayload } from "@/types/api";
import { logDeveloperErrorTelemetry } from "@/utils/error-sanitizer";

const isTechnicalJargon = (str: string): boolean => {
  const lower = str.toLowerCase();
  return (
    lower.includes("http://") ||
    lower.includes("https://") ||
    lower.includes("sqlstate") ||
    lower.includes("syntax error") ||
    lower.includes("pq:") ||
    lower.includes("column ") ||
    lower.includes("table ") ||
    lower.includes("request failed with status code") ||
    lower.includes("network error") ||
    lower.includes("failed to scan") ||
    lower.includes("typeerror") ||
    lower.includes("undefined is not")
  );
};

export const formatUserFriendlyMessage = (
  status: number,
  rawError?: string,
  axiosCode?: string,
  url?: string
): string => {
  if (status === 0 || axiosCode === "ERR_NETWORK") {
    return "Internet connection thoda slow hai. Kripya Wi-Fi / Data check karke dobara try karein!";
  }
  if (axiosCode === "ECONNABORTED" || rawError?.toLowerCase().includes("timeout")) {
    return "Connection timeout ho gaya hai. Kripya ek baar retry karein!";
  }

  const cleanRaw = (rawError || "").trim();
  const lowerRaw = cleanRaw.toLowerCase();

  // Known Business Validation Messages
  if (lowerRaw.includes("invalid credentials") || lowerRaw.includes("password")) {
    return "Incorrect email/mobile or password. Please try again.";
  }
  if (lowerRaw.includes("already exists") || lowerRaw.includes("already registered")) {
    return "Yeh email ya mobile number pehle se registered hai.";
  }
  if (lowerRaw.includes("user not found") || lowerRaw.includes("account not found")) {
    return "Is mobile/email se koi account nahi mila.";
  }
  if (lowerRaw.includes("inactive") || lowerRaw.includes("banned")) {
    return "Aapka account temporary deactivate hai. Support se sampark karein.";
  }
  if (lowerRaw.includes("credit limit") || lowerRaw.includes("limit exceeded")) {
    return "Customer ki credit limit exceed ho gayi hai. Pehle Purana Udhar Jama karein!";
  }
  if (lowerRaw.includes("insufficient stock") || lowerRaw.includes("out of stock")) {
    return "Yeh saaman stock me nahi hai. Kripya stock update karein!";
  }

  // HTTP Status Code Friendly Fallbacks
  switch (status) {
    case 400:
      return "Dukaan details invalid hain. Kripya ek baar check karke retry karein.";
    case 401:
      return url?.includes("/auth/")
        ? "Incorrect email/mobile or password. Please try again."
        : "Aapka session expire ho gaya hai. Kripya dobara login karein.";
    case 403:
      return "Access denied. Aapke pass is action ki permission nahi hai.";
    case 404:
      return url?.includes("/auth/")
        ? "No account found with these details."
        : "Yeh saaman ya jankari catalog me abhi majood nahi hai.";
    case 409:
      return "Yeh record pehle se majood hai.";
    case 422:
      return "Kuch details invalid hain. Kripya check karke retry karein.";
    case 429:
      return "Tez requests aa rahi hain. 10 second ruk kar retry karein.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "Dukaan system me choti si samasya aayi hai. Kripya 1-tap me retry karein!";
    default:
      return "Dukaan system notice. Kripya ek baar retry karein!";
  }
};

export const normalizeError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<ApiErrorPayload>;
    const status = axiosErr.response?.status ?? 0;
    const data = axiosErr.response?.data;
    const url = `${axiosErr.config?.baseURL || ""}${axiosErr.config?.url || ""}`;

    const isExpected404 = status === 404 && url.includes("/shops/me");
    if (!isExpected404) {
      console.log(
        `[API Error] Status: ${status} | URL: ${url} | Code: ${axiosErr.code} | Message: ${axiosErr.message}`
      );
    }

    const friendlyMessage = formatUserFriendlyMessage(
      status,
      data?.error || data?.code,
      axiosErr.code,
      url
    );

    // Auto-Log Developer Telemetry to 24-Hour Admin Vault
    if (!isExpected404 && status >= 400 && !url.includes("/reports/telemetry-error")) {
      logDeveloperErrorTelemetry(axiosErr, {
        requestPath: url,
        userFriendlyMsg: friendlyMessage,
      });
    }

    return new ApiError(friendlyMessage, status, data?.code, data?.details);
  }

  if (error instanceof Error) {
    console.log(`[App Error]: ${error.message}`);
    const friendlyMessage = isTechnicalJargon(error.message)
      ? "Dukaan system notice. Kripya ek baar retry karein!"
      : error.message;

    logDeveloperErrorTelemetry(error, {
      userFriendlyMsg: friendlyMessage,
    });

    return new ApiError(friendlyMessage, 500);
  }

  return new ApiError("Dukaan system notice. Kripya ek baar retry karein!", 500);
};
