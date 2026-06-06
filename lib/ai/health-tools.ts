import { tool } from 'ai';
import { z } from 'zod';
import { searchMedicalRecords, searchVapiTranscripts } from '@/lib/rag/search';
import { prisma } from '@/lib/prisma';
import { getJson } from 'serpapi';
import fs from 'fs';
import path from 'path';

function logToFile(msg: string) {
  try {
    const logPath = path.join(process.cwd(), 'chat_debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
  } catch (e) { }
}

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
      execute: async ({ query, limit }: any) => {
        const safeQuery = (query && typeof query === 'string' && query.trim()) ? query.trim() : 'patient medical history summary';
        logToFile(`TOOL: searchMedicalHistory | User: ${userId} | Query: ${safeQuery} (raw: ${query})`);
        try {
          const records = await searchMedicalRecords(userId, safeQuery, limit || 3);
          logToFile(`TOOL: searchMedicalHistory | Records found: ${records.length}`);
          
          if (!records.length) return { found: false, message: 'No matching records found.' };

          return {
            found: true,
            records: records.map((r) => ({
              fileName: r.fileName,
              type: r.type,
              relevance: Math.round((r.similarity || 0) * 100) + '%',
              content: r.extractedText?.slice(0, 1200) || 'No text',
              date: r.createdAt.toISOString(),
            })),
          };
        } catch (e: any) {
          logToFile(`TOOL ERROR: searchMedicalHistory | ${e.message}`);
          return { success: false, error: e.message };
        }
      },
    } as any),

    // TOOL 2: structured vitals from the latest analyzed record
    getLatestVitals: tool({
      description:
        'Get the most recent vitals (blood pressure, heart rate, BMI, temperature) ' +
        'and the structured clinical summary from the latest analyzed record.',
      parameters: z.object({
        field: z.string().optional().describe('Specific vital field to get, e.g. blood_pressure. Omit for all.'),
      }),
      execute: async ({ field }: any) => {
        logToFile(`TOOL: getLatestVitals | User: ${userId} | Field: ${field || 'ALL'}`);
        try {
          const latest = await prisma.analysis.findFirst({
            where: { medicalRecord: { userId } },
            orderBy: { createdAt: 'desc' },
          });

          if (!latest) {
            logToFile(`TOOL: getLatestVitals | No analysis found`);
            return { found: false };
          }

          const ps = (latest.rawJson as any)?.patient_summary;
          if (field) {
            const val = ps?.latest_vitals?.[field];
            logToFile(`TOOL: getLatestVitals | Returning field ${field}: ${val}`);
            return { [field]: val };
          }

          logToFile(`TOOL: getLatestVitals | Returning all vitals and summary`);
          return {
            vitals: ps?.latest_vitals,
            diagnosis: ps?.diagnosis,
            medications: ps?.medications,
          };
        } catch (e: any) {
          logToFile(`TOOL ERROR: getLatestVitals | ${e.message}`);
          return { success: false, error: e.message };
        }
      },
    } as any),

    // TOOL 3: search current medical literature via SerpApi
    searchMedicalLiterature: tool({
      description:
        'Search online for current medical research, drug information, or clinical guidelines. ' +
        'Use when the patient asks about a condition, medication side effects, or treatment options.',
      parameters: z.object({
        query: z.string().describe('Medical search query'),
      }),
      execute: async ({ query }: any) => {
        const safeQuery = (query && typeof query === 'string' && query.trim()) ? query.trim() : 'general health guidance';
        logToFile(`TOOL: searchMedicalLiterature | Query: ${safeQuery} (raw: ${query})`);
        try {
          const apiKey = process.env.SERPAPI_API_KEY;
          if (!apiKey) {
            logToFile(`TOOL ERROR: searchMedicalLiterature | Missing SERPAPI_API_KEY`);
            return { success: false, error: "Medical search service currently unavailable (missing API key)." };
          }

          const resp = await getJson({
            engine: 'google',
            q: `${safeQuery} medical research`,
            api_key: apiKey,
          });

          const results = (resp.organic_results || []).slice(0, 3);
          logToFile(`TOOL: searchMedicalLiterature | Results found: ${results.length}`);
          
          return {
            results: results.map((r: any) => ({
              title: r.title,
              snippet: r.snippet,
              url: r.link,
            })),
          };
        } catch (e: any) {
          logToFile(`TOOL ERROR: searchMedicalLiterature | ${e.message}`);
          return { success: false, error: e.message };
        }
      },
    } as any),

    // TOOL 4: retrieve CLINICAL_NOTE records submitted by doctors
    getDoctorNotes: tool({
      description:
        'Retrieve clinical notes written directly by the patient doctor. ' +
        'Use when the patient asks what their doctor said or recommended.',
      parameters: z.object({ limit: z.number().optional().default(3) }),
      execute: async ({ limit }: any) => {
        logToFile(`TOOL: getDoctorNotes | User: ${userId} | Limit: ${limit}`);
        try {
          const notes = await prisma.medicalRecord.findMany({
            where: { userId, type: 'CLINICAL_NOTE' },
            orderBy: { createdAt: 'desc' },
            take: limit,
          });

          logToFile(`TOOL: getDoctorNotes | Notes found: ${notes.length}`);
          if (!notes.length) return { found: false };

          return {
            found: true,
            notes: notes.map((n) => ({
              doctor: n.fileName?.replace('Doctor Note - ', ''),
              note: n.extractedText?.slice(0, 1500),
              date: n.createdAt.toISOString(),
            })),
          };
        } catch (e: any) {
          logToFile(`TOOL ERROR: getDoctorNotes | ${e.message}`);
          return { success: false, error: e.message };
        }
      },
    } as any),

    // TOOL 5: semantic search over VAPI voice call transcripts
    searchVoiceHistory: tool({
      description:
        'Search past voice consultations with Dr. Leo for relevant context. ' +
        'Use when the patient refers to something discussed in a previous voice call.',
      parameters: z.object({ query: z.string().describe('Search query for voice transcripts') }),
      execute: async ({ query }: any) => {
        const safeQuery = (query && typeof query === 'string' && query.trim()) ? query.trim() : 'patient consultation history';
        logToFile(`TOOL: searchVoiceHistory | User: ${userId} | Query: ${safeQuery} (raw: ${query})`);
        try {
          const results = await searchVapiTranscripts(userId, safeQuery, 2);
          logToFile(`TOOL: searchVoiceHistory | Results found: ${results.length}`);
          
          if (!results.length) return { found: false };

          return {
            found: true,
            conversations: results.map((t) => ({
              summary: t.summary,
              excerpt: t.transcript?.slice(0, 800),
              date: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
            })),
          };
        } catch (e: any) {
          logToFile(`TOOL ERROR: searchVoiceHistory | ${e.message}`);
          return { success: false, error: e.message };
        }
      },
    } as any),

    // TOOL 6: get the synthesized DoctorIntelligence snapshot
    getDoctorIntelligence: tool({
      description:
        'Get a synthesized intelligence summary of all clinical assessments from all doctors. ' +
        'Use for questions about treatment plans, overall diagnoses, or clinical recommendations.',
      parameters: z.object({}),
      execute: async (args: any) => {
        logToFile(`TOOL: getDoctorIntelligence | User: ${userId}`);
        try {
          const intel = await prisma.doctorIntelligence.findUnique({
            where: { userId },
          });

          if (!intel) {
            logToFile(`TOOL: getDoctorIntelligence | No intel found`);
            return { found: false, message: 'No doctor intelligence available yet.' };
          }

          logToFile(`TOOL: getDoctorIntelligence | Returning synthesized summary`);
          return {
            found: true,
            summary: intel.summary,
            structured: intel.structuredJson,
            lastUpdated: intel.lastSyncedAt.toISOString(),
          };
        } catch (e: any) {
          logToFile(`TOOL ERROR: getDoctorIntelligence | ${e.message}`);
          return { success: false, error: e.message };
        }
      },
    } as any),
  } as any;
}
