import { Storage } from "@/utils/storage";

export const ADMIN_CONFIG = {
  PHONE: process.env.EXPO_PUBLIC_ADMIN_PHONE?.trim() || "7979014637",
  EMAIL: process.env.EXPO_PUBLIC_ADMIN_EMAIL?.trim() || "amarnathdbg101@gmail.com",
  MASTER_OTP: process.env.EXPO_PUBLIC_ADMIN_INVITE_OTP?.trim() || "nothing@",
};

interface StoredOTPRequest {
  otp: string;
  generatedAt: number;
}

const STORAGE_KEY_PREFIX_REQ = "shopsilo_shop_reg_req_";
const STORAGE_KEY_PREFIX_UNLOCKED = "shopsilo_shop_reg_unlocked_";
const OTP_VALIDITY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Generates a secure 6-digit dynamic OTP for a user requesting to register a shop.
 * Stored locally with 30-minute validity.
 */
export async function generateShopRegistrationOTP(userId: string): Promise<string> {
  const rawNum = Math.floor(100000 + Math.random() * 900000);
  const otp = rawNum.toString();

  const data: StoredOTPRequest = {
    otp,
    generatedAt: Date.now(),
  };

  await Storage.setItem(`${STORAGE_KEY_PREFIX_REQ}${userId}`, data);
  return otp;
}

/**
 * GENIUS SECURITY FIX:
 * Formats pre-filled WhatsApp request link WITHOUT leaking the secret OTP/PIN in the message text!
 */
export function buildAdminWhatsAppUrl(
  otp: string,
  user: { full_name?: string; phone?: string; email?: string } | null
): string {
  const applicantName = user?.full_name?.trim() || "Applicant";
  const applicantPhone = user?.phone?.trim() || "Not provided";
  const applicantEmail = user?.email?.trim() || "Not provided";
  const requestHash = `REQ-${Math.floor(10000 + Math.random() * 90000)}`;

  const message =
    `*ShopSilo Shop Registration Access Request*\n\n` +
    `Namaste Super-Admin! 🙏\n\n` +
    `Main ShopSilo par apni nayi dukaan register karna chahta/chahti hoon.\n\n` +
    `👤 *Applicant:* ${applicantName}\n` +
    `📱 *Phone:* ${applicantPhone}\n` +
    `✉️ *Email:* ${applicantEmail}\n` +
    `🔖 *Request Reference:* ${requestHash}\n\n` +
    `_Kripya meri dukaan verify karke 6-digit access code mujhe send kijiye. Dhanyawad!_`;

  return `https://wa.me/91${ADMIN_CONFIG.PHONE}?text=${encodeURIComponent(message)}`;
}

/**
 * Formats mailto link to Admin
 */
export function buildAdminEmailUrl(
  otp: string,
  user: { full_name?: string; phone?: string; email?: string } | null
): string {
  const applicantName = user?.full_name?.trim() || "Applicant";
  const applicantPhone = user?.phone?.trim() || "Not provided";
  const applicantEmail = user?.email?.trim() || "Not provided";

  const subject = `[ShopSilo] Shop Registration Access Request - ${applicantName}`;
  const body =
    `Hello Admin,\n\n` +
    `A new merchant wants to open a shop on ShopSilo.\n\n` +
    `Applicant Name: ${applicantName}\n` +
    `Phone: ${applicantPhone}\n` +
    `Email: ${applicantEmail}\n\n` +
    `If approved, please share a 6-digit access code with the applicant to unlock their shop registration.`;

  return `mailto:${ADMIN_CONFIG.EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Verifies entered OTP against dynamic request OTP or Admin Master Passcode
 */
export async function verifyShopRegistrationOTP(
  inputOtp: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const cleanInput = inputOtp.trim();

  if (!cleanInput || cleanInput.length < 6) {
    return { success: false, message: "Please enter a valid 6-digit access code." };
  }

  // 1. Check Admin Master OTP
  if (cleanInput === ADMIN_CONFIG.MASTER_OTP) {
    await Storage.setItem(`${STORAGE_KEY_PREFIX_UNLOCKED}${userId}`, true);
    return { success: true, message: "Authorized via Master Passcode! Shop registration unlocked." };
  }

  // 2. Check dynamic generated OTP
  const savedReq = await Storage.getItem<StoredOTPRequest>(`${STORAGE_KEY_PREFIX_REQ}${userId}`);
  if (!savedReq) {
    return {
      success: false,
      message: "No active access code request found. Please tap 'Request Access Code via WhatsApp' first.",
    };
  }

  if (Date.now() - savedReq.generatedAt > OTP_VALIDITY_MS) {
    return {
      success: false,
      message: "This access code request has expired. Please generate a fresh request.",
    };
  }

  if (savedReq.otp !== cleanInput) {
    return {
      success: false,
      message: "Incorrect access code. Please contact Admin or check the code provided.",
    };
  }

  // Mark as permanently unlocked for this session/user
  await Storage.setItem(`${STORAGE_KEY_PREFIX_UNLOCKED}${userId}`, true);
  return { success: true, message: "Access Code verified successfully! Shop registration unlocked." };
}

/**
 * Checks if this user has already unlocked shop registration
 */
export async function isShopRegistrationUnlocked(userId: string): Promise<boolean> {
  const unlocked = await Storage.getItem<boolean>(`${STORAGE_KEY_PREFIX_UNLOCKED}${userId}`);
  return !!unlocked;
}

/**
 * Manually set unlock state
 */
export async function setShopRegistrationUnlocked(userId: string, unlocked: boolean): Promise<void> {
  if (unlocked) {
    await Storage.setItem(`${STORAGE_KEY_PREFIX_UNLOCKED}${userId}`, true);
  } else {
    await Storage.removeItem(`${STORAGE_KEY_PREFIX_UNLOCKED}${userId}`);
  }
}
