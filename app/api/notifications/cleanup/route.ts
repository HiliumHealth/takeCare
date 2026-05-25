import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log(`[Push Cleanup] Cleaning up invalid subscriptions for user ${session.user.id}`);
    
    // Delete all subscriptions for this user
    const result = await prisma.pushSubscription.deleteMany({
      where: { userId: session.user.id },
    });

    console.log(`[Push Cleanup] Deleted ${result.count} subscriptions for user ${session.user.id}`);

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${result.count} subscription(s). Please re-enable notifications.`,
      deletedCount: result.count
    });
  } catch (error: any) {
    console.error("[Push Cleanup] Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: `Error: ${error.message}` 
    }, { status: 500 });
  }
}
