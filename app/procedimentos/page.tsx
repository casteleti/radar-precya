import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProcedimentosClient from "./ProcedimentosClient";

export default async function ProcedimentosPage() {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");
  if (!session.onboarding_completed) redirect("/onboarding");

  const procedures = await prisma.procedure.findMany({
    where: { clinic_id: session.clinic_id, active: true },
    orderBy: { name: "asc" },
  });

  return (
    <ProcedimentosClient
      clinicName={session.clinic_name}
      procedures={procedures.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        product_cost: p.product_cost,
        commission_pct: p.commission_pct,
        time_minutes: p.time_minutes,
        return_time_minutes: p.return_time_minutes,
      }))}
    />
  );
}
