import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COST_CATEGORIES } from "@/lib/costCategories";

const CATEGORY_VALUES = COST_CATEGORIES.map((c) => c.value) as [string, ...string[]];

const schema = z.object({
  description: z.string().min(1).max(80).trim(),
  category: z.enum(CATEGORY_VALUES),
  monthly_value: z.number().min(0),
});

export async function GET() {
  const session = await getServerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.clinicCostItem.findMany({
    where: { clinic_id: session.clinic_id },
    orderBy: { created_at: "asc" },
  });

  return Response.json({ items });
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Dados inválidos" }, { status: 400 });

  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.clinicCostItem.create({
      data: { ...parsed.data, clinic_id: session.clinic_id },
    });

    const items = await tx.clinicCostItem.findMany({
      where: { clinic_id: session.clinic_id },
    });
    const total = items.reduce((sum, i) => sum + i.monthly_value, 0);

    await tx.clinicCostProfile.upsert({
      where: { clinic_id: session.clinic_id },
      create: { clinic_id: session.clinic_id, monthly_fixed_costs: total },
      update: { monthly_fixed_costs: total },
    });

    return created;
  });

  return Response.json({ item });
}
