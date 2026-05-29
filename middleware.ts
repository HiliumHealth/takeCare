import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session
  const session = await auth();

  // Public paths that don't require authentication
  const publicPaths = [
    "/",
    "/signin",
    "/signup",
    "/doctor/verify",
    "/api/auth/register",
    "/api/auth/callback",
    "/api/auth/session",
    "/api/auth/signin",
    "/api/auth/signout",
    "/manifest.json",
    "/sw.js",
    "/icons",
    "/images",
    "/onboarding",
  ];

  // Check if path is public
  const isPublicPath = publicPaths.some((path) =>
    pathname.startsWith(path) || pathname === path
  );

  // Protected paths that require authentication
  const protectedPaths = ["/dashboard", "/doctor/dashboard", "/offline"];

  // Check if path is protected
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  // If trying to access protected path without authentication, redirect to signin
  if (isProtectedPath && !session?.user?.id) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // If authenticated user visits home page, redirect to dashboard
  if (pathname === "/" && session?.user?.id) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If authenticated user tries to visit signin/signup, redirect to dashboard
  if ((pathname === "/signin" || pathname === "/signup") && session?.user?.id) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
