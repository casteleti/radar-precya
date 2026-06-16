import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("key");
  if (secret !== "precya-dev-2026") {
    return new Response("Forbidden", { status: 403 });
  }

  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  const base = `${proto}://${host}`;

  const response = NextResponse.redirect(new URL("/calculadora", base));
  response.cookies.set("session_token", "dev-session-radar-2026", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 31536000,
  });
  return response;
}
