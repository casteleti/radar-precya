"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, parseCurrency } from "@/lib/utils";
import {
  simulate,
  classificationLabel,
  generateWhatsAppMessage,
  type ClinicCapacity,
  type SimulationResult,
} from "@/lib/calculadora";
import { PROCEDURE_CATEGORIES, procedureCategoryIcon, procedureCategoryLabel } from "@/lib/procedureCategories";
import AppShell from "@/app/components/AppShell";

interface Procedure {
  id: string;
  name: string;
  price: number;
  product_cost: number;
  commission_pct: number;
  time_minutes: number;
  return_time_minutes: number;
  category: string;
}

interface Props {
  clinicName: string;
  procedures: Procedure[];
  clinic: ClinicCapacity | null;
}

const BASE_TIME_OPTIONS = [15, 30, 45, 60];
const RETURN_TIME_OPTIONS = [0, 15, 30];
const DISCOUNT_CHIPS = [0, 5, 10, 15, 20];

type Badge = "Mais lucrativo" | "Maior oportunidade" | "Consome agenda" | "Baixo lucro/hora" | "Bom equilíbrio";

function computeBadges(
  clinic: ClinicCapacity,
  procedures: Procedure[]
): Map<string, Badge> {
  const badges = new Map<string, Badge>();
  if (procedures.length < 2) return badges;

  const results = procedures.map((p) => ({
    proc: p,
    result: simulate(clinic, p, 0) as SimulationResult,
  }));

  const valid = results.filter((r) => r.result.valid);
  if (valid.length === 0) return badges;

  // Mais lucrativo: highest profit_per_hour
  const mostProfitable = valid.reduce((a, b) => (b.result.profit_per_hour > a.result.profit_per_hour ? b : a));
  badges.set(mostProfitable.proc.id, "Mais lucrativo");

  // Maior oportunidade: largest gap among those below preco_saudavel
  const belowSaudavel = valid.filter((r) => r.result.current_price < r.result.preco_saudavel);
  if (belowSaudavel.length > 0) {
    const biggestGap = belowSaudavel.reduce((a, b) => {
      const gapA = (a.result.preco_saudavel - a.result.current_price) / a.result.current_price;
      const gapB = (b.result.preco_saudavel - b.result.current_price) / b.result.current_price;
      return gapB > gapA ? b : a;
    });
    if (!badges.has(biggestGap.proc.id)) {
      badges.set(biggestGap.proc.id, "Maior oportunidade");
    }
  }

  // Consome agenda: highest time_minutes
  const mostTime = results.reduce((a, b) => (b.proc.time_minutes > a.proc.time_minutes ? b : a));
  if (!badges.has(mostTime.proc.id)) {
    badges.set(mostTime.proc.id, "Consome agenda");
  }

  // Average profit per hour
  const avgProfitPerHour =
    valid.reduce((sum, r) => sum + r.result.profit_per_hour, 0) / valid.length;

  for (const r of valid) {
    if (badges.has(r.proc.id)) continue;
    if (r.result.profit_per_hour < avgProfitPerHour) {
      badges.set(r.proc.id, "Baixo lucro/hora");
    }
  }

  for (const r of results) {
    if (!badges.has(r.proc.id)) {
      badges.set(r.proc.id, "Bom equilíbrio");
    }
  }

  return badges;
}

function badgeStyle(badge: Badge): string {
  switch (badge) {
    case "Mais lucrativo":
      return "bg-[#EAFBF1] text-[#1F9D55]";
    case "Maior oportunidade":
      return "bg-[#EDE9FF] text-[#5E3ECF]";
    case "Consome agenda":
      return "bg-[#FFF8EB] text-[#B8860B]";
    case "Baixo lucro/hora":
      return "bg-[#FFF0F0] text-[#E65A5A]";
    default:
      return "bg-[#F5F5FA] text-[#9999BB]";
  }
}

function statusDotColor(margin_pct: number): string {
  const c = classificationLabel(margin_pct);
  if (c.emoji === "🟢") return "bg-[#1F9D55]";
  if (c.emoji === "⚠️") return "bg-[#B8860B]";
  return "bg-[#E65A5A]";
}

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

function emptyForm() {
  return {
    name: "",
    price: 0,
    priceDisplay: "",
    time: null as number | null,
    productCost: 0,
    productCostDisplay: "",
    hasCommission: null as boolean | null,
    commissionPct: 0,
    returnTime: 0,
    category: "outros",
  };
}

function formFromProcedure(p: Procedure) {
  return {
    name: p.name,
    price: p.price,
    priceDisplay: formatCurrency(p.price),
    time: p.time_minutes || null,
    productCost: p.product_cost,
    productCostDisplay: p.product_cost ? formatCurrency(p.product_cost) : "",
    hasCommission: p.commission_pct > 0,
    commissionPct: p.commission_pct,
    returnTime: p.return_time_minutes,
    category: p.category,
  };
}

export default function ProcedimentosClient({ clinicName, procedures, clinic }: Props) {
  const router = useRouter();
  const [list, setList] = useState(procedures);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [discount, setDiscount] = useState(0);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [copied, setCopied] = useState(false);

  function startEdit(p: Procedure) {
    setEditingId(p.id);
    setCreating(false);
    setForm(formFromProcedure(p));
    setDiscount(0);
    setError("");
  }

  function startCreate() {
    setCreating(true);
    setEditingId(null);
    setForm(emptyForm());
    setDiscount(0);
    setError("");
  }

  function cancel() {
    setEditingId(null);
    setCreating(false);
    setError("");
  }

  const timeOptions =
    form.time && !BASE_TIME_OPTIONS.includes(form.time)
      ? [...BASE_TIME_OPTIONS, form.time].sort((a, b) => a - b)
      : BASE_TIME_OPTIONS;

  async function handleSave() {
    if (!form.name.trim() || form.price <= 0 || !form.time) return;
    setLoading(true);
    setError("");
    const body = {
      name: form.name.trim(),
      price: form.price,
      time_minutes: form.time,
      return_time_minutes: form.returnTime,
      product_cost: form.productCost,
      commission_pct: form.hasCommission ? form.commissionPct : 0,
      category: form.category,
    };
    try {
      const url = editingId ? `/api/procedures/${editingId}` : "/api/procedures";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");

      if (editingId) {
        setList(list.map((p) => (p.id === editingId ? { ...p, ...body } : p)));
      } else {
        setList([...list, { id: data.id, ...body }].sort((a, b) => a.name.localeCompare(b.name)));
      }
      cancel();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  const showForm = creating || editingId !== null;

  // Live simulation preview for the form being edited/created
  const previewProcedure = useMemo(
    () => ({
      price: form.price,
      product_cost: form.productCost,
      commission_pct: form.hasCommission ? form.commissionPct : 0,
      time_minutes: form.time ?? 0,
      return_time_minutes: form.returnTime,
    }),
    [form]
  );

  const canSimulate = clinic !== null && form.price > 0 && !!form.time;

  const result = useMemo(() => {
    if (!clinic || !canSimulate) return null;
    return simulate(clinic, previewProcedure, discount);
  }, [clinic, canSimulate, previewProcedure, discount]);

  const classification = result && result.valid ? classificationLabel(result.margin_pct) : null;

  const whatsappText = useMemo(() => {
    if (!result || !result.valid) return "";
    return generateWhatsAppMessage(form.name || "procedimento", discount, result.final_price, form.price, result.status);
  }, [result, form.name, form.price, discount]);

  async function handleCopy() {
    await navigator.clipboard.writeText(whatsappText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const badges = useMemo(() => {
    if (!clinic) return new Map<string, Badge>();
    return computeBadges(clinic, list);
  }, [clinic, list]);

  const listResults = useMemo(() => {
    if (!clinic) return new Map<string, SimulationResult>();
    const map = new Map<string, SimulationResult>();
    for (const p of list) {
      map.set(p.id, simulate(clinic, p, 0));
    }
    return map;
  }, [clinic, list]);

  return (
    <AppShell clinicName={clinicName}>
      <main className="max-w-3xl mx-auto p-4 pt-6 flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A2E]">Procedimentos</h1>
          <p className="text-sm text-[#9999BB]">Olá, {clinicName} 👋</p>
        </div>

        {!showForm && (
          <>
            {list.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-8 text-center flex flex-col items-center gap-2">
                <span className="w-12 h-12 rounded-full bg-[#EDE9FF] flex items-center justify-center text-2xl">📋</span>
                <p className="font-semibold text-[#1A1A2E]">Nenhum procedimento cadastrado ainda</p>
                <p className="text-sm text-[#9999BB]">Cadastre seu primeiro procedimento para começar a calcular preços.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {list.map((p) => {
                  const result = listResults.get(p.id);
                  const badge = badges.get(p.id);
                  const classification = result && result.valid ? classificationLabel(result.margin_pct) : null;
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-4 flex flex-col gap-3 hover:border-[#B79CFF] transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">{procedureCategoryIcon(p.category)}</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1A1A2E] truncate">{p.name}</p>
                            <p className="text-xs text-[#9999BB]">{procedureCategoryLabel(p.category)}</p>
                          </div>
                        </div>
                        {badge && (
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${badgeStyle(badge)}`}>
                            {badge}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-[#FAFAFE] rounded-xl p-2 text-center">
                          <p className="text-[10px] text-[#9999BB]">Preço atual</p>
                          <p className="text-sm font-semibold text-[#1A1A2E]">{formatCurrency(p.price)}</p>
                        </div>
                        <div className="bg-[#FAFAFE] rounded-xl p-2 text-center">
                          <p className="text-[10px] text-[#9999BB]">Lucro/hora</p>
                          <p className="text-sm font-semibold text-[#1A1A2E]">
                            {result && result.valid ? formatCurrency(result.profit_per_hour) : "-"}
                          </p>
                        </div>
                        <div className="bg-[#FAFAFE] rounded-xl p-2 text-center">
                          <p className="text-[10px] text-[#9999BB]">Margem</p>
                          <p className="text-sm font-semibold text-[#1A1A2E] flex items-center justify-center gap-1">
                            {result && result.valid && (
                              <span className={`w-2 h-2 rounded-full ${statusDotColor(result.margin_pct)}`} />
                            )}
                            {result && result.valid ? `${result.margin_pct.toFixed(0)}%` : "-"}
                          </p>
                        </div>
                      </div>

                      {classification && (
                        <p className="text-xs text-[#9999BB]">
                          {classification.emoji} {classification.label}
                        </p>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => router.push(`/procedimentos/${p.id}`)}
                          className="flex-1 h-10 bg-[#EDE9FF] text-[#5E3ECF] rounded-xl font-semibold text-sm
                                     hover:bg-[#E0D7FF] transition-all active:scale-95"
                        >
                          Analisar →
                        </button>
                        <button
                          onClick={() => startEdit(p)}
                          className="flex-1 h-10 bg-white border border-[#E5E5F0] text-[#4A4A6A] rounded-xl font-semibold text-sm
                                     hover:border-[#B79CFF] transition-all active:scale-95"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={startCreate}
              className="h-12 bg-white border border-dashed border-[#B79CFF] text-[#5E3ECF] rounded-xl font-semibold
                         hover:bg-[#EDE9FF] transition-all active:scale-95"
            >
              + Novo procedimento
            </button>
          </>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5F0] p-6">
            <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">
              {editingId ? "Editar procedimento" : "Novo procedimento"}
            </h2>

            <div className="flex flex-col gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-[#4A4A6A] block mb-1">Nome do procedimento</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Botox"
                  className="w-full h-11 px-4 rounded-xl border border-[#E5E5F0] text-base
                             focus:outline-none focus:ring-2 focus:ring-[#B79CFF] focus:border-[#5E3ECF]"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-[#4A4A6A] mb-2">Categoria</p>
                <div className="grid grid-cols-2 gap-2">
                  {PROCEDURE_CATEGORIES.map((c) => (
                    <Chip key={c.value} active={form.category === c.value} onClick={() => setForm({ ...form, category: c.value })}>
                      {procedureCategoryIcon(c.value)} {c.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#4A4A6A] block mb-1">Quanto você cobra hoje?</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.priceDisplay}
                  onChange={(e) => {
                    const v = parseCurrency(e.target.value);
                    setForm({ ...form, price: v, priceDisplay: formatCurrency(v) });
                  }}
                  placeholder="R$ 0,00"
                  className="w-full h-11 px-4 rounded-xl border border-[#E5E5F0] text-base
                             focus:outline-none focus:ring-2 focus:ring-[#B79CFF] focus:border-[#5E3ECF]"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-[#4A4A6A] mb-2">Tempo total consumido</p>
                <div className="grid grid-cols-4 gap-2">
                  {timeOptions.map((t) => (
                    <Chip key={t} active={form.time === t} onClick={() => setForm({ ...form, time: t })}>
                      {t}min
                    </Chip>
                  ))}
                </div>
                <p className="text-xs text-[#9999BB] mt-1">Inclui preparo, execução, fotos, limpeza e registro.</p>
              </div>

              <div>
                <label className="text-sm font-medium text-[#4A4A6A] block mb-1">Custo de insumos (opcional)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.productCostDisplay}
                  onChange={(e) => {
                    const v = parseCurrency(e.target.value);
                    setForm({ ...form, productCost: v, productCostDisplay: formatCurrency(v) });
                  }}
                  placeholder="R$ 0,00"
                  className="w-full h-11 px-4 rounded-xl border border-[#E5E5F0] text-base
                             focus:outline-none focus:ring-2 focus:ring-[#B79CFF] focus:border-[#5E3ECF]"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-[#4A4A6A] mb-2">Existe comissão?</p>
                <div className="grid grid-cols-2 gap-2">
                  <Chip active={form.hasCommission === false} onClick={() => setForm({ ...form, hasCommission: false })}>
                    Não
                  </Chip>
                  <Chip active={form.hasCommission === true} onClick={() => setForm({ ...form, hasCommission: true })}>
                    Sim
                  </Chip>
                </div>
                {form.hasCommission && (
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.commissionPct || ""}
                    onChange={(e) => setForm({ ...form, commissionPct: Number(e.target.value) })}
                    placeholder="% de comissão"
                    className="w-full h-11 mt-2 px-4 rounded-xl border border-[#E5E5F0] text-base
                               focus:outline-none focus:ring-2 focus:ring-[#B79CFF] focus:border-[#5E3ECF]"
                  />
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-[#4A4A6A] block mb-1">Tempo de retorno/retoque (opcional)</label>
                <div className="grid grid-cols-3 gap-2">
                  {RETURN_TIME_OPTIONS.map((t) => (
                    <Chip key={t} active={form.returnTime === t} onClick={() => setForm({ ...form, returnTime: t })}>
                      {t} min
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-[#E65A5A] mb-3">{error}</p>}

            <div className="flex gap-3 mb-2">
              <button
                onClick={cancel}
                className="h-12 px-5 bg-white border border-[#E5E5F0] text-[#4A4A6A] rounded-xl font-semibold
                           hover:border-[#B79CFF] transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !form.name.trim() || form.price <= 0 || !form.time}
                className="flex-1 h-12 bg-[#5E3ECF] text-white rounded-xl font-semibold hover:bg-[#7C4DFF]
                           transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>

            {!clinic && (
              <p className="text-xs text-[#9999BB] mt-2">
                Configure os custos da clínica em Custos para ver a simulação de preço.
              </p>
            )}

            {clinic && result && !result.valid && (
              <div className="bg-[#FFF0F0] border border-[#FFD0D0] rounded-2xl p-4 text-sm text-[#E65A5A] mt-4">
                {result.error}
              </div>
            )}

            {clinic && result && result.valid && (
              <div className="mt-5 pt-5 border-t border-[#E5E5F0] flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-[#4A4A6A]">Simulação de preço</h3>

                <div className="bg-[#2E1A73] rounded-2xl shadow-sm p-6 text-center">
                  <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Preço saudável</p>
                  <p className="text-4xl font-bold text-white">{formatCurrency(result.preco_saudavel)}</p>
                  {classification && (
                    <span className="bg-white/15 text-white text-xs px-3 py-1 rounded-full inline-block mt-2">
                      {classification.emoji} {classification.label}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl border border-[#E5E5F0] shadow-sm p-3 text-center">
                    <p className="text-xs text-[#9999BB]">Preço mínimo</p>
                    <p className="font-semibold text-[#1A1A2E]">{formatCurrency(result.preco_minimo)}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-[#E5E5F0] shadow-sm p-3 text-center">
                    <p className="text-xs text-[#9999BB]">Preço premium</p>
                    <p className="font-semibold text-[#1A1A2E]">{formatCurrency(result.preco_premium)}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-5">
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
                  <div className="bg-white rounded-xl border border-[#E5E5F0] shadow-sm p-3 text-center">
                    <p className="text-xs text-[#9999BB]">Lucro / lucro por hora</p>
                    <p className="font-semibold text-[#1A1A2E]">{formatCurrency(result.profit)}</p>
                    <p className="text-xs text-[#9999BB]">{formatCurrency(result.profit_per_hour)}/h</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-4 flex items-center justify-between">
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
                  <div className="bg-white rounded-2xl border border-[#E5E5F0] shadow-sm p-4 flex flex-col gap-2 text-sm">
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

                <button
                  onClick={() => setShowWhatsApp(true)}
                  className="w-full h-12 bg-[#25D366] text-white rounded-xl font-semibold text-sm
                             hover:bg-[#1ebe5d] transition-all active:scale-95"
                >
                  📱 Copiar mensagem
                </button>
              </div>
            )}
          </div>
        )}
      </main>

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
    </AppShell>
  );
}
