import { NextResponse } from "next/server";
import { processMedicationQueue } from "@/lib/reminders";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // In production, secure this with an auth header from your cron service
  // const authHeader = req.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    const result = await processMedicationQueue();
    return NextResponse.json({ 
      success: true, 
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[Cron API] Reminder processing failed:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
