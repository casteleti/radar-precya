"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, parseCurrency } from "@/lib/utils";
import { calculateCapacity, type PaymentMethod } from "@/lib/calculadora";
import { COST_CATEGORIES } from "@/lib/costCategories";
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
  payment_method: PaymentMethod;
  card_fee_pct: number;
  tax_pct: number;
  target_margin_pct: number;
}

interface Props {
  clinicName: string;
  initialItems: CostItem[];
  costProfile: CostProfile | null;
}

type Row = CostItem & { isNew?: boolean; saving?: boolean };

const CATEGORY_ICONS: Record<string, string> = {
  aluguel: "🏠",
  equipe: "👥",
  pro_labore: "💼",
  marketing: "📣",
  softwares: "💻",
  contador: "🧾",
  equipamentos: "🛠️",
  agua_luz_internet: "💡",
  outros: "📦",
};

function categoryIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? "📦";
}

let tempIdCounter = 0;
function tempId() {
  tempIdCounter += 1;
  return `temp-${tempIdCounter}`;
}

export default function ItensClient({ clinicName, initialItems, costProfile }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initialItems);
  const [error, setError] = useState("");

  const totalMensal = rows.reduce((sum, r) => sum + r.monthly_value, 0);

  const capacity = useMemo(() => {
    if (!costProfile) return null;
    return calculateCapacity({
      monthly_fixed_costs: totalMensal,
      days_per_month: costProfile.days_per_month,
      hours_per_day: costProfile.hours_per_day,
      occupancy_pct: costProfile.occupancy_pct,
      payment_method: costProfile.payment_method,
      card_fee_pct: costProfile.card_fee_pct,
      tax_pct: costProfile.tax_pct,
      target_margin_pct: costProfile.target_margin_pct,
    });
  }, [costProfile, totalMensal]);

  function addRow() {
    setRows([...rows, { id: tempId(), description: "", category: "outros", monthly_value: 0, isNew: true }]);
  }

  function updateRow(id: string, patch: Partial<Row>) {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRowLocally(id: string) {
    setRows(rows.filter((r) => r.id !== id));
  }

  async function deleteItem(row: Row) {
    if (row.isNew) {
      removeRowLocally(row.id);
      return;
    }
    removeRowLocally(row.id);
    try {
      const res = await fetch(`/api/cost-items/${row.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("Erro ao remover custo");
      setRows((prev) => [...prev, row]);
    }
  }

  async function saveRow(row: Row) {
    if (!row.description.trim()) return;
    setError("");
    const body = {
      description: row.description.trim(),
      category: row.category,
      monthly_value: row.monthly_value,
    };
    try {
      if (row.isNew) {
        const res = await fetch("/api/cost-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Erro ao salvar");
        updateRow(row.id, { id: data.item.id, isNew: false });
      } else {
        const res = await fetch(`/api/cost-items/${row.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  }

  return (
    <AppShell clinicName={clinicName}>
      <main className="max-w-3xl mx-auto p-4 pt-6 flex flex-col gap-4">
        <div>
          <button
            onClick={() => router.push("/custos")}
            className="text-sm text-[#5E3ECF] font-medium mb-2"
          >
            ‹ Custos
          </button>
          <h1 className="text-xl font-semibold text-[#1A1A2E]">Editar custos</h1>
          <p className="text-sm text-[#9999BB]">Altere os valores dos custos fixos da sua clínica.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-4">
            <p className="text-xs text-[#9999BB]">Total de custos mensais</p>
            <p className="text-xl font-bold text-[#1A1A2E]">{formatCurrency(totalMensal)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-4">
            <p className="text-xs text-[#9999BB]">Custo operacional</p>
            <p className="text-xl font-bold text-[#5E3ECF]">{formatCurrency(capacity?.cost_per_hour ?? 0)}/h</p>
            <p className="text-[10px] text-[#9999BB] mt-1">Calculado automaticamente com base nas suas configurações.</p>
          </div>
        </div>

        {error && <p className="text-sm text-[#E65A5A]">{error}</p>}

        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-4 flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-[#EDE9FF] flex items-center justify-center text-base shrink-0">
                  {categoryIcon(row.category)}
                </span>
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => updateRow(row.id, { description: e.target.value })}
                    onBlur={() => saveRow(row)}
                    placeholder="Descrição do custo"
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E5F0] text-sm font-medium
                               focus:outline-none focus:ring-2 focus:ring-[#B79CFF] focus:border-[#5E3ECF]"
                  />
                  <div className="flex gap-2">
                    <select
                      value={row.category}
                      onChange={(e) => {
                        updateRow(row.id, { category: e.target.value });
                        saveRow({ ...row, category: e.target.value });
                      }}
                      className="flex-1 h-10 px-2 rounded-lg border border-[#E5E5F0] text-xs
                                 focus:outline-none focus:ring-2 focus:ring-[#B79CFF]"
                    >
                      {COST_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={row.monthly_value ? formatCurrency(row.monthly_value) : ""}
                      onChange={(e) => updateRow(row.id, { monthly_value: parseCurrency(e.target.value) })}
                      onBlur={() => saveRow(row)}
                      placeholder="R$ 0,00"
                      className="w-32 h-10 px-3 rounded-lg border border-[#E5E5F0] text-sm text-right
                                 focus:outline-none focus:ring-2 focus:ring-[#B79CFF]"
                    />
                  </div>
                </div>
                <button
                  onClick={() => deleteItem(row)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[#9999BB] hover:text-[#E65A5A] hover:bg-[#FFF0F0] transition-all shrink-0"
                  aria-label="Remover custo"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addRow}
          className="h-12 bg-white border border-dashed border-[#B79CFF] text-[#5E3ECF] rounded-xl font-semibold
                     hover:bg-[#EDE9FF] transition-all active:scale-95"
        >
          + Adicionar custo
        </button>
      </main>
    </AppShell>
  );
}
