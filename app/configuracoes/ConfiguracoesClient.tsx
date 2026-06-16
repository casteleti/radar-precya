"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, parseCurrency } from "@/lib/utils";
import { calculateCapacity, type PaymentMethod } from "@/lib/calculadora";
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
const TAX_OPTIONS = [4, 6, 8, 10];

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

function Stepper({
  value,
  onChange,
  min = 1,
  max = 31,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
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

export default function ConfiguracoesClient({ clinicName, costProfile }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [fixedCosts, setFixedCosts] = useState(costProfile?.monthly_fixed_costs ?? 0);
  const [fixedCostsDisplay, setFixedCostsDisplay] = useState(
    costProfile ? formatCurrency(costProfile.monthly_fixed_costs) : ""
  );

  const [daysPerMonth, setDaysPerMonth] = useState(costProfile?.days_per_month ?? 22);
  const [hoursPerDay, setHoursPerDay] = useState(costProfile?.hours_per_day ?? 8);
  const [occupancyPct, setOccupancyPct] = useState<number | null>(
    costProfile && !costProfile.occupancy_estimated ? costProfile.occupancy_pct : null
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    costProfile?.payment_method ?? "both"
  );
  const [cardFeePct, setCardFeePct] = useState(costProfile?.card_fee_pct ?? 4.5);
  const [taxPct, setTaxPct] = useState<number | null>(costProfile?.tax_pct ?? null);
  const [targetMarginPct, setTargetMarginPct] = useState(costProfile?.target_margin_pct ?? 35);

  const capacityResult = useMemo(
    () =>
      calculateCapacity({
        monthly_fixed_costs: fixedCosts,
        days_per_month: daysPerMonth,
        hours_per_day: hoursPerDay,
        occupancy_pct: occupancyPct ?? 70,
        payment_method: "both",
        card_fee_pct: 0,
        tax_pct: 0,
        target_margin_pct: 0,
      }),
    [fixedCosts, daysPerMonth, hoursPerDay, occupancyPct]
  );

  async function handleSave() {
    const occ = occupancyPct ?? 70;
    const estimated = occupancyPct === null;
    const tax = taxPct ?? 6;

    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_fixed_costs: fixedCosts,
          days_per_month: daysPerMonth,
          hours_per_day: hoursPerDay,
          occupancy_pct: occ,
          occupancy_estimated: estimated,
          payment_method: paymentMethod,
          card_fee_pct: cardFeePct,
          tax_pct: tax,
          target_margin_pct: targetMarginPct,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");

      setOccupancyPct(occ);
      setTaxPct(tax);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell clinicName={clinicName}>
      <main className="max-w-3xl mx-auto p-4 pt-6 flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A2E]">Configurações</h1>
          <p className="text-sm text-[#9999BB]">Olá, {clinicName} 👋</p>
        </div>

        <div className="bg-[#2E1A73] rounded-2xl shadow-sm p-5 text-center">
          <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Custo por hora atual</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(capacityResult.cost_per_hour)}</p>
          <p className="text-white/70 text-xs mt-1">
            {capacityResult.effective_hours.toFixed(0)}h efetivas de {capacityResult.hours_available.toFixed(0)}h/mês
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5F0] p-5">
          <h2 className="text-base font-semibold text-[#1A1A2E] mb-1">Custos mensais</h2>
          <p className="text-sm text-[#9999BB] mb-3">
            Inclui aluguel, equipe, marketing, sistemas, contador e demais despesas fixas.
          </p>
          <input
            type="text"
            inputMode="numeric"
            value={fixedCostsDisplay}
            onChange={(e) => {
              const v = parseCurrency(e.target.value);
              setFixedCosts(v);
              setFixedCostsDisplay(formatCurrency(v));
            }}
            placeholder="R$ 0,00"
            className="w-full h-12 px-4 rounded-xl border border-[#E5E5F0] text-lg font-semibold
                       focus:outline-none focus:ring-2 focus:ring-[#B79CFF] focus:border-[#5E3ECF]"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5F0] p-5">
          <h2 className="text-base font-semibold text-[#1A1A2E] mb-1">Capacidade da clínica</h2>
          <p className="text-sm text-[#9999BB] mb-4">Assim calculamos o custo por hora com mais precisão.</p>

          <div className="flex flex-col gap-6">
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
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5F0] p-5">
          <h2 className="text-base font-semibold text-[#1A1A2E] mb-1">Configuração financeira</h2>
          <p className="text-sm text-[#9999BB] mb-4">Essas informações impactam no preço final.</p>

          <div className="flex flex-col gap-5">
            <div>
              <p className="text-sm font-medium text-[#4A4A6A] mb-2">Como você recebe?</p>
              <div className="grid grid-cols-3 gap-2">
                <Chip active={paymentMethod === "pix"} onClick={() => setPaymentMethod("pix")}>PIX</Chip>
                <Chip active={paymentMethod === "card"} onClick={() => setPaymentMethod("card")}>Cartão</Chip>
                <Chip active={paymentMethod === "both"} onClick={() => setPaymentMethod("both")}>Ambos</Chip>
              </div>
            </div>

            {paymentMethod !== "pix" && (
              <div>
                <p className="text-sm font-medium text-[#4A4A6A] mb-2">Taxa média do cartão</p>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  max={20}
                  value={cardFeePct}
                  onChange={(e) => setCardFeePct(Number(e.target.value))}
                  className="w-full h-11 px-4 rounded-xl border border-[#E5E5F0] text-base
                             focus:outline-none focus:ring-2 focus:ring-[#B79CFF] focus:border-[#5E3ECF]"
                />
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-[#4A4A6A] mb-2">Tributação aproximada</p>
              <div className="grid grid-cols-3 gap-2">
                {TAX_OPTIONS.map((t) => (
                  <Chip key={t} active={taxPct === t} onClick={() => setTaxPct(t)}>{t}%</Chip>
                ))}
                <Chip active={taxPct === null} onClick={() => setTaxPct(null)}>Não sei</Chip>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-[#4A4A6A]">Margem desejada</p>
                <span className="text-lg font-bold text-[#5E3ECF]">{targetMarginPct}%</span>
              </div>
              <input
                type="range"
                min={15}
                max={60}
                step={5}
                value={targetMarginPct}
                onChange={(e) => setTargetMarginPct(Number(e.target.value))}
                className="w-full accent-[#5E3ECF] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-[#E65A5A]">{error}</p>}
        {saved && <p className="text-sm text-[#5E3ECF]">Alterações salvas com sucesso!</p>}

        <button
          onClick={handleSave}
          disabled={loading || fixedCosts <= 0}
          className="h-12 bg-[#5E3ECF] text-white rounded-xl font-semibold hover:bg-[#7C4DFF]
                     transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar alterações"}
        </button>
      </main>
    </AppShell>
  );
}
