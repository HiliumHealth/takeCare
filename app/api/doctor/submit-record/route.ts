import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReportNotificationEmail } from "@/lib/mail";
import { scheduleMedicationReminders } from "@/lib/reminders";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const inviteId = formData.get("inviteId") as string;
    const diagnosis = formData.get("diagnosis") as string;
    const notes = formData.get("notes") as string;
    const medicationsJson = formData.get("medications") as string;
    const labRequestsJson = formData.get("labRequests") as string;
    const lifestyleJson = formData.get("lifestyle") as string;
    const vitalTargetsJson = formData.get("vitalTargets") as string;
    const vitalsJson = formData.get("vitals") as string;
    const followUpDate = formData.get("followUpDate") as string;

    const medications = JSON.parse(medicationsJson || "[]");
    const labRequests = JSON.parse(labRequestsJson || "[]");
    const lifestyle = JSON.parse(lifestyleJson || "{}");
    const vitalTargets = JSON.parse(vitalTargetsJson || "[]");
    const vitals = JSON.parse(vitalsJson || "{}");
    const files = formData.getAll("files") as File[];

    if (!inviteId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const invitation = await prisma.doctorInvitation.findUnique({
      where: { id: inviteId },
      include: { user: true }
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invalid invitation" }, { status: 401 });
    }

    // Create the structured Prescription record
    const prescription = await prisma.prescription.create({
      data: {
        userId: invitation.userId,
        doctorName: invitation.doctorName,
        diagnosis,
        notes,
        vitals,
        labRequests,
        vitalTargets,
        lifestyle,
        followUpDate,
        medications: {
          create: medications.map((med: any) => ({
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            times: med.times,
            instructions: med.instructions,
          })),
        },
      },
    });

    // Enable AI Push Notifications
    try {
      await scheduleMedicationReminders(prescription.id);
    } catch (pushError) {
      console.error("Failed to schedule push notifications:", pushError);
    }

    // Save a rich summary in MedicalRecord
    const summaryText = `
DIAGNOSIS: ${diagnosis}
CONSULTATION NOTES: ${notes}

PRESCRIPTIONS:
${medications.map((m: any) => `- ${m.name} (${m.dosage}) - [Times: ${m.times.join(", ")}]`).join("\n")}

LABORATORY INVESTIGATIONS:
${labRequests.map((l: any) => `- ${l.testName} (${l.urgency}): ${l.instructions}`).join("\n") || "None requested"}

CLINICAL VITAL TARGETS:
${vitalTargets.map((v: any) => `- ${v.label}: ${v.target}`).join("\n") || "None specified"}

LIFESTYLE ADVICE:
- Diet: ${lifestyle.diet || "N/A"}
- Exercise: ${lifestyle.exercise || "N/A"}
- Rest: ${lifestyle.rest || "N/A"}

FOLLOW-UP: ${followUpDate || "Not specified"}
    `.trim();

    await prisma.medicalRecord.create({
      data: {
        userId: invitation.userId,
        type: "CLINICAL_CONSULTATION",
        url: "N/A", 
        fileName: `Consultation - ${invitation.doctorName}`,
        description: `Professional assessment by ${invitation.doctorName}`,
        extractedText: summaryText,
      }
    });

    // Handle additional file uploads if any
    const fileRecords = [];
    for (const file of files) {
      const record = await prisma.medicalRecord.create({
        data: {
          userId: invitation.userId,
          type: "CLINICAL_ASSESSMENT_FILE",
          url: "SIMULATED_UPLOAD_URL", 
          fileName: file.name,
          description: `Supplementary evidence uploaded by ${invitation.doctorName}`,
          extractedText: `Uploaded clinical file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        }
      });
      fileRecords.push(record);
    }

    // Trigger Email Notification to Patient
    try {
      if (invitation.user.email) {
        await sendReportNotificationEmail(
          invitation.user.email,
          invitation.user.name || "Patient",
          invitation.doctorName
        );
      }
    } catch (emailError) {
      console.error("[Email Notification Error]", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true, 
      recordId: noteRecord.id,
      filesUploaded: fileRecords.length 
    });

  } catch (error: any) {
    console.error("[Doctor Submit Record Error]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
