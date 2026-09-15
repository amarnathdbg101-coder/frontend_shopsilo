import { Platform, Vibration } from "react-native";
import * as Speech from "expo-speech";

export type SoundboxTone = "credit" | "payment" | "reversal";

/**
 * Natural Hindi Numbers to Words for crisp, accurate pronunciation on Mobile
 */
export const numberToHindiWords = (num: number): string => {
  const n = Math.round(Number(num) || 0);
  if (n <= 0) return "shunya";
  if (n > 9999999) return `${n.toLocaleString("en-IN")}`;

  const ones = [
    "", "ek", "do", "teen", "chaar", "paanch", "chhe", "saat", "aath", "nau", "das",
    "gyaarah", "baarah", "terah", "chaudah", "pandrah", "solah", "satrah", "athaarah", "unnees", "bees",
    "ikkees", "baayees", "teyees", "chaubees", "pachchees", "chhabbees", "sattaayees", "athaayees", "untees", "tees",
    "iktees", "battees", "taintees", "chauntees", "paintees", "chhattees", "saintees", "adhtees", "untaalees", "chaalees",
    "iktaalees", "byaalees", "taintaalees", "chawaalees", "paintaalees", "chhiyaalees", "saintaalees", "adhtaalees", "unchaas", "pachaas",
    "ikyaawan", "baawan", "tirpan", "chawwan", "pachpan", "chhappan", "sattaawan", "atthaawan", "unsath", "saath",
    "iksath", "baasath", "tirsath", "chaunsath", "painsath", "chhiyaasath", "sadsath", "adsath", "unhattar", "sattar",
    "ikhattar", "bahattar", "tihattar", "chauhattar", "pachhattar", "chhihattar", "satattar", "athattar", "unyoonaasi", "assi",
    "ikyaasi", "bayaasi", "tiraasi", "chauraasi", "pachaasi", "chhiyaasi", "sattaasi", "atthaasi", "nawaasi", "nabbe",
    "ikyaanwe", "baanwe", "tiraanwe", "chauraanwe", "pachaanwe", "chhiyaanwe", "sattaanwe", "atthaanwe", "ninyaanwe", "sau"
  ];

  let words = "";
  let rem = n;

  if (rem >= 100000) {
    const lakh = Math.floor(rem / 100000);
    words += (ones[lakh] || lakh) + " lakh ";
    rem %= 100000;
  }
  if (rem >= 1000) {
    const hazar = Math.floor(rem / 1000);
    words += (ones[hazar] || hazar) + " hazaar ";
    rem %= 1000;
  }
  if (rem >= 100) {
    const sau = Math.floor(rem / 100);
    words += (ones[sau] || sau) + " sau ";
    rem %= 100;
  }
  if (rem > 0) {
    words += ones[rem] || rem;
  }

  return words.trim();
};

/**
 * Soundbox chime & haptic feedback for financial actions
 * Emulates the audio feedback of BharatPe / Paytm soundboxes
 */
export function playSoundboxTone(tone: SoundboxTone = "payment", spokenAmount?: number | null): void {
  // 1. Mobile Vibration pattern
  try {
    if (Platform.OS === "android" || Platform.OS === "ios") {
      if (tone === "payment") {
        Vibration.vibrate([0, 100, 80, 160]);
      } else if (tone === "credit") {
        Vibration.vibrate([0, 120]);
      } else {
        Vibration.vibrate([0, 80, 50, 80]);
      }
    }
  } catch {
    // ignore vibration errors
  }

  // 2. Web Audio tone synthesizer
  try {
    if (typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const now = ctx.currentTime;
        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        if (tone === "payment") {
          // Cheerful C-major payment chord (C5 -> E5 -> G5)
          [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            osc.connect(gain);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.18);
          });
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        } else if (tone === "credit") {
          // Crisp debit / credit note
          const osc = ctx.createOscillator();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(440, now); // A4
          osc.frequency.exponentialRampToValueAtTime(554.37, now + 0.15); // C#5
          osc.connect(gain);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
        } else {
          // Reversal double note
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.setValueAtTime(400, now + 0.12);
          osc.connect(gain);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
        }
      }
    }
  } catch {
    // ignore audio synthesis error
  }

  // 3. Voice Announcement if amount is provided
  if (spokenAmount != null && spokenAmount > 0) {
    speakSoundboxPayment(spokenAmount);
  }
}

/**
 * Mobile Natural Hindi Soundbox Announcement
 */
export function playSoundboxAnnouncement(text: string): void {
  // Play chime
  playSoundboxTone("payment");

  try {
    Speech.stop();
    setTimeout(() => {
      Speech.speak(text, {
        language: "hi-IN",
        pitch: 1.0,
        rate: 0.95,
      });
    }, 250);
  } catch (e) {
    console.warn("[MobileSoundbox] Speech announcement error:", e);
  }
}

export function speakSoundboxPayment(amount: number): void {
  const n = Math.round(Number(amount) || 0);
  const hindiWords = numberToHindiWords(n);
  playSoundboxAnnouncement(`ShopMe Soundbox par ${hindiWords} rupaye prapt hue. Shukriya!`);
}

export function speakKhataTransaction(type: "CREDIT" | "PAYMENT", amount: number, customerName: string = ""): void {
  const n = Math.round(Number(amount) || 0);
  const hindiWords = numberToHindiWords(n);
  const name = customerName ? `${customerName} ` : "Grahak ";

  if (type === "CREDIT") {
    playSoundboxTone("credit");
    playSoundboxAnnouncement(`${name}ke khate me ${hindiWords} rupaye udhar likhe gaye.`);
  } else {
    playSoundboxTone("payment");
    playSoundboxAnnouncement(`${name}se ${hindiWords} rupaye jama prapt hue. Shukriya!`);
  }
}
