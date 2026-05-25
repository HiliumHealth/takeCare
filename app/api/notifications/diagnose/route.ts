import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all subscriptions for this user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id },
    });

    // Check for missing VAPID keys
    const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

    const diagnostics = {
      userId: session.user.id,
      subscriptionCount: subscriptions.length,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint.substring(0, 50) + '...',
        endpointLength: sub.endpoint.length,
        authLength: sub.auth.length,
        p256dhLength: sub.p256dh.length,
        createdAt: sub.createdAt,
      })),
      vapidConfig: {
        PUBLIC_KEY_PRESENT: !!PUBLIC_KEY,
        PRIVATE_KEY_PRESENT: !!PRIVATE_KEY,
        PUBLIC_KEY_LENGTH: PUBLIC_KEY?.length || 0,
      },
      issues: [] as string[],
      recommendations: [] as string[],
    };

    // Validate subscriptions
    if (subscriptions.length === 0) {
      diagnostics.issues.push("No push subscriptions found");
      diagnostics.recommendations.push("1. Click 'Get Mobile Alerts' to enable notifications");
      diagnostics.recommendations.push("2. Grant notification permission in the browser popup");
    } else {
      subscriptions.forEach((sub, idx) => {
        if (!sub.endpoint || sub.endpoint.length === 0) {
          diagnostics.issues.push(`Subscription ${idx} has empty endpoint`);
        }
        if (!sub.auth || sub.auth.length === 0) {
          diagnostics.issues.push(`Subscription ${idx} has empty auth key`);
        }
        if (!sub.p256dh || sub.p256dh.length === 0) {
          diagnostics.issues.push(`Subscription ${idx} has empty p256dh key`);
        }
      });
    }

    // Check VAPID keys
    if (!PUBLIC_KEY) {
      diagnostics.issues.push("PUBLIC_KEY missing in environment");
    }
    if (!PRIVATE_KEY) {
      diagnostics.issues.push("PRIVATE_KEY missing in environment");
    }

    if (diagnostics.issues.length === 0) {
      diagnostics.recommendations.push("✓ Push notification configuration looks good!");
      diagnostics.recommendations.push("If notifications still aren't showing:");
      diagnostics.recommendations.push("1. Check browser notification permissions (browser settings)");
      diagnostics.recommendations.push("2. Check OS notification settings");
      diagnostics.recommendations.push("3. Ensure service worker is registered (check DevTools)");
      diagnostics.recommendations.push("4. Check browser console for errors");
    }

    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error: any) {
    console.error("[Push Diagnose] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
