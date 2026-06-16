import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).max(80).trim(),
  price: z.number().min(0.01),
  time_minutes: z.number().int().min(1).max(600),
  return_time_minutes: z.number().int().min(0).max(600).default(0),
  product_cost: z.number().min(0).default(0),
  commission_pct: z.number().min(0).max(100).default(0),
});

export async function GET() {
  const session = await getServerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const procedures = await prisma.procedure.findMany({
    where: { clinic_id: session.clinic_id, active: true },
    orderBy: { name: "asc" },
  });

  return Response.json({ procedures });
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Dados inválidos" }, { status: 400 });

  const profile = await prisma.clinicCostProfile.findUnique({
    where: { clinic_id: session.clinic_id },
  });
  if (!profile) return Response.json({ error: "Configure os custos da clínica primeiro" }, { status: 400 });

  const card_fee_pct = profile.payment_method === "pix" ? 0 : profile.card_fee_pct;
  const percentual_sobre_venda =
    parsed.data.commission_pct / 100 + profile.tax_pct / 100 + card_fee_pct / 100;

  if (percentual_sobre_venda >= 0.9) {
    return Response.json(
      {
        error:
          "Os percentuais estão muito altos para calcular um preço saudável. Revise comissão, imposto, taxa ou margem desejada.",
      },
      { status: 400 }
    );
  }

  const procedure = await prisma.procedure.create({
    data: { ...parsed.data, clinic_id: session.clinic_id },
  });

  return Response.json({ success: true, id: procedure.id });
}
