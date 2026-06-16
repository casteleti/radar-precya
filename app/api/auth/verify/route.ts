import { NextRequest } from "next/server";
import { verifyMagicLink } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  const base = `${proto}://${host}`;

  if (!token) {
    return Response.redirect(new URL("/auth/login?error=invalid", base));
  }

  const result = await verifyMagicLink(token);
  if (!result) {
    return Response.redirect(new URL("/auth/login?error=expired", base));
  }

  const redirect = result.onboarding_completed ? "/calculadora" : "/onboarding";
  const response = Response.redirect(new URL(redirect, base));

  response.headers.set(
    "Set-Cookie",
    `session_token=${result.sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`
  );

  return response;
}
