import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendPushNotification } from "@/lib/notifications";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log(`[Test Push] Sending test notification to user ${session.user.id}`);
    const result = await sendPushNotification(session.user.id, {
      title: "Test Notification 🚀",
      body: "If you're seeing this, TakeCare push notifications are working perfectly!",
      url: "/dashboard",
      icon: "/icons/icon-192x192.png",
    });

    if (!result || result.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "No active subscriptions found for your account. Please enable notifications first.",
        code: "NO_SUBSCRIPTIONS"
      });
    }

    const failed = result.filter(r => r.status === "rejected");
    if (failed.length === result.length) {
      const errors = failed.map((f: any) => ({
        statusCode: f.reason?.statusCode,
        message: f.reason?.message || f.reason,
      }));
      return NextResponse.json({ 
        success: false, 
        message: "All push attempts failed. Check server logs for details.",
        code: "ALL_FAILED",
        errors: errors
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Test notification sent! (${result.length - failed.length} successful, ${failed.length} failed)`,
      successCount: result.length - failed.length,
      failCount: failed.length
    });
  } catch (error: any) {
    console.error("[Test Push] Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: `Error: ${error.message}`,
      code: "ERROR"
    }, { status: 500 });
  }
}
