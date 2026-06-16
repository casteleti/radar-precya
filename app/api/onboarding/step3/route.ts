import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  days_per_month: z.number().int().min(1).max(31),
  hours_per_day: z.number().min(0.5).max(24),
  occupancy_pct: z.number().min(1).max(100),
  occupancy_estimated: z.boolean().default(false),
});

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Dados inválidos" }, { status: 400 });

  await prisma.clinicCostProfile.upsert({
    where: { clinic_id: session.clinic_id },
    create: { clinic_id: session.clinic_id, ...parsed.data },
    update: parsed.data,
  });

  return Response.json({ success: true });
}
