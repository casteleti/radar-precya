import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");
  if (session.onboarding_completed) redirect("/calculadora");

  return <OnboardingClient initialClinicName={session.clinic_name ?? ""} />;
}
