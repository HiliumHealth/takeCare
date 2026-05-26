// lib/tts-handler.ts
// Text-to-Speech handler for medication reminders
// Supports both browser native API and server-side generation

/**
 * Supported voices and languages
 */
export const TTS_VOICES = {
  "soft-bell": {
    label: "Soft Bell",
    type: "sound",
    description: "Gentle bell chime notification",
  },
  "gentle-chime": {
    label: "Gentle Chime",
    type: "sound",
    description: "Soft musical chime",
  },
  "medical-alert": {
    label: "Medical Alert",
    type: "sound",
    description: "Professional medical alert tone",
  },
  "voice-only": {
    label: "Voice Only",
    type: "voice",
    description: "Spoken reminder (text-to-speech)",
  },
} as const;

/**
 * Generate medication reminder voice message
 * Client-side using Web Speech API
 */
export function generateVoiceReminder(
  medicationName: string,
  dosage: string,
  instructions?: string
): string {
  let message = `It's time to take your medication. `;
  message += `Take ${medicationName}, ${dosage}. `;

  if (instructions) {
    message += `${instructions}. `;
  }

  message += `Remember to take it with water.`;
  return message;
}

/**
 * Speak reminder using Web Speech API (browser native)
 * IMPORTANT: Only works in browsers that support Web Speech API
 */
export async function speakReminder(
  medicationName: string,
  dosage: string,
  instructions?: string
): Promise<void> {
  if (!("speechSynthesis" in window)) {
    console.warn(
      "[TTS Handler] Web Speech API not supported in this browser"
    );
    return;
  }

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const message = generateVoiceReminder(medicationName, dosage, instructions);
    const utterance = new SpeechSynthesisUtterance(message);

    // Configure utterance
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to use female voice (softer tone)
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(
      (v) => v.name.includes("female") || v.name.includes("woman")
    ) || voices[0];

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    await new Promise<void>((resolve, reject) => {
      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error("Speech synthesis failed"));
      window.speechSynthesis.speak(utterance);
    });
  } catch (error) {
    console.error("[TTS Handler] Error speaking reminder:", error);
  }
}

/**
 * Play audio file from URL
 */
export async function playAudio(url: string): Promise<void> {
  try {
    const audio = new Audio(url);
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Audio playback failed"));
      audio.play();
    });
  } catch (error) {
    console.error("[TTS Handler] Error playing audio:", error);
  }
}

/**
 * Play reminder notification sound
 */
export async function playReminderSound(
  sound: "soft-bell" | "gentle-chime" | "medical-alert" | "voice-only"
): Promise<void> {
  const soundMap: Record<string, string> = {
    "soft-bell": "/sounds/soft-bell.mp3",
    "gentle-chime": "/sounds/gentle-chime.mp3",
    "medical-alert": "/sounds/medical-alert.mp3",
    "voice-only": "", // No sound, just voice
  };

  const audioUrl = soundMap[sound];
  if (audioUrl) {
    await playAudio(audioUrl);
  }
}

/**
 * Handle full medication reminder (sound + optional voice)
 */
export async function handleMedicationReminder(
  medicationName: string,
  dosage: string,
  reminderSound: "soft-bell" | "gentle-chime" | "medical-alert" | "voice-only" = "soft-bell",
  instructions?: string
): Promise<void> {
  try {
    // Play notification sound
    if (reminderSound !== "voice-only") {
      await playReminderSound(reminderSound);
    }

    // If voice-only or voice + sound, speak the message
    if (reminderSound === "voice-only" || reminderSound !== "soft-bell") {
      // Small delay between sound and voice
      if (reminderSound !== "voice-only") {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      await speakReminder(medicationName, dosage, instructions);
    }
  } catch (error) {
    console.error("[TTS Handler] Error handling reminder:", error);
  }
}

/**
 * Get available voices from browser
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!("speechSynthesis" in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

/**
 * Check if browser supports Web Speech API
 */
export function isSpeechSynthesisSupported(): boolean {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

/**
 * Initialize speech synthesis (load voices)
 */
export async function initializeSpeechSynthesis(): Promise<void> {
  if (!isSpeechSynthesisSupported()) {
    return;
  }

  return new Promise<void>((resolve) => {
    if (window.speechSynthesis.getVoices().length > 0) {
      resolve();
      return;
    }

    // Wait for voices to load
    window.speechSynthesis.onvoiceschanged = () => {
      resolve();
    };

    // Timeout after 2 seconds
    setTimeout(resolve, 2000);
  });
}
