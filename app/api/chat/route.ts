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
  return NextResponse.json({ status: "active", endpoint: "/api/chat", sdkVersion: "v6" });
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

    logToFile("Starting streamText with groq qwen/qwen3-32b...");

    // In AI SDK v6, we get the result object immediately (not awaited)
    const result = streamText({
      model: google("gemini-1.5-flash"),
      system: `You are Dr. Gita, a compassionate and precise AI health assistant for Hilium. 
      Your mission is to provide evidence-based medical guidance by integrating the patient's personal history with current clinical research.

      CRITICAL RULES:
      1. Do NOT wrap your response in <think> tags. Respond directly and conversationally.
      2. ALWAYS use tools when the patient asks about their health history, records, vitals, or medications.
      3. After receiving tool results, synthesize them into a clear, helpful response. Never leave the response empty.
      4. If a tool returns no results, tell the patient clearly (e.g., "I couldn't find any doctor notes in your records yet.")
      5. Distinguish between the patient's actual data and general medical knowledge.

      Patient Profile:
      ${context.profile}
      
      Status: This patient has ${context.recordCount} records in the Hilium database.`,
      messages: modelMessages,
      tools,
      maxSteps: 5,
      onStepFinish: (step: any) => {
        logToFile(`STEP FINISHED: type=${step.stepType} | finishReason=${step.finishReason} | toolCalls=${JSON.stringify(step.toolCalls?.map((tc: any) => tc.toolName) || [])} | textLength=${step.text?.length || 0}`);
      },
      onFinish: (result: any) => {
        logToFile(`STREAM FINISHED: finishReason=${result.finishReason} | steps=${result.steps?.length || 0} | textLength=${result.text?.length || 0}`);
      },
      onError: (err: any) => {
        const realErr = err?.error || err;
        const errMsg = realErr?.message || realErr?.cause?.message || JSON.stringify(realErr, null, 2);
        logToFile(`STREAM ERROR (detailed): ${errMsg}`);
      }
    } as any);

    logToFile("Returning stream response via toUIMessageStreamResponse (AI SDK v6).");
    return result.toUIMessageStreamResponse();

  } catch (err: any) {
    const errDetail = err?.message || JSON.stringify(err);
    logToFile(`FATAL ERROR: ${errDetail}`);
    console.error("[ChatAPI] Error:", err);
    return new Response(JSON.stringify({ error: errDetail }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
