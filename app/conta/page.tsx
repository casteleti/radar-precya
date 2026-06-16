import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import ContaClient from "./ContaClient";

export default async function ContaPage() {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");
  if (!session.onboarding_completed) redirect("/onboarding");

  return (
    <ContaClient
      name={session.name}
      email={session.email}
      clinicName={session.clinic_name}
    />
  );
}
