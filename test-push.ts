import webpush from "web-push";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@hilium.ai";

async function main() {
  if (PUBLIC_KEY && PRIVATE_KEY) {
    console.log("[Push] VAPID keys detected, configuring web-push");
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      PUBLIC_KEY,
      PRIVATE_KEY
    );
  } else {
    console.log("Missing keys!");
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany();
  console.log(`Found ${subscriptions.length} subscriptions`);

  for (const sub of subscriptions) {
    const pushConfig = {
      endpoint: sub.endpoint,
      keys: {
        auth: sub.auth,
        p256dh: sub.p256dh,
      },
    };
    
    try {
      console.log(`Testing subscription: ${sub.endpoint.substring(0, 50)}...`);
      await webpush.sendNotification(pushConfig, JSON.stringify({ title: "Test", body: "Test from script" }));
      console.log("Success!");
    } catch (err: any) {
      console.error("Failed:", err.message, err.statusCode, err.body);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
