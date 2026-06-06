import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { groq } from '@ai-sdk/groq';
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

    logToFile("Starting streamText with groq qwen/qwen3-32b...");
    const result = streamText({
      model: groq("qwen/qwen3-32b"),
      system: `You are Dr. Leo, a compassionate and precise AI health assistant for Hilium. 
      Your mission is to provide evidence-based medical guidance by integrating the patient's personal history with current clinical research.

      CRITICAL RULES:
      1. Do NOT wrap your response in <think> tags. Respond directly with your answer.
      2. ALWAYS use tools when the patient asks about their health history, records, vitals, or medications.
      3. After receiving tool results, synthesize them into a clear, helpful response.
      4. Distinguish between the patient's actual data and general medical knowledge.

      Patient Profile:
      ${context.profile}
      
      Status: This patient has ${context.recordCount} records in the Hilium database.`,
      messages: modelMessages,
      tools,
      maxSteps: 5,
      onStepFinish: (step: any) => {
        logToFile(`STEP FINISHED: type=${step.stepType} | finishReason=${step.finishReason} | toolCalls=${JSON.stringify(step.toolCalls?.map((tc: any) => tc.toolName) || [])} | textLength=${step.text?.length || 0}`);
        if (step.error) {
          logToFile(`STEP ERROR: ${JSON.stringify(step.error)}`);
        }
      },
      onFinish: (result: any) => {
        logToFile(`STREAM FINISHED: finishReason=${result.finishReason} | steps=${result.steps?.length || 0} | textLength=${result.text?.length || 0}`);
      },
      onError: (err: any) => {
        // Dig deep into the error to find the real message
        const realErr = err?.error || err;
        const errMsg = realErr?.message || realErr?.cause?.message || JSON.stringify(realErr, null, 2);
        const errStack = realErr?.stack || '';
        logToFile(`STREAM ERROR (detailed): ${errMsg}`);
        logToFile(`STREAM ERROR (stack): ${errStack}`);
        logToFile(`STREAM ERROR (raw): ${JSON.stringify(err, Object.getOwnPropertyNames(err || {}), 2)}`);
      }
    } as any);

    logToFile("Returning stream response via toUIMessageStreamResponse (AI SDK v6).");
    return result.toUIMessageStreamResponse();

  } catch (err: any) {
    const errDetail = err?.message || JSON.stringify(err);
    logToFile(`FATAL ERROR: ${errDetail}`);
    logToFile(`FATAL STACK: ${err?.stack || 'no stack'}`);
    console.error("[ChatAPI] Error:", err);
    return new Response(JSON.stringify({ error: errDetail }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
