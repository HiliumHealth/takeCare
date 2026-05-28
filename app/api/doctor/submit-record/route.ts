import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReportNotificationEmail } from "@/lib/mail";
import { scheduleMedicationReminders } from "@/lib/reminders";
import { sendPushNotification } from "@/lib/notifications";

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
      return NextResponse.json({ error: "Required information is missing. Please try again." }, { status: 400 });
    }

    const invitation = await prisma.doctorInvitation.findUnique({
      where: { id: inviteId },
      include: { user: true }
    });

    if (!invitation) {
      return NextResponse.json({ error: "This invitation link is no longer valid or has expired." }, { status: 401 });
    }

    // Validate and filter medications - only include complete medications
    const validMedications = medications.filter((med: any) => {
      // Check that all required fields are filled
      if (!med.name || !med.name.trim()) return false;
      if (!med.dosage || !med.dosage.trim()) return false;
      if (!med.frequency || !med.frequency.trim()) return false;
      // Check that at least one time is scheduled
      if (!Array.isArray(med.times) || med.times.length === 0) return false;
      return true;
    });

    // Ensure all required fields have values
    const finalDiagnosis = diagnosis && diagnosis.trim() ? diagnosis : "To be determined";
    const finalNotes = notes && notes.trim() ? notes : "";
    const finalFollowUpDate = followUpDate && followUpDate.trim() ? followUpDate : null;

    // Create the structured Prescription record
    try {
      // Create prescription without medications first
      const prescription = await prisma.prescription.create({
        data: {
          userId: invitation.userId,
          doctorName: invitation.doctorName,
          diagnosis: finalDiagnosis,
          notes: finalNotes,
          vitals: vitals && Object.keys(vitals).length > 0 ? vitals : {},
          labRequests: Array.isArray(labRequests) ? labRequests : [],
          vitalTargets: Array.isArray(vitalTargets) ? vitalTargets : [],
          lifestyle: lifestyle && Object.keys(lifestyle).length > 0 ? lifestyle : {},
          followUpDate: finalFollowUpDate,
        },
      });

      // Create medications separately to ensure timestamps are set correctly
      if (validMedications.length > 0) {
        await prisma.medication.createMany({
          data: validMedications.map((med: any) => ({
            prescriptionId: prescription.id,
            name: med.name.trim(),
            dosage: med.dosage.trim(),
            frequency: med.frequency,
            times: med.times,
            instructions: med.instructions || "",
            createdAt: new Date(),
          })),
        });
      }

      // Enable AI Push Notifications
      try {
        await scheduleMedicationReminders(prescription.id);
        
        // Immediate Push Alert to Patient
        await sendPushNotification(invitation.userId, {
          title: "New Doctor Assessment",
          body: `Dr. ${invitation.doctorName} has just submitted your medical report and treatment plan.`,
          url: "/dashboard",
          icon: "/icons/icon-192x192.png"
        });
      } catch (pushError) {
        console.error("Failed to schedule push notifications:", pushError);
      }

      // Save a rich summary in MedicalRecord
      const summaryText = `
DIAGNOSIS: ${finalDiagnosis}
CONSULTATION NOTES: ${finalNotes}

PRESCRIPTIONS:
${validMedications.map((m: any) => `- ${m.name} (${m.dosage}) - [Times: ${m.times.join(", ")}]`).join("\n")}

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

    const noteRecord = await prisma.medicalRecord.create({
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

    // Update the invitation status to COMPLETED so it doesn't show as pending
    await prisma.doctorInvitation.update({
      where: { id: inviteId },
      data: { status: "COMPLETED" }
    });

    return NextResponse.json({ 
      success: true, 
      recordId: noteRecord.id,
      filesUploaded: fileRecords.length 
    });

    } catch (prescriptionError: any) {
      console.error("[Doctor Prescription Creation Error]", {
        code: prescriptionError.code,
        message: prescriptionError.message,
        meta: prescriptionError.meta,
        inviteId,
        diagnosis: finalDiagnosis,
        medicationCount: validMedications.length
      });
      return NextResponse.json({ 
        error: "Failed to save prescription. Please ensure all required fields are filled correctly." 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("[Doctor Submit Record Error]", error);
    return NextResponse.json({ error: "Something went wrong while saving the report. Please check your connection and try again." }, { status: 500 });
  }
}
