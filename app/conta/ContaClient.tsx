"use client";

import AppShell from "@/app/components/AppShell";

interface Props {
  name: string | null;
  email: string;
  clinicName: string;
}

function getInitials(name: string | null, email: string): string {
  const source = name && name.trim() ? name.trim() : email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function ContaClient({ name, email, clinicName }: Props) {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth/login";
  }

  return (
    <AppShell clinicName={clinicName}>
      <main className="max-w-3xl mx-auto p-4 pt-6 flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-[#1A1A2E]">Conta</h1>

        <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-6 flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 rounded-full bg-[#EDE9FF] text-[#5E3ECF] flex items-center justify-center text-xl font-bold">
            {getInitials(name, email)}
          </div>
          <p className="font-semibold text-[#1A1A2E] text-lg">{name && name.trim() ? name : "Sem nome cadastrado"}</p>
          <p className="text-sm text-[#9999BB]">{email}</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-5">
          <p className="text-xs text-[#9999BB] mb-1">Clínica</p>
          <p className="font-semibold text-[#1A1A2E]">{clinicName}</p>
        </div>

        <button
          onClick={handleLogout}
          className="h-12 bg-white border border-[#E5E5F0] text-[#E65A5A] rounded-xl font-semibold
                     hover:border-[#E65A5A] transition-all active:scale-95"
        >
          Sair
        </button>
      </main>
    </AppShell>
  );
}
