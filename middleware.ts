import { betterAuth } from "better-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — no auth check needed
  const publicPaths = [
    "/login",
    "/register",
    "/",
    "/api/auth",
  ];
  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
  // Also allow static assets
  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/fonts") ||
    pathname.startsWith("/favicon.ico");

  if (isPublic || isStatic) {
    return NextResponse.next();
  }

  // Protected routes: /assets, /assets/*, /stats, /add, /edit/*, /settings
  const protectedPaths = [
    "/assets",
    "/stats",
    "/add",
    "/edit",
    "/settings",
  ];
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check session by calling Better Auth's getSession
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (session) {
      return NextResponse.next();
    }
  } catch {
    // If session check fails, redirect to login
  }

  // Redirect to login, preserving the original path for return
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|fonts|favicon.ico).*)",
  ],
};