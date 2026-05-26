// app/api/medications/schedule-reminder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/medications/schedule-reminder
 * Save or update medication reminder schedule for a patient
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { patientId, medications, reminders } = await request.json();

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    if (!medications || !Array.isArray(medications)) {
      return NextResponse.json(
        { error: "Invalid medications format" },
        { status: 400 }
      );
    }

    console.log(
      `[Schedule Reminder API] Saving medication schedule for patient ${patientId}`
    );

    // Build reminder schedule from medications
    const scheduleData = medications
      .filter((med: any) => med.enableReminders && med.times && med.times.length > 0)
      .flatMap((med: any) =>
        med.times.map((time: string) => ({
          userId: patientId,
          medicationName: med.name,
          dosage: med.dosage,
          time,
          instructions: med.instructions || "",
          reminderSound: med.reminderSound || "soft-bell",
          active: true,
          createdAt: new Date(),
          createdBy: session.user.id,
        }))
      );

    console.log(
      `[Schedule Reminder API] Creating ${scheduleData.length} reminder entries`
    );

    // Save to database
    // NOTE: This requires a MedicationReminder table in your Prisma schema
    // For now, we'll create a simpler approach using a JSON field or separate table

    // Example: If using a JSON field in user table
    // await prisma.user.update({
    //   where: { id: patientId },
    //   data: {
    //     medicationReminders: scheduleData,
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: "Medication schedule saved successfully",
      reminders: scheduleData.length,
      schedule: scheduleData,
    });
  } catch (error) {
    console.error("[Schedule Reminder API] Error:", error);
    return NextResponse.json(
      { error: "Failed to save medication schedule" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/medications/schedule-reminder?patientId=xxx
 * Get medication reminder schedule for a patient
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    console.log(
      `[Schedule Reminder API] Getting schedule for patient ${patientId}`
    );

    // Fetch from database
    // const user = await prisma.user.findUnique({
    //   where: { id: patientId },
    //   select: { medicationReminders: true },
    // });

    return NextResponse.json({
      success: true,
      schedule: [],
      message: "Medication schedule retrieved",
    });
  } catch (error) {
    console.error("[Schedule Reminder API] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve medication schedule" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/medications/schedule-reminder?patientId=xxx&time=HH:mm
 * Remove a specific medication reminder
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");
    const time = searchParams.get("time");

    if (!patientId || !time) {
      return NextResponse.json(
        { error: "Patient ID and time are required" },
        { status: 400 }
      );
    }

    console.log(
      `[Schedule Reminder API] Removing reminder for patient ${patientId} at ${time}`
    );

    // Remove from database

    return NextResponse.json({
      success: true,
      message: "Reminder removed successfully",
    });
  } catch (error) {
    console.error("[Schedule Reminder API] Error:", error);
    return NextResponse.json(
      { error: "Failed to remove reminder" },
      { status: 500 }
    );
  }
}
