import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z
  .object({
    monthly_fixed_costs: z.number().min(0),
    days_per_month: z.number().int().min(1).max(31),
    hours_per_day: z.number().min(0.5).max(24),
    occupancy_pct: z.number().min(1).max(100),
    occupancy_estimated: z.boolean().default(false),
    payment_method: z.enum(["pix", "card", "both"]),
    card_fee_pct: z.number().min(0).max(100),
    tax_pct: z.number().min(0).max(100),
    target_margin_pct: z.number().min(1).max(89),
  })
  .refine((d) => d.tax_pct + (d.payment_method === "pix" ? 0 : d.card_fee_pct) < 90, {
    message: "Os percentuais estão muito altos. Revise imposto e taxa de cartão.",
  });

export async function GET() {
  const session = await getServerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const costProfile = await prisma.clinicCostProfile.findUnique({
    where: { clinic_id: session.clinic_id },
  });

  if (!costProfile) {
    return Response.json({ error: "Perfil de custos não encontrado" }, { status: 404 });
  }

  return Response.json({ costProfile });
}

export async function PUT(req: Request) {
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

  const data = {
    monthly_fixed_costs: parsed.data.monthly_fixed_costs,
    days_per_month: parsed.data.days_per_month,
    hours_per_day: parsed.data.hours_per_day,
    occupancy_pct: parsed.data.occupancy_pct,
    occupancy_estimated: parsed.data.occupancy_estimated,
    payment_method: parsed.data.payment_method,
    card_fee_pct,
    tax_pct: parsed.data.tax_pct,
    target_margin_pct: parsed.data.target_margin_pct,
  };

  await prisma.clinicCostProfile.upsert({
    where: { clinic_id: session.clinic_id },
    create: { clinic_id: session.clinic_id, ...data },
    update: data,
  });

  return Response.json({ success: true });
}
