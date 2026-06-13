// app/api/medications/send-reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkAndSendDueReminders } from "@/lib/medication-scheduler";

/**
 * POST /api/medications/send-reminders
 * Cron endpoint to check and send due medication reminders
 * 
 * Call this every minute from a cron service like:
 * - AWS EventBridge (CloudWatch)
 * - GitHub Actions
 * - Vercel Cron
 * - External service (e.g., EasyCron, cron-job.org)
 * 
 * Example cron expression (every minute):
 * * * * * *
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      console.warn("[Send Reminders Cron] Unauthorized cron request");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }



    // Execute the reminder sending logic
    await checkAndSendDueReminders();

    return NextResponse.json({
      success: true,
      message: "Medication reminders processed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Send Reminders Cron] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process medication reminders",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/medications/send-reminders/status
 * Health check endpoint for cron job
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "healthy",
    service: "medication-reminder-cron",
    timestamp: new Date().toISOString(),
    lastCheck: process.env.LAST_CRON_CHECK || "never",
  });
}
