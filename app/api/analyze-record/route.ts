import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { embed } from "ai";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("file") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const parts = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (file.type.startsWith("image/")) {
          return {
            type: "image" as const,
            image: buffer,
            mimeType: file.type,
          };
        } else {
          // For PDFs, we must pass it to a model that supports file inputs (like Gemini)
          return {
            type: "file" as const,
            data: buffer,
            mimeType: file.type,
          };
        }
      })
    );

    const validParts = parts.filter(Boolean);

    let promptText = `
You are a highly capable AI medical data extraction and analysis specialist acting as the knowledge ingestion engine for the 'Hilium' healthcare RAG system.

Please carefully review the attached medical records (images, scans, or text). Execute the following tasks:

1. **Extract All Raw Text:** Transcribe the medical data verbatim for RAG indexing.
2. **Clinical Summary:** Provide a highly structured, comprehensively formatted breakdown of the patient's condition. You MUST use rich Markdown formatting (e.g., # Headings, ## Subheadings, bullet points, bold text for emphasis) in your analysis output. DO NOT output a single plain paragraph.
3. **Structured Data Extraction:** Extract patient details, vitals, lab results, diagnoses, and medications into a specific JSON format.

IMPORTANT: Your response MUST be a valid JSON object with the following structure:
{
  "analysis": "A rich, comprehensively markdown-formatted clinical summary. Use # for main headers, ## for subheaders, and bullet points. Break the summary into logical sections (e.g., Patient Overview, Key Findings, Action Items).",
  "structuredData": {
    "patient_summary": {
      "name": "string",
      "id": "string",
      "latest_vitals": {
        "weight": "string",
        "height": "string",
        "bmi": "string",
        "blood_pressure": "string",
        "heart_rate": "string",
        "resp_rate": "string",
        "temperature": "string"
      },
      "lab_results": {
        "summary": "string",
        "details": {}
      },
      "diagnosis": "string",
      "symptoms": ["string"],
      "medications": [
        { "name": "string", "dosage": "string", "frequency": "string" }
      ],
      "clinical_history": "string"
    }
  }
}

Do not include any text outside of the JSON object.
`;

    // Initialize content array with the prompt
    const content: any[] = [{ type: "text", text: promptText }, ...validParts];

    // As requested, use gemini-2.5-flash for all modalities to solve compatibility issues
    const aiModel = google("gemini-2.5-flash");

    // Request analysis
    const result = await generateText({
      model: aiModel,
      messages: [
        {
          role: "user",
          content,
        },
      ],
    });

    // Parse the JSON result with robust extraction
    let parsedResult;
    try {
      // Find the first '{' and the last '}' to extract the JSON object
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : result.text;

      const text = jsonText.replace(/```json\n?/, "").replace(/\n?```/, "").trim();
      parsedResult = JSON.parse(text);

      // Ensure specific fields exist
      if (!parsedResult.analysis) {
        parsedResult.analysis = result.text;
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON. Raw text:", result.text);
      parsedResult = {
        analysis: result.text,
        structuredData: null,
        error: "Structural parsing failed"
      };
    }

    // Save to Database securely if authenticated
    try {
      const session = await auth();

      if (session?.user?.id) {
        // Use the first file as the main record for simplicity
        const file = files[0];

        // Use direct Prisma call instead of calling server actions from a route handler
        const record = await prisma.medicalRecord.create({
          data: {
            userId: session.user.id,
            type: file.type.startsWith("image") ? "IMAGE" : "PDF",
            url: "local-blob",
            fileName: file.name,
            description: parsedResult.structuredData?.diagnosis || "Patient uploaded medical record",
            extractedText: result.text
          }
        });

        await prisma.analysis.create({
          data: {
            medicalRecordId: record.id,
            summary: parsedResult.analysis,
            severity: "MEDIUM",
            rawJson: parsedResult.structuredData || {}
          }
        });

        console.log("[Route] Successfully saved medical record and analysis for user:", session.user.id);

        // INDEXING: Embed record for RAG
        try {
          const textForEmbedding = [
            parsedResult.analysis,
            parsedResult.structuredData?.patient_summary?.diagnosis || "",
            (parsedResult.structuredData?.patient_summary?.symptoms || []).join(", "),
            (parsedResult.structuredData?.patient_summary?.medications || [])
              .map((m: any) => `${m.name} ${m.dosage}`).join(", "),
            parsedResult.structuredData?.patient_summary?.clinical_history || "",
          ].filter(Boolean).join(" | ");

          const { embedding } = await embed({
            model: google.textEmbeddingModel("text-embedding-004"),
            value: textForEmbedding,
          });

          const vectorString = JSON.stringify(embedding);
          await prisma.$executeRaw`
            UPDATE "MedicalRecord"
            SET embedding = ${vectorString}::vector
            WHERE id = ${record.id}
          `;
          console.log("[RAG] Indexing complete for record:", record.id);
        } catch (indexingError) {
          console.error("[RAG] Indexing failed:", indexingError);
        }
      }
    } catch (authDbError) {
      // In production, log error but don't crash the entire request
      console.error("Authentication or database error during analysis save:", authDbError);
    }

    return NextResponse.json(parsedResult);

  } catch (error) {
    console.error("Error analyzing medical record:", error);
    return NextResponse.json(
      { error: "Failed to analyze medical record. Please ensure you have a valid GOOGLE_GENERATIVE_AI_API_KEY." },
      { status: 500 }
    );
  }
}

