"use client";

import { useState, useMemo } from "react";
import { simulate, generateWhatsAppMessage, type MarginStatus } from "@/lib/calculadora";
import { formatCurrency } from "@/lib/utils";

interface Procedure {
  id: string;
  name: string;
  price: number;
  product_cost: number;
  commission_pct: number;
}

interface Props {
  clinicName: string;
  costProfile: { monthly_fixed_costs: number; monthly_appointments: number };
  procedures: Procedure[];
}

function MarginBadge({ status }: { status: MarginStatus }) {
  const map = {
    healthy: { label: "✅ Margem Saudável", bg: "bg-green-50", text: "text-green-700" },
    risk:    { label: "⚠️ Margem em Risco", bg: "bg-amber-50",  text: "text-amber-700" },
    loss:    { label: "❌ Prejuízo",          bg: "bg-red-50",   text: "text-red-600"   },
  };
  const { label, bg, text } = map[status];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
      {label}
    </span>
  );
}

export default function CalculadoraClient({ clinicName, costProfile, procedures }: Props) {
  const [selectedId, setSelectedId] = useState(procedures[0]?.id ?? "");
  const [discount, setDiscount] = useState(0);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [copied, setCopied] = useState(false);

  const procedure = procedures.find((p) => p.id === selectedId);

  const result = useMemo(() => {
    if (!procedure) return null;
    return simulate({
      monthly_fixed_costs: costProfile.monthly_fixed_costs,
      monthly_appointments: costProfile.monthly_appointments,
      price: procedure.price,
      product_cost: procedure.product_cost,
      commission_pct: procedure.commission_pct,
      discount_pct: discount,
    });
  }, [procedure, costProfile, discount]);

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

  return (
    <div className="min-h-screen bg-[#F5F5FA]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5F0] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[#2E1A73]">Radar Precya</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#9999BB]">Olá, {clinicName} 👋</span>
            <button onClick={handleLogout} className="text-xs text-[#9999BB] hover:text-[#4A4A6A]">Sair</button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 pt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Coluna esquerda */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Seletor de procedimento */}
          <div className="bg-white rounded-2xl border border-[#E5E5F0] p-5">
            <label className="text-sm font-medium text-[#4A4A6A] block mb-2">Selecione o procedimento</label>
            <select
              value={selectedId}
              onChange={(e) => { setSelectedId(e.target.value); setDiscount(0); }}
              className="w-full h-11 px-4 rounded-xl border border-[#E5E5F0] text-base text-[#1A1A2E]
                         focus:outline-none focus:ring-2 focus:ring-[#B79CFF] focus:border-[#5E3ECF]
                         bg-white cursor-pointer"
            >
              {procedures.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</option>
              ))}
            </select>
          </div>

          {/* Resumo de custos */}
          {result && (
            <div className="bg-white rounded-2xl border border-[#E5E5F0] p-5">
              <h2 className="text-sm font-semibold text-[#4A4A6A] mb-3 uppercase tracking-wide">Sem desconto</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F5F5FA] rounded-xl p-3">
                  <p className="text-xs text-[#9999BB]">Custo por atendimento</p>
                  <p className="text-lg font-semibold text-[#1A1A2E]">{formatCurrency(result.cost_per_appointment)}</p>
                </div>
                <div className="bg-[#EDE9FF] rounded-xl p-3">
                  <p className="text-xs text-[#9999BB]">Lucro bruto</p>
                  <p className={`text-lg font-semibold ${result.profit_original > 0 ? "text-[#5E3ECF]" : "text-[#E65A5A]"}`}>
                    {formatCurrency(result.profit_original)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Slider de desconto */}
          {result && (
            <div className="bg-white rounded-2xl border border-[#E5E5F0] p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-[#4A4A6A]">Simular desconto</label>
                <span className="text-lg font-bold text-[#5E3ECF]">{discount}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full accent-[#5E3ECF] cursor-pointer"
              />
              <div className="flex justify-between text-xs text-[#9999BB] mt-1">
                <span>0%</span>
                <span>50%</span>
              </div>
            </div>
          )}
        </div>

        {/* Coluna direita — resultado */}
        {result && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-[#E5E5F0] p-5">
              <h2 className="text-sm font-semibold text-[#4A4A6A] mb-4 uppercase tracking-wide">
                {discount > 0 ? `Com ${discount}% de desconto` : "Resultado"}
              </h2>

              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs text-[#9999BB]">Preço final</p>
                  <p className="text-2xl font-bold text-[#1A1A2E]">{formatCurrency(result.final_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9999BB]">Lucro</p>
                  <p className={`text-xl font-semibold ${result.profit > 0 ? "text-[#2BAE66]" : "text-[#E65A5A]"}`}>
                    {formatCurrency(result.profit)}
                  </p>
                </div>
                <MarginBadge status={result.status} />
              </div>

              <button
                onClick={() => setShowWhatsApp(true)}
                className="mt-5 w-full h-10 bg-[#25D366] text-white rounded-xl font-semibold text-sm
                           hover:bg-[#1ebe5d] transition-all active:scale-95"
              >
                📱 Ver mensagem WhatsApp
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal WhatsApp */}
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
