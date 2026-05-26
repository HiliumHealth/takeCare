// lib/medication-scheduler.ts
// Server-side medication scheduling and reminder logic

import { prisma } from "@/lib/prisma";
import { webpush } from "web-push";

interface MedicationReminder {
  medicationName: string;
  dosage: string;
  time: string; // HH:mm format
  instructions?: string;
}

interface ScheduleJob {
  userId: string;
  reminders: MedicationReminder[];
  enableReminders: boolean;
}

/**
 * Parse time string (HH:mm) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Format minutes since midnight to HH:mm
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Get all medication reminders for a user scheduled for a specific time
 */
export async function getRemindersForTime(
  userId: string,
  time: string
): Promise<MedicationReminder[]> {
  try {
    // Query database for medications scheduled at this time
    // This would need a MedicationSchedule table in your Prisma schema
    // For now, returning example structure
    return [];
  } catch (error) {
    console.error("[Medication Scheduler] Error getting reminders:", error);
    return [];
  }
}

/**
 * Send medication reminder notification to patient
 */
export async function sendMedicationReminder(
  userId: string,
  reminders: MedicationReminder[],
  reminderSound: "soft-bell" | "gentle-chime" | "medical-alert" | "voice-only" = "soft-bell"
): Promise<boolean> {
  try {
    // Get user's push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      console.log(
        "[Medication Reminder] No subscriptions found for user:",
        userId
      );
      return false;
    }

    // Build notification payload
    const medicationText = reminders
      .map((r) => `${r.medicationName} (${r.dosage})`)
      .join(", ");

    const notificationPayload = {
      title: "Time for Your Medication 💊",
      body: `Take: ${medicationText}`,
      icon: "/icons/medication-192.png",
      badge: "/icons/badge-72.png",
      tag: "medication-reminder",
      requireInteraction: true,
      data: {
        type: "medication-reminder",
        reminders: JSON.stringify(reminders),
        sound: reminderSound,
        timestamp: new Date().toISOString(),
      },
    };

    // Send to all subscriptions
    let sentCount = 0;
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              auth: subscription.auth,
              p256dh: subscription.p256dh,
            },
          },
          JSON.stringify(notificationPayload)
        );
        sentCount++;
      } catch (error: any) {
        console.error(
          "[Medication Reminder] Error sending to subscription:",
          error.message
        );
        // If subscription is invalid, remove it
        if (error.statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { endpoint: subscription.endpoint },
          });
        }
      }
    }

    console.log(
      `[Medication Reminder] Sent ${sentCount}/${subscriptions.length} reminders to user ${userId}`
    );
    return sentCount > 0;
  } catch (error) {
    console.error("[Medication Reminder] Error sending reminder:", error);
    return false;
  }
}

/**
 * Check if current time matches any medication schedules
 * Call this from a cron job every minute
 */
export async function checkAndSendDueReminders(): Promise<void> {
  try {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    console.log(
      `[Medication Reminder Cron] Checking for reminders at ${currentTime}`
    );

    // This would query your MedicationSchedule table
    // and send reminders to all users with medications due at currentTime
    // Placeholder for now
  } catch (error) {
    console.error("[Medication Reminder Cron] Error:", error);
  }
}

/**
 * Calculate next reminder time for a medication
 */
export function getNextReminderTime(times: string[]): string | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Convert times to minutes
  const reminderTimes = times.map((t) => timeToMinutes(t)).sort((a, b) => a - b);

  // Find next reminder today
  const nextToday = reminderTimes.find((m) => m > currentMinutes);
  if (nextToday) {
    return minutesToTime(nextToday);
  }

  // If no reminder today, return first one tomorrow
  return reminderTimes.length > 0 ? minutesToTime(reminderTimes[0]) : null;
}
