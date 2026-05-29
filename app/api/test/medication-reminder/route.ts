import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/notifications";
import { processMedicationQueue } from "@/lib/reminders";

/**
 * Test endpoint to trigger medication reminders
 * GET /api/test/medication-reminder?userId=XXX&action=send-test
 * GET /api/test/medication-reminder?action=process-queue
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const userId = url.searchParams.get("userId");

    // Test 1: Send a test notification to a specific user
    if (action === "send-test" && userId) {
      console.log(`[TEST] Sending test notification to user: ${userId}`);
      
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const result = await sendPushNotification(userId, {
        title: "🧪 Test Notification",
        body: "This is a test push notification. If you see this, push notifications are working! ✅",
        icon: "/icons/icon-192x192.png",
        url: "/dashboard"
      });

      return NextResponse.json({
        success: true,
        message: "Test notification sent",
        userId,
        user: { name: user.name, email: user.email },
        result
      });
    }

    // Test 2: Process medication queue (CRON job)
    if (action === "process-queue") {
      console.log("[TEST] Processing medication queue");
      
      const result = await processMedicationQueue();
      
      return NextResponse.json({
        success: true,
        message: "Medication queue processed",
        result,
        timestamp: new Date().toISOString()
      });
    }

    // Test 3: Create a test medication reminder for NOW and trigger immediately
    if (action === "create-test-reminder" && userId) {
      console.log(`[TEST] Creating test reminder for user: ${userId}`);
      
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Create a prescription with a medication scheduled for right now
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      
      console.log(`[TEST] Current time: ${currentTime}`);

      // Create prescription
      const prescription = await prisma.prescription.create({
        data: {
          userId,
          doctorName: "Test Doctor",
          diagnosis: "Test Condition",
          notes: "This is a test prescription",
          medications: {
            create: {
              name: "Test Medication",
              dosage: "100mg",
              frequency: "Custom",
              times: [currentTime],
              instructions: "Take with water",
              enableReminders: true,
              reminderSound: "soft-bell"
            }
          }
        },
        include: { medications: true }
      });

      console.log(`[TEST] Created test prescription:`, prescription);

      // Now trigger the medication queue to send the reminder
      console.log(`[TEST] Triggering medication queue to send reminder...`);
      const queueResult = await processMedicationQueue();

      return NextResponse.json({
        success: true,
        message: "Test reminder created and triggered",
        prescription: {
          id: prescription.id,
          doctorName: prescription.doctorName,
          medications: prescription.medications.map(m => ({
            name: m.name,
            dosage: m.dosage,
            times: m.times
          }))
        },
        currentTime,
        queueResult
      });
    }

    // Test 4: List all medications due now
    if (action === "list-due-medications") {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      console.log(`[TEST] Finding medications due at ${currentTime}`);

      const medications = await prisma.medication.findMany({
        where: {
          times: {
            has: currentTime
          }
        },
        include: {
          prescription: {
            include: {
              user: { select: { id: true, name: true, email: true } }
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: `Found ${medications.length} medications due at ${currentTime}`,
        currentTime,
        medications: medications.map(m => ({
          name: m.name,
          dosage: m.dosage,
          times: m.times,
          doctorName: m.prescription.doctorName,
          user: m.prescription.user.name
        }))
      });
    }

    return NextResponse.json(
      {
        error: "Invalid action",
        availableActions: [
          "send-test?userId=XXX - Send test notification to user",
          "process-queue - Process medication queue for all users",
          "create-test-reminder?userId=XXX - Create and trigger test reminder",
          "list-due-medications - List all medications due now"
        ]
      },
      { status: 400 }
    );

  } catch (error) {
    console.error("[TEST] Error:", error);
    return NextResponse.json(
      { error: "Test failed", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
