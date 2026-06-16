import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z
  .object({
    payment_method: z.enum(["pix", "card", "both"]),
    card_fee_pct: z.number().min(0).max(100),
    tax_pct: z.number().min(0).max(100),
    target_margin_pct: z.number().min(1).max(89),
  })
  .refine((d) => d.tax_pct + (d.payment_method === "pix" ? 0 : d.card_fee_pct) < 90, {
    message: "Os percentuais estão muito altos. Revise imposto e taxa de cartão.",
  });

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const card_fee_pct = parsed.data.payment_method === "pix" ? 0 : parsed.data.card_fee_pct;

  await prisma.clinicCostProfile.upsert({
    where: { clinic_id: session.clinic_id },
    create: {
      clinic_id: session.clinic_id,
      payment_method: parsed.data.payment_method,
      card_fee_pct,
      tax_pct: parsed.data.tax_pct,
      target_margin_pct: parsed.data.target_margin_pct,
    },
    update: {
      payment_method: parsed.data.payment_method,
      card_fee_pct,
      tax_pct: parsed.data.tax_pct,
      target_margin_pct: parsed.data.target_margin_pct,
    },
  });

  return Response.json({ success: true });
}
