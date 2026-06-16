"use client";

import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { calculateCapacity, type PaymentMethod } from "@/lib/calculadora";
import AppShell from "@/app/components/AppShell";

interface CostItem {
  id: string;
  description: string;
  category: string;
  monthly_value: number;
}

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
  costItems: CostItem[];
  costProfile: CostProfile | null;
}

export default function CustosClient({ clinicName, costItems, costProfile }: Props) {
  const router = useRouter();

  const totalCostItems = costItems.reduce((sum, i) => sum + i.monthly_value, 0);

  const capacity = costProfile
    ? calculateCapacity({
        monthly_fixed_costs: costProfile.monthly_fixed_costs,
        days_per_month: costProfile.days_per_month,
        hours_per_day: costProfile.hours_per_day,
        occupancy_pct: costProfile.occupancy_pct,
        payment_method: costProfile.payment_method,
        card_fee_pct: costProfile.card_fee_pct,
        tax_pct: costProfile.tax_pct,
        target_margin_pct: costProfile.target_margin_pct,
      })
    : null;

  return (
    <AppShell clinicName={clinicName}>
      <main className="max-w-5xl mx-auto p-4 pt-6 flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A2E]">Custos</h1>
          <p className="text-sm text-[#9999BB]">Olá, {clinicName} 👋</p>
        </div>

        <div className="bg-[#2E1A73] rounded-2xl shadow-sm p-6 text-center">
          <span className="text-2xl">🧮</span>
          <p className="text-white/70 text-xs uppercase tracking-wide mt-2 mb-1">Custo operacional</p>
          <p className="text-4xl font-bold text-white">
            {formatCurrency(capacity?.cost_per_hour ?? 0)} <span className="text-lg font-medium">/h</span>
          </p>
          <p className="text-white/70 text-sm mt-2">
            É quanto custa manter sua clínica funcionando por hora.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-[#1A1A2E] mb-3">Seu resumo financeiro</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-[#EDE9FF] flex items-center justify-center text-lg">🏢</span>
                <div>
                  <p className="text-xs font-medium text-[#9999BB] uppercase tracking-wide">Custos mensais</p>
                  <p className="font-semibold text-[#1A1A2E]">Estrutura da clínica</p>
                </div>
              </div>
              <p className="text-sm text-[#9999BB]">
                Todos os custos fixos para manter sua clínica funcionando.
              </p>
              <div>
                <p className="text-2xl font-bold text-[#1A1A2E]">{formatCurrency(totalCostItems)}</p>
                <p className="text-xs text-[#9999BB]">Total dos custos fixos mensais</p>
              </div>
              <button
                onClick={() => router.push("/custos/itens")}
                className="mt-1 text-sm font-semibold text-[#5E3ECF] text-left hover:text-[#7C4DFF]"
              >
                Editar →
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-[#EDE9FF] flex items-center justify-center text-lg">⏱️</span>
                <div>
                  <p className="text-xs font-medium text-[#9999BB] uppercase tracking-wide">Como você funciona</p>
                  <p className="font-semibold text-[#1A1A2E]">Operação</p>
                </div>
              </div>
              <p className="text-sm text-[#9999BB]">
                Defina como sua clínica opera no dia a dia.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#FAFAFE] rounded-xl p-2 text-center">
                  <p className="text-sm font-semibold text-[#1A1A2E]">{costProfile?.days_per_month ?? "-"}</p>
                  <p className="text-[10px] text-[#9999BB]">dias/mês</p>
                </div>
                <div className="bg-[#FAFAFE] rounded-xl p-2 text-center">
                  <p className="text-sm font-semibold text-[#1A1A2E]">{costProfile?.hours_per_day ?? "-"}</p>
                  <p className="text-[10px] text-[#9999BB]">h/dia</p>
                </div>
                <div className="bg-[#FAFAFE] rounded-xl p-2 text-center">
                  <p className="text-sm font-semibold text-[#1A1A2E]">{costProfile?.occupancy_pct ?? "-"}%</p>
                  <p className="text-[10px] text-[#9999BB]">ocupação</p>
                </div>
              </div>
              <button
                onClick={() => router.push("/custos/operacao")}
                className="mt-1 text-sm font-semibold text-[#5E3ECF] text-left hover:text-[#7C4DFF]"
              >
                Editar →
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-[#EDE9FF] flex items-center justify-center text-lg">💳</span>
                <div>
                  <p className="text-xs font-medium text-[#9999BB] uppercase tracking-wide">Parâmetros financeiros</p>
                  <p className="font-semibold text-[#1A1A2E]">Financeiro</p>
                </div>
              </div>
              <p className="text-sm text-[#9999BB]">
                Configure taxas, impostos e margem desejada.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#FAFAFE] rounded-xl p-2 text-center">
                  <p className="text-sm font-semibold text-[#1A1A2E]">{costProfile?.card_fee_pct ?? "-"}%</p>
                  <p className="text-[10px] text-[#9999BB]">cartão</p>
                </div>
                <div className="bg-[#FAFAFE] rounded-xl p-2 text-center">
                  <p className="text-sm font-semibold text-[#1A1A2E]">{costProfile?.tax_pct ?? "-"}%</p>
                  <p className="text-[10px] text-[#9999BB]">imposto</p>
                </div>
                <div className="bg-[#FAFAFE] rounded-xl p-2 text-center">
                  <p className="text-sm font-semibold text-[#1A1A2E]">{costProfile?.target_margin_pct ?? "-"}%</p>
                  <p className="text-[10px] text-[#9999BB]">margem</p>
                </div>
              </div>
              <button
                onClick={() => router.push("/custos/financeiro")}
                className="mt-1 text-sm font-semibold text-[#5E3ECF] text-left hover:text-[#7C4DFF]"
              >
                Editar →
              </button>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
