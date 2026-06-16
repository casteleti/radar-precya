import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProcedimentosClient from "./ProcedimentosClient";

export default async function ProcedimentosPage() {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");
  if (!session.onboarding_completed) redirect("/onboarding");

  const [procedures, costProfile] = await Promise.all([
    prisma.procedure.findMany({
      where: { clinic_id: session.clinic_id, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.clinicCostProfile.findUnique({ where: { clinic_id: session.clinic_id } }),
  ]);

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
      clinic={
        costProfile
          ? {
              monthly_fixed_costs: costProfile.monthly_fixed_costs,
              days_per_month: costProfile.days_per_month,
              hours_per_day: costProfile.hours_per_day,
              occupancy_pct: costProfile.occupancy_pct,
              payment_method: costProfile.payment_method,
              card_fee_pct: costProfile.card_fee_pct,
              tax_pct: costProfile.tax_pct,
              target_margin_pct: costProfile.target_margin_pct,
            }
          : null
      }
    />
  );
}
