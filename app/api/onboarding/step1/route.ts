import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  clinic_name: z.string().min(2).max(80).trim(),
});

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Dados inválidos" }, { status: 400 });

  await prisma.clinic.update({
    where: { id: session.clinic_id },
    data: { name: parsed.data.clinic_name },
  });

  return Response.json({ success: true });
}
