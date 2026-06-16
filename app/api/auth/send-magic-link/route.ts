import { NextRequest } from "next/server";
import { z } from "zod";
import { sendMagicLink } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
});

const attempts = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 10 * 60 * 1000;
  const times = (attempts.get(ip) ?? []).filter((t) => t > now - window);
  if (times.length >= 3) return false;
  attempts.set(ip, [...times, now]);
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "E-mail inválido." }, { status: 400 });
  }

  await sendMagicLink(parsed.data.email);
  return Response.json({ success: true });
}
