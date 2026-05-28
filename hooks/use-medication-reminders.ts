// hooks/use-medication-reminders.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  handleMedicationReminder,
  isSpeechSynthesisSupported,
  initializeSpeechSynthesis,
} from "@/lib/tts-handler";

interface MedicationReminder {
  medicationName: string;
  dosage: string;
  time: string;
  instructions?: string;
  reminderSound: "soft-bell" | "gentle-chime" | "medical-alert" | "voice-only";
}

interface UseMedicationRemindersOptions {
  enabled?: boolean;
  onReminderReceived?: (reminder: MedicationReminder) => void;
  onError?: (error: Error) => void;
}

export function useMedicationReminders(
  options: UseMedicationRemindersOptions = {}
) {
  const {
    enabled = true,
    onReminderReceived,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [soundSupported, setSoundSupported] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [lastReminder, setLastReminder] = useState<MedicationReminder | null>(null);

  // Initialize speech synthesis on mount
  useEffect(() => {
    const init = async () => {
      const voiceSupport = isSpeechSynthesisSupported();
      setVoiceSupported(voiceSupport);
      setSoundSupported(true); // Sound is always supported (Audio API)

      if (voiceSupport) {
        await initializeSpeechSynthesis();
      }
    };

    init();
  }, []);

  // Listen to service worker messages for medication reminders
  useEffect(() => {
    if (!enabled || !isListening) return;

    const handleMessage = async (event: any) => {
      try {
        const { type, data } = event.data;

        if (type === "MEDICATION_REMINDER") {
          console.log("[Medication Reminders] Received reminder:", data);

          const reminder: MedicationReminder = {
            medicationName: data.medicationName,
            dosage: data.dosage,
            time: data.time,
            instructions: data.instructions,
            reminderSound: data.reminderSound || "soft-bell",
          };

          // Play reminder notification
          try {
            await handleMedicationReminder(
              reminder.medicationName,
              reminder.dosage,
              reminder.reminderSound,
              reminder.instructions
            );
          } catch (error) {
            console.error("[Medication Reminders] Error playing reminder:", error);
            onError?.(error instanceof Error ? error : new Error("Failed to play reminder"));
          }

          setLastReminder(reminder);
          onReminderReceived?.(reminder);
        }
      } catch (error) {
        console.error("[Medication Reminders] Error handling message:", error);
        onError?.(error instanceof Error ? error : new Error("Unknown error"));
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleMessage);

      // Mark as listening
      setIsListening(true);

      return () => {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
        setIsListening(false);
      };
    }
  }, [enabled, isListening, onReminderReceived, onError]);

  // Manually play a reminder (for testing)
  const playTestReminder = useCallback(
    async (
      medicationName: string,
      dosage: string,
      reminderSound: MedicationReminder["reminderSound"] = "soft-bell",
      instructions?: string
    ) => {
      try {
        console.log("[Medication Reminders] Playing test reminder...");
        await handleMedicationReminder(
          medicationName,
          dosage,
          reminderSound,
          instructions
        );
      } catch (error) {
        console.error("[Medication Reminders] Test reminder error:", error);
        onError?.(error instanceof Error ? error : new Error("Test reminder failed"));
      }
    },
    [onError]
  );

  return {
    isListening,
    soundSupported,
    voiceSupported,
    lastReminder,
    playTestReminder,
  };
}
