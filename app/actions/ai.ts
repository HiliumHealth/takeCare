"use server";

import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Generates a concise, patient-friendly summary of a medical record.
 * constrained to ~60 words as requested.
 */
export async function generateSmartSummary(recordId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // 1. Fetch the record and patient context
  const record = await prisma.medicalRecord.findUnique({
    where: { id: recordId, userId: session.user.id },
    include: { analysis: true }
  });

  if (!record) throw new Error("Record not found");

  const personalization = await prisma.personalization.findUnique({
    where: { userId: session.user.id }
  });

  // 2. Prepare the prompt
  const patientProfile = personalization
    ? `Patient Background: Blood Type ${personalization.bloodType}, Allergies: ${personalization.allergies.join(", ") || "None"}. Health Goals: ${personalization.healthGoals.join(", ")}.`
    : "No detailed patient background available.";

  const clinicalData = record.extractedText || record.analysis?.summary || "No clinical data found.";

  const prompt = `
    You are Hilium AI, an elite medical intelligence system.
    Provide a warm, simple, and professional summary of the following clinical record for the patient.
    
    PATIENT CONTEXT:
    ${patientProfile}
    
    CLINICAL DATA TO SUMMARIZE:
    ${clinicalData}
    
    STRICT CONSTRAINTS:
    - Language: Patient-friendly, empathetic, and clear.
    - Length: Maximum 60 words.
    - Format: Single cohesive paragraph.
    - No medical jargon without explanation.
    - Do not offer definitive diagnosis, maintain clinical caution.
  `;

  // 3. Call Gemini
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("[AI-ACTION] GOOGLE_GENERATIVE_AI_API_KEY is not defined in environment.");
      return "Hilium AI requires an API key to synthesize your clinical data. Please configure your environment.";
    }

    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: prompt,
    });

    if (!text) {
      return "Hilium AI could not extract meaningful insights from this specific record. Manual review recommended.";
    }

    return text.trim();
  } catch (error: any) {
    console.error("[AI-SUMMARY-ERROR]", error.message || error);
    return `Hilium AI encountered a temporary synchronization issue. (Error: ${error.message?.substring(0, 50)}...)`;
  }
}
