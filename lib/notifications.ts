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
  console.log(`\n[Push Send] ============================================`);
  console.log(`[Push Send] Fetching subscriptions for user: ${userId}`);
  
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  console.log(`[Push Send] Found ${subscriptions.length} subscription(s)`);

  if (subscriptions.length === 0) {
    console.log(`[Push Send] ✗ No subscriptions found for user ${userId}`);
    console.log(`[Push Send] ============================================\n`);
    return [];
  }

  const pushPayload = JSON.stringify(payload);
  console.log(`[Push Send] Payload to send:`, payload);

  const results = await Promise.allSettled(
    subscriptions.map(async (sub, idx) => {
      console.log(`\n[Push Send] [${idx + 1}/${subscriptions.length}] Processing subscription...`);
      
      // Validate subscription data before attempting to send
      if (!isValidSubscription(sub)) {
        console.warn(`[Push Send] ✗ Skipping invalid subscription ${sub.id}`);
        // Clean up invalid subscription
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(err => {
          console.error(`[Push Send] Failed to delete invalid subscription:`, err.message);
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
        console.log(`[Push Send] Endpoint: ${sub.endpoint.substring(0, 40)}...`);
        console.log(`[Push Send] Auth key length: ${sub.auth.length}`);
        console.log(`[Push Send] P256dh key length: ${sub.p256dh.length}`);
        console.log(`[Push Send] Calling webpush.sendNotification()...`);
        
        const sendResult = await webpush.sendNotification(pushConfig, pushPayload);
        
        console.log(`[Push Send] ✓ webpush returned successfully`);
        console.log(`[Push Send] Response:`, sendResult);
        
        return sendResult;
      } catch (error: any) {
        console.error(`[Push Send] ✗ webpush.sendNotification() threw error:`, {
          statusCode: error.statusCode,
          message: error.message,
          body: error.body,
          endpoint: sub.endpoint.substring(0, 40),
        });
        throw error;
      }
    })
  );

  // Process results
  console.log(`\n[Push Send] ============ RESULTS SUMMARY ============`);
  const successful = results.filter(r => r.status === "fulfilled");
  const failed = results.filter(r => r.status === "rejected");
  
  console.log(`[Push Send] ✓ Successful: ${successful.length}`);
  console.log(`[Push Send] ✗ Failed: ${failed.length}`);

  // Clean up expired or unauthorized subscriptions
  results.forEach(async (result, index) => {
    if (result.status === "rejected") {
      const err = result.reason;
      const sub = subscriptions[index];
      const statusCode = err?.statusCode;
      console.error(`[Push Send] Result[${index}]: REJECTED - ${err.message || err}`);
      
      // Remove invalid subscriptions (404, 410, 400, 401, 403)
      if ([404, 410, 400, 401, 403].includes(statusCode)) {
        console.log(`[Push Send] Cleaning up invalid subscription (Status: ${statusCode})`);
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(console.error);
      }
    } else {
      console.log(`[Push Send] Result[${index}]: SUCCESS`);
    }
  });

  console.log(`[Push Send] ============================================\n`);
  return results;
}
