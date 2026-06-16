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

export default function FinanceiroClient({ clinicName, costProfile }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(costProfile?.payment_method ?? "both");
  const [cardFeePct, setCardFeePct] = useState(costProfile?.card_fee_pct ?? 4.5);
  const [taxPct, setTaxPct] = useState<number | null>(costProfile?.tax_pct ?? null);
  const [targetMarginPct, setTargetMarginPct] = useState(costProfile?.target_margin_pct ?? 35);

  async function handleSave() {
    const tax = taxPct ?? 6;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_fixed_costs: costProfile?.monthly_fixed_costs ?? 0,
          days_per_month: costProfile?.days_per_month ?? 22,
          hours_per_day: costProfile?.hours_per_day ?? 8,
          occupancy_pct: costProfile?.occupancy_pct ?? 70,
          occupancy_estimated: costProfile?.occupancy_estimated ?? true,
          payment_method: paymentMethod,
          card_fee_pct: cardFeePct,
          tax_pct: tax,
          target_margin_pct: targetMarginPct,
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
          <h1 className="text-xl font-semibold text-[#1A1A2E]">Financeiro</h1>
          <p className="text-sm text-[#9999BB]">Configure taxas, impostos e margem desejada.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5F0] p-5 flex flex-col gap-5">
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
