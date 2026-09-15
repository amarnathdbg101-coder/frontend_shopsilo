import { Platform, Vibration } from "react-native";

export type SoundboxTone = "credit" | "payment" | "reversal";

/**
 * Soundbox chime & haptic feedback for financial actions
 * Emulates the audio feedback of BharatPe / Paytm soundboxes
 */
export function playSoundboxTone(tone: SoundboxTone = "payment"): void {
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
}
