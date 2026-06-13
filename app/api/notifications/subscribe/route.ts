import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Step 1: Authenticate user
    const session = await auth();
    if (!session?.user?.id) {

      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }



    // Step 2: Parse subscription from request
    let subscription;
    try {
      subscription = await req.json();
      console.log("[Push Subscribe] Parsed subscription:", {
        endpoint: subscription.endpoint?.substring(0, 50) + "...",
        hasAuth: !!subscription.keys?.auth,
        hasP256dh: !!subscription.keys?.p256dh,
      });
    } catch (parseError) {
      console.error("[Push Subscribe] Failed to parse JSON:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Step 3: Validate subscription data
    if (!subscription.endpoint || !subscription.keys?.auth || !subscription.keys?.p256dh) {
      console.error("[Push Subscribe] Missing required fields");
      return NextResponse.json(
        {
          error: "Missing required fields: endpoint, keys.auth, keys.p256dh",
        },
        { status: 400 }
      );
    }

    // Step 4: Check if subscription already exists

    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint },
    });

    if (existing) {

      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: { userId: session.user.id },
      });

    } else {
      // Step 5: Create new subscription

      await prisma.pushSubscription.create({
        data: {
          userId: session.user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });

    }

    // Step 6: Send success response
    const response = { success: true };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[Push Subscribe] ✗ Unexpected error:", error);
    console.error("[Push Subscribe] Error type:", error instanceof Error ? error.message : String(error));
    console.error("[Push Subscribe] Error stack:", error instanceof Error ? error.stack : "No stack");

    // Return a proper error response
    return NextResponse.json(
      {
        error: "Internal server error - Failed to save subscription",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
