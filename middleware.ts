import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/verify",
  "/api/auth",
  "/api/webhook",
  "/api/health",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("session_token")?.value;
  if (!sessionToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
