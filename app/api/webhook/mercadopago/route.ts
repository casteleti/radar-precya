import { createHmac, timingSafeEqual } from "crypto";
import { normalizeMercadoPago } from "@/lib/webhook/normalize";
import { processWebhook } from "@/lib/webhook/process";

function validateSignature(rawBody: string, signature: string, requestId: string): boolean {
  const secret = process.env.WEBHOOK_SECRET_MERCADOPAGO;
  if (!secret) return false;

  // Formato: ts=xxx,v1=yyy
  const parts = Object.fromEntries(signature.split(",").map((s) => s.split("=")));
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${requestId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") ?? "";
  const requestId = req.headers.get("x-request-id") ?? "";

  if (!validateSignature(rawBody, signature, requestId)) {
    console.warn("[webhook/mercadopago] invalid signature");
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const body = JSON.parse(rawBody);
  const payload = normalizeMercadoPago(body);

  await processWebhook(payload, body);
  return Response.json({ received: true });
}
