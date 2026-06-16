import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");
  if (session.onboarding_completed) redirect("/calculadora");

  const profile = await prisma.clinicCostProfile.findUnique({
    where: { clinic_id: session.clinic_id },
  });
  const procedures = await prisma.procedure.findMany({
    where: { clinic_id: session.clinic_id, active: true },
  });

  // Detectar passo atual
  let initialStep = 1;
  if (session.clinic_name && session.clinic_name.trim()) initialStep = 2;
  if (profile) initialStep = 3;
  if (procedures.length > 0) initialStep = 4;

  return (
    <OnboardingClient
      initialStep={initialStep}
      initialClinicName={session.clinic_name ?? ""}
      initialProfile={profile ? {
        monthly_fixed_costs: profile.monthly_fixed_costs,
        monthly_appointments: profile.monthly_appointments,
      } : null}
      initialProcedures={procedures.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        product_cost: p.product_cost,
        commission_pct: p.commission_pct,
      }))}
    />
  );
}
