import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: "VAPID public key not found on server" }, { status: 500 });
  }
  return NextResponse.json({ publicKey });
}
