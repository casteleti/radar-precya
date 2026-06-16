import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  monthly_fixed_costs: z.number().min(0),
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
