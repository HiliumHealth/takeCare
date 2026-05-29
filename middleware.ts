import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow doctor routes without authentication
  // Doctor access is verified via OTP at /doctor/verify
  // and validated by inviteId on the dashboard page
  if (pathname.startsWith("/doctor")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|icons|images|manifest|sw|favicon).*)",
  ],
};
