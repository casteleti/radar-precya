"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  simulate,
  calculateInsights,
  calculateCapacity,
  classificationLabel,
  type ClinicCapacity,
} from "@/lib/calculadora";
import { formatCurrency } from "@/lib/utils";
import AppShell from "@/app/components/AppShell";

interface Procedure {
  id: string;
  name: string;
  price: number;
  product_cost: number;
  commission_pct: number;
  time_minutes: number;
  return_time_minutes: number;
}

interface Props {
  clinicName: string;
  clinic: ClinicCapacity;
  procedures: Procedure[];
}

function StatusDot({ status }: { status: "healthy" | "risk" | "loss" }) {
  const color = status === "healthy" ? "bg-[#1FAE63]" : status === "risk" ? "bg-[#B8860B]" : "bg-[#E65A5A]";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

export default function CalculadoraClient({ clinicName, clinic, procedures }: Props) {
  const router = useRouter();

  const capacity = useMemo(() => calculateCapacity(clinic), [clinic]);

  const results = useMemo(
    () => procedures.map((p) => ({ procedure: p, result: simulate(clinic, p, 0) })),
    [clinic, procedures]
  );

  const validResults = results.filter((r) => r.result.valid);

  const avgProfit =
    validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.result.profit, 0) / validResults.length
      : 0;
  const avgMargin =
    validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.result.margin_pct, 0) / validResults.length
      : 0;
  const avgProfitPerHour =
    validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.result.profit_per_hour, 0) / validResults.length
      : 0;
  const avgSafeDiscount =
    validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.result.desconto_maximo_seguro, 0) / validResults.length
      : 0;

  const marginClassification = classificationLabel(avgMargin);
  const isHealthy = avgMargin >= 25;

  const insights = useMemo(() => calculateInsights(clinic, procedures), [clinic, procedures]);

  return (
    <AppShell clinicName={clinicName}>
      <main className="max-w-6xl mx-auto p-4 pt-6 flex flex-col gap-6 lg:gap-8">
        {/* Greeting */}
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-[#1A1A2E]">Olá, {clinicName}! 👋</h1>
          <p className="text-sm text-[#9999BB] mt-1">Aqui está o resumo da saúde financeira da sua clínica.</p>
        </div>

        {/* Hero + status (desktop: side by side) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-gradient-to-br from-[#EDE9FF] to-white rounded-3xl p-6 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm text-[#4A4A6A] font-medium">Seu custo operacional</p>
              <span className="text-[#9999BB] text-xs" title="Custo fixo dividido pelas horas efetivas de atendimento">ⓘ</span>
            </div>
            <p className="text-4xl font-bold text-[#2E1A73]">
              {formatCurrency(capacity.cost_per_hour)} <span className="text-lg font-medium text-[#4A4A6A]">/h</span>
            </p>
            <p className="text-sm text-[#9999BB]">
              {capacity.effective_hours.toFixed(0)}h efetivas de {capacity.hours_available.toFixed(0)}h disponíveis este mês
            </p>
          </div>

          <div className="hidden lg:flex flex-col justify-between bg-white rounded-3xl border border-[#E5E5F0] shadow-sm p-6">
            <div>
              <p className={`font-semibold ${isHealthy ? "text-[#1FAE63]" : "text-[#B8860B]"}`}>
                {isHealthy ? "✓ Sua clínica está saudável!" : "⚠ Atenção à margem"}
              </p>
              <p className="text-sm text-[#9999BB] mt-1">
                Margem média de {avgMargin.toFixed(0)}% nos seus procedimentos.
              </p>
            </div>
            <button
              onClick={() => document.getElementById("procedimentos-section")?.scrollIntoView({ behavior: "smooth" })}
              className="mt-4 h-11 bg-[#EDE9FF] text-[#5E3ECF] rounded-xl font-medium text-sm hover:bg-[#E0D8FF] transition-all"
            >
              Ver análise completa
            </button>
          </div>
        </div>

        {/* Resumo rápido */}
        <div>
          <h2 className="text-sm font-semibold text-[#4A4A6A] mb-3">Resumo rápido</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-4">
              <span className="w-8 h-8 rounded-full bg-[#EDE9FF] flex items-center justify-center text-base mb-2">💰</span>
              <p className="text-xs text-[#9999BB]">Lucro médio</p>
              <p className="text-lg font-semibold text-[#1A1A2E]">{formatCurrency(avgProfit)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-4">
              <span className="w-8 h-8 rounded-full bg-[#EAFBF1] flex items-center justify-center text-base mb-2">📊</span>
              <p className="text-xs text-[#9999BB]">Margem média</p>
              <p className="text-lg font-semibold text-[#1A1A2E]">{avgMargin.toFixed(0)}%</p>
              <span className="text-xs">{marginClassification.emoji} {marginClassification.label}</span>
            </div>
            <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-4">
              <span className="w-8 h-8 rounded-full bg-[#E8F0FF] flex items-center justify-center text-base mb-2">⏱</span>
              <p className="text-xs text-[#9999BB]">Lucro por hora</p>
              <p className="text-lg font-semibold text-[#1A1A2E]">{formatCurrency(avgProfitPerHour)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-4">
              <span className="w-8 h-8 rounded-full bg-[#FFF3E0] flex items-center justify-center text-base mb-2">🏷️</span>
              <p className="text-xs text-[#9999BB]">Desconto seguro</p>
              <p className="text-lg font-semibold text-[#1A1A2E]">{avgSafeDiscount.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="procedimentos-section">
          {/* Procedimentos */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#4A4A6A]">Seus procedimentos</h2>
              <button onClick={() => router.push("/procedimentos")} className="text-xs text-[#5E3ECF] font-medium hover:text-[#7C4DFF]">
                Ver todos →
              </button>
            </div>

            {/* Mobile: card list */}
            <div className="flex flex-col gap-2 lg:hidden">
              {results.map(({ procedure, result }) => (
                <button
                  key={procedure.id}
                  onClick={() => router.push("/procedimentos")}
                  className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-4 flex items-center gap-3 text-left hover:border-[#B79CFF] transition-all active:scale-[0.99]"
                >
                  <span className="w-10 h-10 rounded-full bg-[#EDE9FF] flex items-center justify-center text-lg shrink-0">💉</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1A1A2E] truncate">{procedure.name}</p>
                    <p className="text-xs text-[#9999BB]">{procedure.time_minutes} min</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-[#1A1A2E]">{formatCurrency(procedure.price)}</p>
                    {result.valid ? (
                      <p className="text-xs text-[#9999BB] flex items-center gap-1 justify-end">
                        <StatusDot status={result.status} /> {result.margin_pct.toFixed(0)}% · {formatCurrency(result.profit_per_hour)}/h
                      </p>
                    ) : (
                      <p className="text-xs text-[#E65A5A]">Inválido</p>
                    )}
                  </div>
                  <span className="text-[#9999BB]">›</span>
                </button>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden lg:block bg-white rounded-2xl border border-[#E5E5F0] shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E5F0] text-left text-xs text-[#9999BB]">
                    <th className="py-3 px-4 font-medium">Procedimento</th>
                    <th className="py-3 px-4 font-medium">Preço</th>
                    <th className="py-3 px-4 font-medium">Margem</th>
                    <th className="py-3 px-4 font-medium">Lucro/h</th>
                    <th className="py-3 px-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(({ procedure, result }) => (
                    <tr
                      key={procedure.id}
                      onClick={() => router.push("/procedimentos")}
                      className="border-b border-[#E5E5F0] last:border-0 hover:bg-[#FAFAFE] cursor-pointer transition-all"
                    >
                      <td className="py-3 px-4 font-medium text-[#1A1A2E]">{procedure.name}</td>
                      <td className="py-3 px-4 text-[#4A4A6A]">{formatCurrency(procedure.price)}</td>
                      <td className="py-3 px-4">
                        {result.valid ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FAFAFE] text-xs font-medium text-[#4A4A6A]">
                            <StatusDot status={result.status} /> {result.margin_pct.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-xs text-[#E65A5A]">Inválido</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#4A4A6A]">{result.valid ? `${formatCurrency(result.profit_per_hour)}/h` : "—"}</td>
                      <td className="py-3 px-4 text-right text-[#9999BB]">›</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights + CTA (desktop right column) */}
          <div className="flex flex-col gap-4">
            {(insights.most_profitable_per_hour || insights.most_time_consuming || insights.needs_repricing) && (
              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold text-[#4A4A6A]">Insights para você</h2>

                {insights.most_profitable_per_hour && (
                  <div className="bg-[#EAFBF1] rounded-2xl p-4 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-base shrink-0">🏆</span>
                    <div>
                      <p className="text-xs text-[#4A4A6A]">Mais lucrativo por hora</p>
                      <p className="font-semibold text-[#1A1A2E]">{insights.most_profitable_per_hour.name}</p>
                      <p className="text-xs text-[#9999BB]">{formatCurrency(insights.most_profitable_per_hour.value)}/h</p>
                    </div>
                  </div>
                )}
                {insights.most_time_consuming && (
                  <div className="bg-[#FFF3E0] rounded-2xl p-4 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-base shrink-0">⏱</span>
                    <div>
                      <p className="text-xs text-[#4A4A6A]">Mais consome agenda</p>
                      <p className="font-semibold text-[#1A1A2E]">{insights.most_time_consuming.name}</p>
                      <p className="text-xs text-[#9999BB]">{insights.most_time_consuming.minutes} min</p>
                    </div>
                  </div>
                )}
                {insights.needs_repricing && (
                  <div className="bg-[#FDEAF3] rounded-2xl p-4 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-base shrink-0">📈</span>
                    <div>
                      <p className="text-xs text-[#4A4A6A]">Precisa reajuste</p>
                      <p className="font-semibold text-[#1A1A2E]">{insights.needs_repricing.name}</p>
                      <p className="text-xs text-[#9999BB]">Margem baixa</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-[#2E1A73] rounded-2xl p-5 flex flex-col gap-3">
              <p className="text-white text-sm leading-relaxed">
                ⚡ Cadastre mais procedimentos e descubra insights ainda mais poderosos para sua clínica.
              </p>
              <button
                onClick={() => router.push("/procedimentos")}
                className="h-11 bg-white text-[#2E1A73] rounded-xl font-semibold text-sm hover:bg-[#EDE9FF] transition-all active:scale-95"
              >
                + Novo procedimento
              </button>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
