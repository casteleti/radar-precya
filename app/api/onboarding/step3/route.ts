import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const procedureSchema = z.object({
  name: z.string().min(1).max(80).trim(),
  price: z.number().min(0.01),
  product_cost: z.number().min(0).default(0),
  commission_pct: z.number().min(0).max(100).default(0),
});

const schema = z.object({
  procedures: z.array(procedureSchema).min(1).max(20),
});

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Dados inválidos" }, { status: 400 });

  await prisma.procedure.createMany({
    data: parsed.data.procedures.map((p) => ({
      ...p,
      clinic_id: session.clinic_id,
    })),
  });

  return Response.json({ success: true });
}
