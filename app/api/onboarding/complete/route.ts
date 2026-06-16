import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: session.user_id },
    data: { onboarding_completed: true },
  });

  return Response.json({ success: true });
}
