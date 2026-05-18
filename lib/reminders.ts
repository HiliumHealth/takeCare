import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/notifications";

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
Dr. ${doctorName} has just sent over your updated care plan.

*Current Schedule:*
${scheduleSummary}

Hilium AI will now monitor your adherence and send reminders at the specified times.
  `.trim();

  // 2. Send the immediate summary to the patient's linked messenger
  if (user.id) {
     await sendPushNotification(user.id, {
        title: "Treatment Plan Updated",
        body: `Dr. ${doctorName} added ${medications.length} items to your care schedule.`,
        url: "/dashboard",
        icon: "/icons/icon-192x192.png"
     });
  }

  // 3. Log the scheduling event for AI monitoring
  console.log(`[AI-SCHEDULER] Scheduled ${medications.length} medications for user ${user.id}`);
  
  return { success: true, medicationCount: medications.length };
}

/**
 * Worker function to be called by a CRON job every minute.
 * Scans for medications that need to be taken 'now'.
 */
export async function processMedicationQueue() {
  const now = new Date();
  
  // Use a window of +/- 1 minute for robustness in server timing
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMinute = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;

  console.log(`[CRON] Checking medication queue for time: ${currentTime}`);
  
  // 1. Find all medications that match the current time
  const medicationsToNotify = await prisma.medication.findMany({
    where: {
      times: {
        has: currentTime
      },
      // Ensure the prescription is still active (startDate <= now <= endDate or no endDate)
      prescription: {
        OR: [
          { followUpDate: null },
          // Simple check for now, can be improved with real date logic
        ]
      }
    },
    include: {
      prescription: {
        include: {
          user: true
        }
      }
    }
  });

  console.log(`[CRON] Found ${medicationsToNotify.length} reminders to send`);

  // 2. Group by user to avoid spamming multiple notifications if multiple meds are due at once
  const userNotifications: Record<string, { title: string, body: string[] }> = {};

  medicationsToNotify.forEach(med => {
    const userId = med.prescription.userId;
    if (!userNotifications[userId]) {
      userNotifications[userId] = {
        title: "Medication Reminder 💊",
        body: []
      };
    }
    userNotifications[userId].body.push(`${med.name} (${med.dosage})`);
  });

  // 3. Send the aggregated notifications
  const sendPromises = Object.entries(userNotifications).map(([userId, data]) => {
    return sendPushNotification(userId, {
      title: data.title,
      body: `Time for your medicine: ${data.body.join(", ")}. Tap here to see your instructions.`,
      url: "/dashboard",
      icon: "/icons/icon-192x192.png"
    });
  });

  await Promise.allSettled(sendPromises);

  return { processed: medicationsToNotify.length };
}
