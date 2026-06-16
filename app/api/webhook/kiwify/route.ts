import { createHmac, timingSafeEqual } from "crypto";
import { normalizeKiwify } from "@/lib/webhook/normalize";
import { processWebhook } from "@/lib/webhook/process";

function validateSignature(body: string, signature: string): boolean {
  const secret = process.env.WEBHOOK_SECRET_KIWIFY;
  if (!secret) return false;
  const expected = createHmac("sha1", secret).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-kiwify-signature") ?? "";

  if (!validateSignature(rawBody, signature)) {
    console.warn("[webhook/kiwify] invalid signature");
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const body = JSON.parse(rawBody);
  const payload = normalizeKiwify(body);

  await processWebhook(payload, body);
  return Response.json({ received: true });
}
