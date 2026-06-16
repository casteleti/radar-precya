import { cookies } from "next/headers";
import { logout } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (token) await logout(token);

  const response = Response.json({ success: true });
  response.headers.set(
    "Set-Cookie",
    "session_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
  );
  return response;
}
