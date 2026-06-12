import { embed } from 'ai';
import { google } from '@ai-sdk/google';
import { prisma } from '@/lib/prisma';

const embeddingModel = google.textEmbeddingModel('text-embedding-004');

export interface SearchResult {
  id: string;
  fileName: string;
  type: string;
  extractedText: string | null;
  similarity: number;
  createdAt: Date;
}

export async function searchMedicalRecords(
  userId: string,
  query: string,
  limit: number = 3
): Promise<SearchResult[]> {
  try {
    // Embed the user's query into the same vector space as the stored records
    const { embedding } = await embed({ model: embeddingModel, value: query });
    const vectorString = JSON.stringify(embedding);

    // <=> is the pgvector cosine distance operator (lower = more similar)
    const records = await prisma.$queryRaw<SearchResult[]>`
      SELECT
        id, "fileName", type, "extractedText", "createdAt",
        1 - (embedding <=> ${vectorString}::vector) AS similarity
      FROM "MedicalRecord"
      WHERE "userId" = ${userId}
      AND embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorString}::vector
      LIMIT ${limit}
    `;

    if (records.length === 0) {
      throw new Error("No records with embeddings found, falling back to chronological.");
    }

    return records;
  } catch (error) {
    console.error("Embedding API failed, falling back to chronological search:", error);
    // Fallback if embedding API is unavailable
    const records = await prisma.medicalRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        fileName: true,
        type: true,
        extractedText: true,
        createdAt: true
      }
    });
    return records.map(r => ({
      ...r,
      similarity: 1.0 // Mock similarity for fallback
    })) as SearchResult[];
  }
}

export async function searchVapiTranscripts(
  userId: string,
  query: string,
  limit: number = 2
): Promise<any[]> {
  try {
    const { embedding } = await embed({ model: embeddingModel, value: query });
    const vectorString = JSON.stringify(embedding);

    const transcripts = await prisma.$queryRaw<any[]>`
      SELECT id, transcript, summary, "createdAt",
      1 - (embedding <=> ${vectorString}::vector) AS similarity
      FROM "VapiTranscript"
      WHERE "userId" = ${userId} AND embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorString}::vector
      LIMIT ${limit}
    `;

    if (transcripts.length === 0) {
      throw new Error("No transcripts with embeddings found, falling back to chronological.");
    }

    return transcripts;
  } catch (error) {
    console.error("Embedding API failed for transcripts, falling back to chronological:", error);
    const transcripts = await prisma.vapiTranscript.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        transcript: true,
        summary: true,
        createdAt: true
      }
    });
    return transcripts.map(t => ({
      ...t,
      similarity: 1.0
    }));
  }
}
