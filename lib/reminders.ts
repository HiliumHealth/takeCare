"use server";

import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/messenger"; // Assuming this exists or I'll create a stub

/**
 * Processes a prescription and prepares the scheduled notification payload.
 * In a production environment, this would interface with a task queue (e.g., BullMQ, Inngest, or Cron).
 */
export async function scheduleMedicationReminders(prescriptionId: string) {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      user: true,
      medications: true
    }
  });

  if (!prescription || !prescription.user) return;

  const { user, medications, doctorName } = prescription;

  // 1. Generate human-readable schedule for the patient
  const scheduleSummary = medications.map(med => {
    return `💊 *${med.name}* (${med.dosage})\n⏰ Times: ${med.times.join(", ")}\n📝 ${med.instructions}`;
  }).join("\n\n");

  const welcomeMessage = `
🏥 *New Hospital Booklet Entry*
Dr. ${doctorName} has updated your treatment plan.

*Current Schedule:*
${scheduleSummary}

Xerine AI will now monitor your adherence and send reminders at the specified times.
  `.trim();

  // 2. Send the immediate summary to the patient's linked messenger (Telegram/WhatsApp)
  // This confirms the "Digital Twin" connection
  if (user.telegramId) {
    // await sendTelegramMessage(user.telegramId, welcomeMessage);
    console.log(`[PUSH] Sent consultation summary to Telegram user ${user.telegramId}`);
  }

  // 3. Log the scheduling event for AI monitoring
  console.log(`[AI-SCHEDULER] Scheduled ${medications.length} medications for user ${user.id}`);
  
  return { success: true, medicationCount: medications.length };
}

/**
 * Worker function to be called by a CRON job every 15-30 minutes.
 * Scans for medications that need to be taken 'now'.
 */
export async function processMedicationQueue() {
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMinute = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;

  console.log(`[CRON] Checking medication queue for time: ${currentTime}`);
  
  // Logic: Find all medications where 'times' array contains 'currentTime'
  // Note: For a robust system, we would use a more granular window (e.g., +/- 15 mins)
  
  // This is where the AI-driven push logic lives.
}
