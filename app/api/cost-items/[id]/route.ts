import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COST_CATEGORIES } from "@/lib/costCategories";

const CATEGORY_VALUES = COST_CATEGORIES.map((c) => c.value) as [string, ...string[]];

const schema = z.object({
  description: z.string().min(1).max(80).trim(),
  category: z.enum(CATEGORY_VALUES),
  monthly_value: z.number().min(0),
});

async function recomputeTotal(tx: Prisma.TransactionClient, clinic_id: string) {
  const items = await tx.clinicCostItem.findMany({ where: { clinic_id } });
  const total = items.reduce((sum, i) => sum + i.monthly_value, 0);
  await tx.clinicCostProfile.upsert({
    where: { clinic_id },
    create: { clinic_id, monthly_fixed_costs: total },
    update: { monthly_fixed_costs: total },
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.clinicCostItem.findUnique({ where: { id } });
  if (!existing || existing.clinic_id !== session.clinic_id) {
    return Response.json({ error: "Custo não encontrado" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Dados inválidos" }, { status: 400 });

  const item = await prisma.$transaction(async (tx) => {
    const updated = await tx.clinicCostItem.update({
      where: { id },
      data: parsed.data,
    });
    await recomputeTotal(tx, session.clinic_id);
    return updated;
  });

  return Response.json({ item });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.clinicCostItem.findUnique({ where: { id } });
  if (!existing || existing.clinic_id !== session.clinic_id) {
    return Response.json({ error: "Custo não encontrado" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.clinicCostItem.delete({ where: { id } });
    await recomputeTotal(tx, session.clinic_id);
  });

  return Response.json({ success: true });
}
