"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { simulate, classificationLabel, type ClinicCapacity, type ProcedureInput } from "@/lib/calculadora";
import { procedureCategoryIcon, procedureCategoryLabel } from "@/lib/procedureCategories";
import AppShell from "@/app/components/AppShell";

interface Procedure extends ProcedureInput {
  id: string;
  name: string;
  category: string;
}

interface Props {
  clinicName: string;
  procedure: Procedure;
  otherProcedures: ProcedureInput[];
  clinic: ClinicCapacity | null;
}

const DISCOUNT_CHIPS = [5, 10, 15, 20];

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

function statusPillStyle(emoji: string): string {
  if (emoji === "🟢") return "bg-[#EAFBF1] text-[#1F9D55]";
  if (emoji === "⚠️") return "bg-[#FFF8EB] text-[#B8860B]";
  return "bg-[#FFF0F0] text-[#E65A5A]";
}

function statusDotColor(emoji: string): string {
  if (emoji === "🟢") return "bg-[#1F9D55]";
  if (emoji === "⚠️") return "bg-[#B8860B]";
  return "bg-[#E65A5A]";
}

function bannerStyle(emoji: string): string {
  if (emoji === "🟢") return "bg-[#EAFBF1] text-[#1F9D55] border border-[#CDEFDB]";
  if (emoji === "⚠️") return "bg-[#FFF8EB] text-[#B8860B] border border-[#FFE8B8]";
  return "bg-[#FFF0F0] text-[#E65A5A] border border-[#FFD0D0]";
}

export default function ProcedureDetailClient({ clinicName, procedure, otherProcedures, clinic }: Props) {
  const router = useRouter();
  const [discount, setDiscount] = useState(0);

  const result = useMemo(() => {
    if (!clinic) return null;
    return simulate(clinic, procedure, 0);
  }, [clinic, procedure]);

  const discountResult = useMemo(() => {
    if (!clinic) return null;
    return simulate(clinic, procedure, discount);
  }, [clinic, procedure, discount]);

  const classification = result && result.valid ? classificationLabel(result.margin_pct) : null;

  const clinicAvgProfitPerHour = useMemo(() => {
    if (!clinic) return 0;
    const all = [procedure, ...otherProcedures];
    const results = all.map((p) => simulate(clinic, p, 0)).filter((r) => r.valid);
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + r.profit_per_hour, 0) / results.length;
  }, [clinic, procedure, otherProcedures]);

  const clinicAvgTime = useMemo(() => {
    const all = [procedure, ...otherProcedures];
    if (all.length === 0) return 0;
    return all.reduce((sum, p) => sum + p.time_minutes, 0) / all.length;
  }, [procedure, otherProcedures]);

  const isMostProfitable = useMemo(() => {
    if (!clinic || otherProcedures.length === 0 || !result || !result.valid) return false;
    const all = [{ ...procedure }, ...otherProcedures.map((p, i) => ({ ...p, id: `other-${i}`, name: "", category: "" }))];
    const results = all.map((p) => ({ id: "id" in p ? p.id : "", r: simulate(clinic, p, 0) }));
    const valid = results.filter((x) => x.r.valid);
    if (valid.length === 0) return false;
    const top = valid.reduce((a, b) => (b.r.profit_per_hour > a.r.profit_per_hour ? b : a));
    return top.id === procedure.id;
  }, [clinic, procedure, otherProcedures, result]);

  if (!clinic || !result) {
    return (
      <AppShell clinicName={clinicName}>
        <main className="max-w-3xl mx-auto p-4 pt-6">
          <p className="text-sm text-[#9999BB]">
            Configure os custos da clínica em Custos para ver a análise deste procedimento.
          </p>
        </main>
      </AppShell>
    );
  }

  if (!result.valid) {
    return (
      <AppShell clinicName={clinicName}>
        <main className="max-w-3xl mx-auto p-4 pt-6">
          <button onClick={() => router.push("/procedimentos")} className="text-sm text-[#5E3ECF] font-medium mb-4">
            ‹ Procedimentos
          </button>
          <div className="bg-[#FFF0F0] border border-[#FFD0D0] rounded-2xl p-4 text-sm text-[#E65A5A]">
            {result.error}
          </div>
        </main>
      </AppShell>
    );
  }

  const interpretationText = result.below_minimo
    ? "Este procedimento está abaixo do custo mínimo — ajuste urgente recomendado."
    : result.below_saudavel
      ? "Este procedimento está com margem apertada — considere revisar o preço."
      : "Este procedimento parece financeiramente saudável.";

  const profitPerHourTag =
    result.profit_per_hour > clinicAvgProfitPerHour * 1.05
      ? "Acima da média"
      : result.profit_per_hour < clinicAvgProfitPerHour * 0.95
        ? "Abaixo da média"
        : "Dentro da média";

  const timeTag = procedure.time_minutes > clinicAvgTime * 1.05 ? "Consome agenda" : "Tempo equilibrado";

  const insights: string[] = [];
  if (isMostProfitable && otherProcedures.length > 0) {
    insights.push("Entre os procedimentos com melhor retorno por hora da sua clínica.");
  }
  if (timeTag === "Consome agenda") {
    insights.push("Consome um tempo médio alto da sua agenda em relação aos demais procedimentos.");
  }
  if (clinic.target_margin_pct > 0) {
    if (result.margin_pct >= clinic.target_margin_pct) {
      insights.push("Sua margem está acima da meta definida para a clínica.");
    } else {
      insights.push("Sua margem está abaixo da meta definida para a clínica.");
    }
  }

  const breakdownItems = [
    { label: "Insumos", value: result.breakdown.insumos, color: "#7C4DFF" },
    { label: "Comissão", value: result.breakdown.comissao, color: "#5E3ECF" },
    { label: "Impostos", value: result.breakdown.impostos, color: "#B79CFF" },
    { label: "Taxas", value: result.breakdown.taxas, color: "#9999BB" },
    { label: "Tempo", value: result.breakdown.tempo, color: "#2E1A73" },
  ];
  const breakdownTotal = result.breakdown.total || 1;

  return (
    <AppShell clinicName={clinicName}>
      <main className="max-w-3xl mx-auto p-4 pt-6 flex flex-col gap-4">
        <div>
          <button onClick={() => router.push("/procedimentos")} className="text-sm text-[#5E3ECF] font-medium mb-2">
            ‹ Procedimentos
          </button>
          <p className="text-xs font-semibold text-[#9999BB] uppercase tracking-wide">
            {procedureCategoryIcon(procedure.category)} {procedureCategoryLabel(procedure.category)}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-[#1A1A2E]">{procedure.name}</h1>
            {classification && (
              <span className={`text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1 ${statusPillStyle(classification.emoji)}`}>
                <span className={`w-2 h-2 rounded-full ${statusDotColor(classification.emoji)}`} />
                {classification.label}
              </span>
            )}
          </div>
        </div>

        <div className={`rounded-2xl p-4 text-sm font-medium ${bannerStyle(classification?.emoji ?? "")}`}>
          {interpretationText}
        </div>

        <div className="bg-[#2E1A73] rounded-2xl shadow-sm p-6 text-center">
          <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Hoje você cobra</p>
          <p className="text-4xl font-bold text-white">{formatCurrency(result.current_price)}</p>
          <p className="text-white/80 text-sm mt-2">Sobram {formatCurrency(result.profit)} por atendimento</p>
          <p className="text-white/60 text-xs mt-1">{interpretationText}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-4 text-center flex flex-col gap-1">
            <span className="text-xl">🛡️</span>
            <p className="text-xs text-[#9999BB]">Preço mínimo</p>
            <p className="text-lg font-bold text-[#1A1A2E]">{formatCurrency(result.preco_minimo)}</p>
            <p className="text-[11px] text-[#9999BB]">Cobre os custos com folga.</p>
          </div>
          <div className="bg-[#EDE9FF] rounded-2xl border border-[#5E3ECF]/20 shadow-sm p-4 text-center flex flex-col gap-1">
            <span className="text-xl">⭐</span>
            <p className="text-xs text-[#5E3ECF]">Preço saudável</p>
            <p className="text-lg font-bold text-[#2E1A73]">{formatCurrency(result.preco_saudavel)}</p>
            <p className="text-[11px] text-[#5E3ECF]">Entrega a margem que você definiu.</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-4 text-center flex flex-col gap-1">
            <span className="text-xl">👑</span>
            <p className="text-xs text-[#9999BB]">Preço premium</p>
            <p className="text-lg font-bold text-[#1A1A2E]">{formatCurrency(result.preco_premium)}</p>
            <p className="text-[11px] text-[#9999BB]">Versão de mais valor agregado.</p>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-[#1A1A2E] mb-3">Indicadores financeiros</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-4">
              <p className="text-xs text-[#9999BB]">Lucro por hora</p>
              <p className="text-lg font-bold text-[#1A1A2E]">{formatCurrency(result.profit_per_hour)}</p>
              <p className="text-[11px] text-[#5E3ECF] mt-1">{profitPerHourTag}</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-4">
              <p className="text-xs text-[#9999BB]">Margem</p>
              <p className="text-lg font-bold text-[#1A1A2E]">{result.margin_pct.toFixed(0)}%</p>
              {classification && <p className="text-[11px] text-[#5E3ECF] mt-1">{classification.label}</p>}
            </div>
            <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-4">
              <p className="text-xs text-[#9999BB]">Tempo médio</p>
              <p className="text-lg font-bold text-[#1A1A2E]">{procedure.time_minutes} min</p>
              <p className="text-[11px] text-[#5E3ECF] mt-1">{timeTag}</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-4">
              <p className="text-xs text-[#9999BB]">Retorno por minuto</p>
              <p className="text-lg font-bold text-[#1A1A2E]">{formatCurrency(result.profit_per_hour / 60)}</p>
              <p className="text-[11px] text-[#9999BB] mt-1">Lucro por minuto de agenda</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-5">
          <h2 className="text-base font-semibold text-[#1A1A2E] mb-3">Desconto seguro</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {DISCOUNT_CHIPS.map((d) => (
              <Chip key={d} active={discount === d} onClick={() => setDiscount(discount === d ? 0 : d)}>
                {d}%
              </Chip>
            ))}
          </div>
          {discountResult && discountResult.valid && discount > 0 && (
            <p className="text-sm text-[#4A4A6A]">
              Com {discount}% de desconto → Preço: <strong className="text-[#1A1A2E]">{formatCurrency(discountResult.final_price)}</strong> → Você ainda lucra:{" "}
              <strong className={discountResult.profit > 0 ? "text-[#1F9D55]" : "text-[#E65A5A]"}>
                {formatCurrency(discountResult.profit)}
              </strong>
            </p>
          )}
          {discount === 0 && (
            <p className="text-sm text-[#9999BB]">Selecione um desconto para simular.</p>
          )}
          <p className="text-xs text-[#9999BB] mt-3">
            Desconto máximo seguro: <strong className="text-[#5E3ECF]">{result.desconto_maximo_seguro.toFixed(0)}%</strong>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-5">
          <h2 className="text-base font-semibold text-[#1A1A2E] mb-3">Composição do preço</h2>
          <div className="flex h-3 rounded-full overflow-hidden mb-4">
            {breakdownItems.map((item) => (
              <div
                key={item.label}
                style={{ width: `${(item.value / breakdownTotal) * 100}%`, backgroundColor: item.color }}
              />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {breakdownItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#4A4A6A]">{item.label}</span>
                </div>
                <span className="text-[#1A1A2E] font-medium">
                  {formatCurrency(item.value)} ({((item.value / breakdownTotal) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {insights.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-5">
            <h2 className="text-base font-semibold text-[#1A1A2E] mb-3">Insights</h2>
            <ul className="flex flex-col gap-2">
              {insights.map((text, i) => (
                <li key={i} className="text-sm text-[#4A4A6A] flex gap-2">
                  <span className="text-[#5E3ECF]">•</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => router.push("/procedimentos")}
          className="h-12 bg-[#5E3ECF] text-white rounded-xl font-semibold hover:bg-[#7C4DFF] transition-all active:scale-95"
        >
          Editar
        </button>
      </main>
    </AppShell>
  );
}
