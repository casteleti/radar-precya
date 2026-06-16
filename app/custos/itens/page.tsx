import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ItensClient from "./ItensClient";

export default async function ItensPage() {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");
  if (!session.onboarding_completed) redirect("/onboarding");

  const [costItems, costProfile] = await Promise.all([
    prisma.clinicCostItem.findMany({
      where: { clinic_id: session.clinic_id },
      orderBy: { created_at: "asc" },
    }),
    prisma.clinicCostProfile.findUnique({ where: { clinic_id: session.clinic_id } }),
  ]);

  return (
    <ItensClient
      clinicName={session.clinic_name}
      initialItems={costItems.map((i) => ({
        id: i.id,
        description: i.description,
        category: i.category,
        monthly_value: i.monthly_value,
      }))}
      costProfile={
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
