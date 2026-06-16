import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OperacaoClient from "./OperacaoClient";

export default async function OperacaoPage() {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");
  if (!session.onboarding_completed) redirect("/onboarding");

  const costProfile = await prisma.clinicCostProfile.findUnique({
    where: { clinic_id: session.clinic_id },
  });

  return (
    <OperacaoClient
      clinicName={session.clinic_name}
      costProfile={
        costProfile
          ? {
              monthly_fixed_costs: costProfile.monthly_fixed_costs,
              days_per_month: costProfile.days_per_month,
              hours_per_day: costProfile.hours_per_day,
              occupancy_pct: costProfile.occupancy_pct,
              occupancy_estimated: costProfile.occupancy_estimated,
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
