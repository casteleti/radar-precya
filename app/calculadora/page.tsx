import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CalculadoraClient from "./CalculadoraClient";

export default async function CalculadoraPage() {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");
  if (!session.onboarding_completed) redirect("/onboarding");

  const [costProfile, procedures] = await Promise.all([
    prisma.clinicCostProfile.findUnique({ where: { clinic_id: session.clinic_id } }),
    prisma.procedure.findMany({
      where: { clinic_id: session.clinic_id, active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!costProfile || procedures.length === 0) redirect("/onboarding");

  return (
    <CalculadoraClient
      clinicName={session.clinic_name}
      costProfile={{ monthly_fixed_costs: costProfile.monthly_fixed_costs, monthly_appointments: costProfile.monthly_appointments }}
      procedures={procedures.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        product_cost: p.product_cost,
        commission_pct: p.commission_pct,
      }))}
    />
  );
}
