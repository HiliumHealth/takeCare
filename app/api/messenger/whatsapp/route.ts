import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { whatsappNumber, contactName, doctorName, platform } = await req.json();

    // --- FAANG-Level Validation & Normalization ---
    if (!whatsappNumber || !doctorName) {
      return NextResponse.json({ error: "Missing required fields: whatsappNumber or doctorName" }, { status: 400 });
    }

    // USER explicitly requested the plus (+) sign
    const cleanNumbers = whatsappNumber.replace(/\D/g, "");
    const formattedNumber = `+${cleanNumbers}`;
    
    // Sandesh AI configuration
    const apiKey = process.env.SANDESH_API_KEY;
    const campaignName = process.env.SANDESH_CAMPAIGN_NAME;

    if (!apiKey || !campaignName) {
      return NextResponse.json({ 
        error: "Server configuration missing: SANDESH_API_KEY or SANDESH_CAMPAIGN_NAME not set in .env.local" 
      }, { status: 500 });
    }

    // Sandesh AI API endpoint
    const url = "https://api.sandeshai.com/whatsapp/campaign/api/";

    // FAANG Practice: Add a manual timeout to the fetch controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {


      // Mapping the "Cart" template variables to "Medical Consultation" context:
      // {{1}} -> Doctor Name
      // {{2}} -> Timeframe (e.g., 24 hours for feedback)
      // {{3}} -> Record count (e.g., 3 clinical insights)
      // {{4}} -> Clinical Urgency / Priority (e.g., "High Priority")
      const payload = {
        apiKey: apiKey,
        campaignName: campaignName,
        whatsappNumber: formattedNumber,
        contactName: contactName || doctorName,
        templateVariables: [
          doctorName,           // {{1}}
          "24",                 // {{2}}
          "5 New Patient",      // {{3}}
          "Urgent Review"       // {{4}}
        ],
        // Adding the Call-to-Action Buttons for the medical dashboard
        buttonUrl: `https://takecare-ai.com/dr/dashboard?dr=${encodeURIComponent(doctorName)}`,
        buttonText: "Join Dashboard"
      };



      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();


      // Handle Sandesh AI's specific error responses
      if (!response.ok || data.success === false) {
        console.error("[WhatsApp API Error]", data);
        return NextResponse.json({ 
          error: data.msg || data.message || "Failed to deliver message via WhatsApp gateway.", 
          details: data 
        }, { status: response.status === 200 ? 502 : response.status });
      }

      // Success - Store in DB
      try {
        const { auth } = await import("@/auth");
        const session = await auth();
        
        if (session?.user?.id) {
          await prisma.doctorInvitation.create({
            data: {
              userId: session.user.id,
              doctorName: doctorName,
              contactInfo: formattedNumber || whatsappNumber,
              platform: platform || "whatsapp",
              status: "PENDING"
            }
          });
        }
      } catch (dbErr) {
        console.error("Failed to store invitation in DB:", dbErr);
      }

      return NextResponse.json({ success: true, data });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error("[WhatsApp] Gateway Timeout Error - 15s limit reached.");
        return NextResponse.json({ error: "Gateway Timeout: SandeshAI API is taking too long to respond. Please check your internet connection or SandeshAI status." }, { status: 504 });
      }
      throw fetchError; // Re-throw for parent catch
    }
  } catch (error: any) {
    console.error("[WhatsApp Route Panic]", error);
    return NextResponse.json({ error: "Internal Gateway Error", message: error.message }, { status: 500 });
  }
}
