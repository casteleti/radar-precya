"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type PaymentMethod } from "@/lib/calculadora";
import AppShell from "@/app/components/AppShell";

interface CostProfile {
  monthly_fixed_costs: number;
  days_per_month: number;
  hours_per_day: number;
  occupancy_pct: number;
  occupancy_estimated: boolean;
  payment_method: PaymentMethod;
  card_fee_pct: number;
  tax_pct: number;
  target_margin_pct: number;
}

interface Props {
  clinicName: string;
  costProfile: CostProfile | null;
}

const OCCUPANCY_OPTIONS = [30, 50, 70, 85];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 px-4 rounded-xl font-medium text-sm border transition-all active:scale-95 ${
        active
          ? "bg-[#5E3ECF] text-white border-[#5E3ECF]"
          : "bg-white text-[#4A4A6A] border-[#E5E5F0] hover:border-[#B79CFF]"
      }`}
    >
      {children}
    </button>
  );
}

function Stepper({ value, onChange, min = 1, max = 31 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center justify-center gap-6">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-11 h-11 rounded-full bg-[#EDE9FF] text-[#5E3ECF] text-xl font-bold active:scale-90 transition-all"
      >
        −
      </button>
      <span className="text-3xl font-bold text-[#1A1A2E] w-16 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-11 h-11 rounded-full bg-[#EDE9FF] text-[#5E3ECF] text-xl font-bold active:scale-90 transition-all"
      >
        +
      </button>
    </div>
  );
}

export default function OperacaoClient({ clinicName, costProfile }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [daysPerMonth, setDaysPerMonth] = useState(costProfile?.days_per_month ?? 22);
  const [hoursPerDay, setHoursPerDay] = useState(costProfile?.hours_per_day ?? 8);
  const [occupancyPct, setOccupancyPct] = useState<number | null>(
    costProfile && !costProfile.occupancy_estimated ? costProfile.occupancy_pct : null
  );

  async function handleSave() {
    const occ = occupancyPct ?? 70;
    const estimated = occupancyPct === null;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_fixed_costs: costProfile?.monthly_fixed_costs ?? 0,
          days_per_month: daysPerMonth,
          hours_per_day: hoursPerDay,
          occupancy_pct: occ,
          occupancy_estimated: estimated,
          payment_method: costProfile?.payment_method ?? "both",
          card_fee_pct: costProfile?.card_fee_pct ?? 0,
          tax_pct: costProfile?.tax_pct ?? 6,
          target_margin_pct: costProfile?.target_margin_pct ?? 35,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      router.push("/custos");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell clinicName={clinicName}>
      <main className="max-w-2xl mx-auto p-4 pt-6 flex flex-col gap-4">
        <div>
          <button
            onClick={() => router.push("/custos")}
            className="text-sm text-[#5E3ECF] font-medium mb-2"
          >
            ‹ Custos
          </button>
          <h1 className="text-xl font-semibold text-[#1A1A2E]">Operação</h1>
          <p className="text-sm text-[#9999BB]">Defina como sua clínica opera no dia a dia.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5F0] p-5 flex flex-col gap-6">
          <div>
            <p className="text-sm font-medium text-[#4A4A6A] mb-2 text-center">Dias por mês que você atende</p>
            <Stepper value={daysPerMonth} onChange={setDaysPerMonth} min={1} max={31} />
          </div>
          <div>
            <p className="text-sm font-medium text-[#4A4A6A] mb-2 text-center">Horas disponíveis por dia</p>
            <Stepper value={hoursPerDay} onChange={setHoursPerDay} min={1} max={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-[#4A4A6A] mb-2">Qual sua ocupação média atual?</p>
            <div className="grid grid-cols-2 gap-2">
              {OCCUPANCY_OPTIONS.map((o) => (
                <Chip key={o} active={occupancyPct === o} onClick={() => setOccupancyPct(o)}>
                  {o}%
                </Chip>
              ))}
              <Chip active={occupancyPct === null} onClick={() => setOccupancyPct(null)}>
                Não sei
              </Chip>
            </div>
            {occupancyPct === null && (
              <p className="text-xs text-[#9999BB] mt-2">Usamos 70% como estimativa.</p>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-[#E65A5A]">{error}</p>}

        <button
          onClick={handleSave}
          disabled={loading}
          className="h-12 bg-[#5E3ECF] text-white rounded-xl font-semibold hover:bg-[#7C4DFF]
                     transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar alterações"}
        </button>
      </main>
    </AppShell>
  );
}
