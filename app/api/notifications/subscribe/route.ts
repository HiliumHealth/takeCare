import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscription = await req.json();

    // Check if subscription already exists for this endpoint
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint },
    });

    if (existing) {
      // Update userId if it changed (e.g. user logged in on a device previously used by guest)
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: { userId: session.user.id },
      });
    } else {
      // Create new subscription
      await prisma.pushSubscription.create({
        data: {
          userId: session.user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Push API] Subscribe error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
