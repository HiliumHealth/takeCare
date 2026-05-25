import webpush from "web-push";
import { prisma } from "./prisma";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@hilium.ai";

if (PUBLIC_KEY && PRIVATE_KEY) {
  console.log("[Push] VAPID keys detected, configuring web-push");
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    PUBLIC_KEY,
    PRIVATE_KEY
  );
} else {
  console.warn("[Push] VAPID keys missing! Push notifications will not work.");
  console.log("[Push] PUBLIC_KEY:", PUBLIC_KEY ? "Present" : "Missing");
  console.log("[Push] PRIVATE_KEY:", PRIVATE_KEY ? "Present" : "Missing");
}

// Validate subscription format
function isValidSubscription(sub: any): boolean {
  if (!sub.endpoint || typeof sub.endpoint !== 'string') {
    console.warn('[Push] Invalid endpoint:', sub.endpoint);
    return false;
  }
  if (!sub.auth || typeof sub.auth !== 'string' || sub.auth.length === 0) {
    console.warn('[Push] Invalid auth key for', sub.endpoint);
    return false;
  }
  if (!sub.p256dh || typeof sub.p256dh !== 'string' || sub.p256dh.length === 0) {
    console.warn('[Push] Invalid p256dh key for', sub.endpoint);
    return false;
  }
  return true;
}

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; icon?: string; url?: string }
) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    console.log(`[Push] No subscriptions found for user ${userId}`);
    return [];
  }

  console.log(`[Push] Found ${subscriptions.length} subscriptions for user ${userId}`);

  const pushPayload = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      // Validate subscription data before attempting to send
      if (!isValidSubscription(sub)) {
        console.warn(`[Push] Skipping invalid subscription ${sub.id}`);
        // Clean up invalid subscription
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(err => {
          console.error(`[Push] Failed to delete invalid subscription:`, err.message);
        });
        throw new Error('Invalid subscription format');
      }

      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh,
        },
      };

      try {
        console.log(`[Push] Sending to ${sub.endpoint.substring(0, 50)}...`);
        return await webpush.sendNotification(pushConfig, pushPayload);
      } catch (error: any) {
        console.error(`[Push] Error sending to ${sub.endpoint}:`, {
          statusCode: error.statusCode,
          message: error.message,
          body: error.body,
        });
        throw error;
      }
    })
  );

  // Clean up expired or unauthorized subscriptions
  results.forEach(async (result, index) => {
    if (result.status === "rejected") {
      const err = result.reason;
      const sub = subscriptions[index];
      const statusCode = err?.statusCode;
      console.error(`[Push] Failed to send to subscription ${sub.id}:`, err.message || err);
      
      // Remove invalid subscriptions (404, 410, 400, 401, 403)
      if ([404, 410, 400, 401, 403].includes(statusCode)) {
        console.log(`[Push] Cleaning up invalid subscription: ${sub.endpoint} (Status: ${statusCode})`);
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(console.error);
      }
    }
  });

  return results;
}
