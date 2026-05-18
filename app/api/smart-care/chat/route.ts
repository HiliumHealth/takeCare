import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createHealthTools } from '@/lib/ai/health-tools';
import { buildPatientContext } from '@/lib/ai/patient-context';
import fs from 'fs';
import path from 'path';

export const maxDuration = 30;

function logToFile(msg: string) {
  try {
    const logPath = path.join(process.cwd(), 'chat_debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
  } catch (e) { }
}

export async function GET() {
  return NextResponse.json({ status: "active", endpoint: "/api/smart-care/chat", sdkVersion: "v6" });
}

export async function POST(req: Request) {
  logToFile("--- POST REQUEST START ---");

  try {
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    logToFile(`API Key present: ${!!key}, Length: ${key?.length || 0}`);

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      logToFile("Error: Unauthorized (No session)");
      return new Response('Unauthorized', { status: 401 });
    }

    logToFile(`Auth User: ${userId}`);

    const body = await req.json();
    const { messages }: { messages: UIMessage[] } = body;

    if (!messages?.length) {
      logToFile("Error: No messages in body");
      return new Response('No messages', { status: 400 });
    }

    logToFile(`Messages count: ${messages.length}`);

    // Build context
    const context = await buildPatientContext(userId);
    const tools = createHealthTools(userId);

    // AI SDK v6: convertToModelMessages
    const modelMessages = await convertToModelMessages(messages);

    logToFile("Starting streamText with gemini-2.5-flash...");
    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: `You are Dr. Leo, a compassionate and precise AI health assistant for Hilium. 
      Your mission is to provide evidence-based medical guidance by integrating the patient's personal history with current clinical research.

      Operational Guidelines:
      1. INTEGRATION: When multiple instructions are provided, perform both tasks and synthesize findings.
      2. PROACTIVITY: Always check the patient's medical records if the query relates to their history.

      Patient Profile:
      ${context.profile}
      
      Status: This patient has ${context.recordCount} records in the Hilium database.`,
      messages: modelMessages,
      tools,
      maxSteps: 5,
      onError: (err: any) => {
        const errMsg = err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err));
        logToFile(`STREAM ERROR: ${errMsg}`);
      }
    } as any);

    logToFile("Returning stream response via toUIMessageStreamResponse (AI SDK v6).");
    return result.toUIMessageStreamResponse();

  } catch (err: any) {
    logToFile(`FATAL ERROR: ${err.message}`);
    console.error("[ChatAPI] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
