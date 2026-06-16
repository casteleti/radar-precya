"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  simulate,
  calculateInsights,
  generateWhatsAppMessage,
  classificationLabel,
  type ClinicCapacity,
} from "@/lib/calculadora";
import { formatCurrency } from "@/lib/utils";

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

const DISCOUNT_CHIPS = [0, 5, 10, 15, 20];

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
      className={`h-10 px-3 rounded-xl font-medium text-sm border transition-all active:scale-95 ${
        active
          ? "bg-[#5E3ECF] text-white border-[#5E3ECF]"
          : "bg-white text-[#4A4A6A] border-[#E5E5F0] hover:border-[#B79CFF]"
      }`}
    >
      {children}
    </button>
  );
}

export default function CalculadoraClient({ clinicName, clinic, procedures }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(procedures[0]?.id ?? "");
  const [discount, setDiscount] = useState(0);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const procedure = procedures.find((p) => p.id === selectedId);

  const result = useMemo(() => {
    if (!procedure) return null;
    return simulate(clinic, procedure, discount);
  }, [procedure, clinic, discount]);

  const insights = useMemo(() => calculateInsights(clinic, procedures), [clinic, procedures]);

  const whatsappText = useMemo(() => {
    if (!result || !procedure) return "";
    return generateWhatsAppMessage(procedure.name, discount, result.final_price, procedure.price, result.status);
  }, [result, procedure, discount]);

  async function handleCopy() {
    await navigator.clipboard.writeText(whatsappText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth/login";
  }

  const classification = result && result.valid ? classificationLabel(result.margin_pct) : null;

  return (
    <div className="min-h-screen bg-[#FAFAFE]">
      <header className="bg-white border-b border-[#E5E5F0] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[#2E1A73]">Radar Precya</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#9999BB] hidden sm:inline">Olá, {clinicName} 👋</span>
            <button onClick={() => router.push("/procedimentos")} className="text-xs text-[#5E3ECF] font-medium hover:text-[#7C4DFF]">
              Procedimentos
            </button>
            <button onClick={handleLogout} className="text-xs text-[#9999BB] hover:text-[#4A4A6A]">Sair</button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 pt-6 pb-28 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E5F0] p-4">
          <select
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setDiscount(0); }}
            className="w-full h-11 px-4 rounded-xl border border-[#E5E5F0] text-base text-[#1A1A2E]
                       focus:outline-none focus:ring-2 focus:ring-[#B79CFF] focus:border-[#5E3ECF]
                       bg-white cursor-pointer font-medium"
          >
            {procedures.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</option>
            ))}
          </select>
        </div>

        {result && !result.valid && (
          <div className="bg-[#FFF0F0] border border-[#FFD0D0] rounded-2xl p-4 text-sm text-[#E65A5A]">
            {result.error}
          </div>
        )}

        {result && result.valid && (
          <>
            <div className="bg-[#2E1A73] rounded-2xl p-6 text-center">
              <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Preço saudável</p>
              <p className="text-4xl font-bold text-white">{formatCurrency(result.preco_saudavel)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-[#E5E5F0] p-3 text-center">
                <p className="text-xs text-[#9999BB]">Preço mínimo</p>
                <p className="font-semibold text-[#1A1A2E]">{formatCurrency(result.preco_minimo)}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E5E5F0] p-3 text-center">
                <p className="text-xs text-[#9999BB]">Preço premium</p>
                <p className="font-semibold text-[#1A1A2E]">{formatCurrency(result.preco_premium)}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E5F0] p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-[#4A4A6A]">Simular desconto</label>
                <span className="text-lg font-bold text-[#5E3ECF]">{discount}%</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DISCOUNT_CHIPS.map((d) => (
                  <Chip key={d} active={discount === d} onClick={() => setDiscount(d)}>{d}%</Chip>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl p-3 text-center ${classification?.emoji === "❌" ? "bg-[#FFF0F0]" : classification?.emoji === "⚠️" ? "bg-[#FFF8EB]" : "bg-[#EAFBF1]"}`}>
                <p className="text-xs text-[#9999BB]">Margem</p>
                <p className="font-semibold text-[#1A1A2E]">{result.margin_pct.toFixed(0)}%</p>
                <p className="text-xs mt-1">{classification?.emoji} {classification?.label}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E5E5F0] p-3 text-center">
                <p className="text-xs text-[#9999BB]">Lucro / lucro por hora</p>
                <p className="font-semibold text-[#1A1A2E]">{formatCurrency(result.profit)}</p>
                <p className="text-xs text-[#9999BB]">{formatCurrency(result.profit_per_hour)}/h</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E5F0] p-4 flex items-center justify-between">
              <span className="text-sm text-[#4A4A6A]">Desconto máximo seguro</span>
              <span className="font-semibold text-[#5E3ECF]">{result.desconto_maximo_seguro.toFixed(0)}%</span>
            </div>

            {result.below_minimo && (
              <div className="bg-[#FFF0F0] border border-[#FFD0D0] rounded-2xl p-4 text-sm text-[#E65A5A]">
                ⚠ Atenção: seu preço atual pode estar abaixo do custo mínimo.
              </div>
            )}
            {!result.below_minimo && result.below_saudavel && (
              <div className="bg-[#FFF8EB] border border-[#FFE8B8] rounded-2xl p-4 text-sm text-[#B8860B]">
                ⚠ Seu preço atual já está abaixo do preço saudável recomendado.
              </div>
            )}

            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="text-sm text-[#5E3ECF] font-medium text-left"
            >
              {showBreakdown ? "Ocultar" : "Ver"} detalhamento do custo total {showBreakdown ? "▲" : "▼"}
            </button>

            {showBreakdown && (
              <div className="bg-white rounded-2xl border border-[#E5E5F0] p-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between"><span className="text-[#9999BB]">Insumos</span><span>{formatCurrency(result.breakdown.insumos)}</span></div>
                <div className="flex justify-between"><span className="text-[#9999BB]">Comissão</span><span>{formatCurrency(result.breakdown.comissao)}</span></div>
                <div className="flex justify-between"><span className="text-[#9999BB]">Impostos</span><span>{formatCurrency(result.breakdown.impostos)}</span></div>
                <div className="flex justify-between"><span className="text-[#9999BB]">Taxas de recebimento</span><span>{formatCurrency(result.breakdown.taxas)}</span></div>
                <div className="flex justify-between"><span className="text-[#9999BB]">Tempo consumido</span><span>{formatCurrency(result.breakdown.tempo)}</span></div>
                <div className="flex justify-between font-semibold text-[#1A1A2E] pt-2 border-t border-[#E5E5F0]">
                  <span>Total</span><span>{formatCurrency(result.breakdown.total)}</span>
                </div>
              </div>
            )}

            {(insights.most_profitable_per_hour || insights.most_time_consuming || insights.needs_repricing) && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-[#4A4A6A]">✨ Insights da sua clínica</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {insights.most_profitable_per_hour && (
                    <div className="bg-white rounded-xl border border-[#E5E5F0] p-3">
                      <p className="text-xs text-[#9999BB]">🏆 Mais lucrativo por hora</p>
                      <p className="font-semibold text-[#1A1A2E]">{insights.most_profitable_per_hour.name}</p>
                      <p className="text-xs text-[#9999BB]">{formatCurrency(insights.most_profitable_per_hour.value)}/h</p>
                    </div>
                  )}
                  {insights.most_time_consuming && (
                    <div className="bg-white rounded-xl border border-[#E5E5F0] p-3">
                      <p className="text-xs text-[#9999BB]">⏱ Mais consome agenda</p>
                      <p className="font-semibold text-[#1A1A2E]">{insights.most_time_consuming.name}</p>
                      <p className="text-xs text-[#9999BB]">{insights.most_time_consuming.minutes} min</p>
                    </div>
                  )}
                  {insights.needs_repricing && (
                    <div className="bg-white rounded-xl border border-[#E5E5F0] p-3">
                      <p className="text-xs text-[#9999BB]">📈 Precisa reajuste</p>
                      <p className="font-semibold text-[#1A1A2E]">{insights.needs_repricing.name}</p>
                      <p className="text-xs text-[#9999BB]">Margem baixa</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {result && result.valid && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5F0] p-4">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setShowWhatsApp(true)}
              className="w-full h-12 bg-[#25D366] text-white rounded-xl font-semibold text-sm
                         hover:bg-[#1ebe5d] transition-all active:scale-95"
            >
              📱 Copiar mensagem
            </button>
          </div>
        </div>
      )}

      {showWhatsApp && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#1A1A2E]">📱 Mensagem WhatsApp</h2>
              <button onClick={() => setShowWhatsApp(false)} className="text-[#9999BB] hover:text-[#4A4A6A] text-xl">✕</button>
            </div>
            <div className="bg-[#ECE5DD] rounded-xl p-4 mb-4 text-sm text-[#1A1A2E] whitespace-pre-wrap leading-relaxed">
              {whatsappText}
            </div>
            <button
              onClick={handleCopy}
              className="w-full h-11 bg-[#5E3ECF] text-white rounded-xl font-semibold hover:bg-[#7C4DFF] transition-all active:scale-95"
            >
              {copied ? "✓ Copiado!" : "📋 Copiar mensagem"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
