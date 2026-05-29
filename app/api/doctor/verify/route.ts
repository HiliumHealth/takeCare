import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    // Find the invitation for this email (contactInfo)
    const invitation = await prisma.doctorInvitation.findFirst({
      where: {
        contactInfo: email,
        otp: otp,
        status: "PENDING",
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invalid OTP or Email" }, { status: 401 });
    }

    if (invitation.otpExpires && new Date(invitation.otpExpires) < new Date()) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 401 });
    }

    // Mark as accepted
    const updatedInvitation = await prisma.doctorInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });

    // Return the invitation ID and patient info
    // The frontend will route to /doctor/dashboard/[inviteId]
    // The frontend stores this inviteId in localStorage for session persistence
    
    return NextResponse.json({ 
      success: true, 
      inviteId: updatedInvitation.id,
      patientId: updatedInvitation.userId,
      message: "Doctor verified successfully"
    });

  } catch (error: any) {
    console.error("[Doctor Verify Error]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
