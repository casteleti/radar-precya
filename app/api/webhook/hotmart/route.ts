import { timingSafeEqual } from "crypto";
import { normalizeHotmart } from "@/lib/webhook/normalize";
import { processWebhook } from "@/lib/webhook/process";

function validateToken(token: string): boolean {
  const secret = process.env.WEBHOOK_SECRET_HOTMART;
  if (!secret) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const token = req.headers.get("x-hotmart-hottok") ?? "";

  if (!validateToken(token)) {
    console.warn("[webhook/hotmart] invalid token");
    return Response.json({ error: "Invalid token" }, { status: 400 });
  }

  const body = await req.json();
  const payload = normalizeHotmart(body);

  await processWebhook(payload, body);
  return Response.json({ received: true });
}
