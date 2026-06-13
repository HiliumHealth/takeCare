import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendPushNotification } from "@/lib/notifications";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {





    const testPayload = {
      title: "Test Notification 🚀",
      body: "If you're seeing this, TakeCare push notifications are working perfectly!",
      url: "/dashboard",
      icon: "/icons/icon-192x192.png",
    };


    const result = await sendPushNotification(session.user.id, testPayload);

    if (!result || result.length === 0) {
      console.error(`[Test Push] ✗ No subscriptions found for user ${session.user.id}`);
      return NextResponse.json({
        success: false,
        message: "No active subscriptions found for your account. Please enable notifications first.",
        code: "NO_SUBSCRIPTIONS",
        debug: {
          userId: session.user.id,
          timestamp: new Date().toISOString(),
        }
      });
    }

    const successful = result.filter(r => r.status === "fulfilled");
    const failed = result.filter(r => r.status === "rejected");






    if (failed.length > 0) {
      console.log(`[Test Push] Failed details:`, failed.map((f: any) => ({
        reason: f.reason?.message || f.reason,
        statusCode: f.reason?.statusCode,
      })));
    }

    if (failed.length === result.length) {
      console.error(`[Test Push] ✗ ALL ${result.length} push attempts failed!`);
      const errors = failed.map((f: any) => ({
        statusCode: f.reason?.statusCode,
        message: f.reason?.message || f.reason,
      }));
      return NextResponse.json({
        success: false,
        message: "All push attempts failed. Check server logs for details.",
        code: "ALL_FAILED",
        errors: errors,
        debug: {
          userId: session.user.id,
          subscriptionCount: result.length,
          timestamp: new Date().toISOString(),
        }
      });
    }




    return NextResponse.json({
      success: true,
      message: `Test notification sent! (${successful.length} successful, ${failed.length} failed)`,
      successCount: successful.length,
      failCount: failed.length,
      debug: {
        userId: session.user.id,
        subscriptionCount: result.length,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error: any) {
    console.error("[Test Push] ✗ EXCEPTION:", error);
    console.error("[Test Push] Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return NextResponse.json({
      success: false,
      message: `Error: ${error.message}`,
      code: "ERROR",
      debug: {
        userId: session.user?.id,
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      }
    }, { status: 500 });
  }
}
