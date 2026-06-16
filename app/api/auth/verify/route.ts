import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLink } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  const base = `${proto}://${host}`;

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login?error=invalid", base));
  }

  const result = await verifyMagicLink(token);
  if (!result) {
    return NextResponse.redirect(new URL("/auth/login?error=expired", base));
  }

  const redirect = result.onboarding_completed ? "/calculadora" : "/onboarding";
  const response = NextResponse.redirect(new URL(redirect, base));

  response.cookies.set("session_token", result.sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 2592000,
  });

  return response;
}
