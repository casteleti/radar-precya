import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProcedureDetailClient from "./ProcedureDetailClient";

export default async function ProcedureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session) redirect("/auth/login");
  if (!session.onboarding_completed) redirect("/onboarding");

  const [procedure, costProfile, allProcedures] = await Promise.all([
    prisma.procedure.findUnique({ where: { id } }),
    prisma.clinicCostProfile.findUnique({ where: { clinic_id: session.clinic_id } }),
    prisma.procedure.findMany({ where: { clinic_id: session.clinic_id, active: true } }),
  ]);

  if (!procedure || procedure.clinic_id !== session.clinic_id) {
    redirect("/procedimentos");
  }

  return (
    <ProcedureDetailClient
      clinicName={session.clinic_name}
      procedure={{
        id: procedure.id,
        name: procedure.name,
        price: procedure.price,
        product_cost: procedure.product_cost,
        commission_pct: procedure.commission_pct,
        time_minutes: procedure.time_minutes,
        return_time_minutes: procedure.return_time_minutes,
        category: procedure.category,
      }}
      otherProcedures={allProcedures
        .filter((p) => p.id !== procedure.id)
        .map((p) => ({
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
