import { NextRequest } from "next/server";
import { verifyMagicLink } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return Response.redirect(new URL("/auth/login?error=invalid", req.url));
  }

  const result = await verifyMagicLink(token);
  if (!result) {
    return Response.redirect(new URL("/auth/login?error=expired", req.url));
  }

  const redirect = result.onboarding_completed ? "/calculadora" : "/onboarding";
  const response = Response.redirect(new URL(redirect, req.url));

  response.headers.set(
    "Set-Cookie",
    `session_token=${result.sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`
  );

  return response;
}
