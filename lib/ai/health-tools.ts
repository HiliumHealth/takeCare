import { tool } from 'ai';
import { z } from 'zod';
import { searchMedicalRecords, searchVapiTranscripts } from '@/lib/rag/search';
import { prisma } from '@/lib/prisma';
import { getJson } from 'serpapi';

export function createHealthTools(userId: string) {
  return {
    // TOOL 1: semantic search over the patient's own uploaded records
    searchMedicalHistory: tool({
      description:
        'Search the patient medical records, lab results, diagnoses, and clinical history. ' +
        'Use whenever the patient asks about their health history, blood results, or medications.',
      parameters: z.object({
        query: z.string().describe('Natural language search query'),
        limit: z.number().optional().default(3),
      }),
      execute: async ({ query, limit }: { query: string; limit: number }) => {
        try {
          const records = await searchMedicalRecords(userId, query, limit);
          if (!records.length) return { found: false, message: 'No matching records found.' };

          return {
            found: true,
            records: records.map((r) => ({
              fileName: r.fileName,
              type: r.type,
              relevance: Math.round(r.similarity * 100) + '%',
              content: r.extractedText?.slice(0, 1200) || 'No text',
              date: r.createdAt,
            })),
          };
        } catch (e: any) {
          return { success: false, error: e.message };
        }
      },
    }),

    // TOOL 2: structured vitals from the latest analyzed record
    getLatestVitals: tool({
      description:
        'Get the most recent vitals (blood pressure, heart rate, BMI, temperature) ' +
        'and the structured clinical summary from the latest analyzed record.',
      parameters: z.object({
        field: z.string().optional().describe('Specific vital field to get, e.g. blood_pressure. Omit for all.'),
      }),
      execute: async ({ field }: { field?: string }) => {
        try {
          const latest = await prisma.analysis.findFirst({
            where: { medicalRecord: { userId } },
            orderBy: { createdAt: 'desc' },
          });

          if (!latest) return { found: false };

          const ps = (latest.rawJson as any)?.patient_summary;
          if (field) return { [field]: ps?.latest_vitals?.[field] };

          return {
            vitals: ps?.latest_vitals,
            diagnosis: ps?.diagnosis,
            medications: ps?.medications,
          };
        } catch (e: any) {
          return { success: false, error: e.message };
        }
      },
    }),

    // TOOL 3: search current medical literature via SerpApi
    searchMedicalLiterature: tool({
      description:
        'Search online for current medical research, drug information, or clinical guidelines. ' +
        'Use when the patient asks about a condition, medication side effects, or treatment options.',
      parameters: z.object({
        query: z.string().describe('Medical search query'),
      }),
      execute: async ({ query }: { query: string }) => {
        try {
          const resp = await getJson({
            engine: 'google',
            q: `${query} medical research`,
            api_key: process.env.SERPAPI_API_KEY!,
          });

          const results = (resp.organic_results || []).slice(0, 3);
          return {
            results: results.map((r: any) => ({
              title: r.title,
              snippet: r.snippet,
              url: r.link,
            })),
          };
        } catch (e: any) {
          return { success: false, error: e.message };
        }
      },
    }),

    // TOOL 4: retrieve CLINICAL_NOTE records submitted by doctors
    getDoctorNotes: tool({
      description:
        'Retrieve clinical notes written directly by the patient doctor. ' +
        'Use when the patient asks what their doctor said or recommended.',
      parameters: z.object({ limit: z.number().optional().default(3) }),
      execute: async ({ limit }: { limit: number }) => {
        try {
          const notes = await prisma.medicalRecord.findMany({
            where: { userId, type: 'CLINICAL_NOTE' },
            orderBy: { createdAt: 'desc' },
            take: limit,
          });

          if (!notes.length) return { found: false };

          return {
            found: true,
            notes: notes.map((n) => ({
              doctor: n.fileName?.replace('Doctor Note - ', ''),
              note: n.extractedText?.slice(0, 1500),
              date: n.createdAt,
            })),
          };
        } catch (e: any) {
          return { success: false, error: e.message };
        }
      },
    }),

    // TOOL 5: semantic search over VAPI voice call transcripts
    searchVoiceHistory: tool({
      description:
        'Search past voice consultations with Dr. Leo for relevant context. ' +
        'Use when the patient refers to something discussed in a previous voice call.',
      parameters: z.object({ query: z.string().describe('Search query for voice transcripts') }),
      execute: async ({ query }: { query: string }) => {
        try {
          const results = await searchVapiTranscripts(userId, query, 2);
          if (!results.length) return { found: false };

          return {
            found: true,
            conversations: results.map((t) => ({
              summary: t.summary,
              excerpt: t.transcript?.slice(0, 800),
              date: t.createdAt,
            })),
          };
        } catch (e: any) {
          return { success: false, error: e.message };
        }
      },
    }),

    // TOOL 6: get the synthesized DoctorIntelligence snapshot
    getDoctorIntelligence: tool({
      description:
        'Get a synthesized intelligence summary of all clinical assessments from all doctors. ' +
        'Use for questions about treatment plans, overall diagnoses, or clinical recommendations.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const intel = await prisma.doctorIntelligence.findUnique({
            where: { userId },
          });

          if (!intel) return { found: false, message: 'No doctor intelligence available yet.' };

          return {
            found: true,
            summary: intel.summary,
            structured: intel.structuredJson,
            lastUpdated: intel.lastSyncedAt,
          };
        } catch (e: any) {
          return { success: false, error: e.message };
        }
      },
    }),
  };
}
