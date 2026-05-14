import webpush from "web-push";
import { prisma } from "./prisma";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (PUBLIC_KEY && PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:admin@hilium.ai",
    PUBLIC_KEY,
    PRIVATE_KEY
  );
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
    return;
  }

  const pushPayload = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh,
        },
      };

      return webpush.sendNotification(pushConfig, pushPayload);
    })
  );

  // Clean up expired subscriptions
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const err = result.reason;
      if (err.statusCode === 404 || err.statusCode === 410) {
        console.log(`[Push] Cleaning up expired subscription: ${subscriptions[index].endpoint}`);
        prisma.pushSubscription.delete({ where: { id: subscriptions[index].id } }).catch(console.error);
      }
    }
  });

  return results;
}
