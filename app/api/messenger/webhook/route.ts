import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MESSAGES_FILE = path.join(process.cwd(), "messages.json");

/**
 * Sandesh AI Webhook Receiver
 * Handles text, image, voice, and audio from Doctor's WhatsApp
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // FAANG Practice: Extract deep metadata for AI context
    const type = payload.type || (payload.mediaUrl ? "media" : "text");
    const text = payload.message || payload.text || payload.caption || "";
    const mediaUrl = payload.mediaUrl || payload.fileUrl || null;
    const from = payload.from || payload.whatsappNumber || "Unknown Doctor";
    
    // Normalize phone number for lookup (remove non-digits or handle +)
    // The DB stores it as formatted by the invitation route (e.g., +237...)
    const normalizedFrom = from.startsWith('+') ? from : `+${from.replace(/\D/g, "")}`;

    // Look up which user this doctor belongs to
    const { prisma } = await import("@/lib/prisma");
    const invitation = await prisma.doctorInvitation.findFirst({
      where: {
        contactInfo: {
          contains: normalizedFrom.replace('+', '') // Loose match to handle formatting diffs
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const userId = invitation?.userId || "anonymous";

    // Generate AI Context: A structured string for the LLM to understand the interaction
    const aiContext = `[DOCTOR_INBOUND] Type: ${type.toUpperCase()} | From: ${from} | Content: ${text} | Media: ${mediaUrl || "None"}`;

    const doctorMsg = {
      id: `wa-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type, // text, image, audio, voice, video, etc.
      text: text || `Received a ${type} message.`,
      mediaUrl,
      sender: "doctor",
      from,
      userId, // CRITICAL: Security isolation
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      receivedAt: new Date().toISOString(),
      aiContext // This is the gold for your AI training/context
    };

    // Resilient File Storage
    let history = [];
    try {
      if (fs.existsSync(MESSAGES_FILE)) {
        const fileContent = fs.readFileSync(MESSAGES_FILE, "utf-8");
        history = JSON.parse(fileContent || "[]");
      }
    } catch (e) {
      console.warn("Failed to parse messages.json, starting fresh.", e);
    }

    history.push(doctorMsg);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(history, null, 2));


    
    return NextResponse.json({ success: true, messageId: doctorMsg.id });
  } catch (error: any) {
    console.error("[Webhook Critical Failure]", error);
    return NextResponse.json({ error: "Ingestion Error", message: error.message }, { status: 500 });
  }
}

export async function GET() {
  return new Response("TakeCare AI Webhook Gateway: Online", { status: 200 });
}
