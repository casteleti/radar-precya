"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, parseCurrency } from "@/lib/utils";

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
  procedures: Procedure[];
}

const BASE_TIME_OPTIONS = [15, 30, 45, 60];
const RETURN_TIME_OPTIONS = [0, 15, 30];

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
  };
}

export default function ProcedimentosClient({ clinicName, procedures }: Props) {
  const router = useRouter();
  const [list, setList] = useState(procedures);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function startEdit(p: Procedure) {
    setEditingId(p.id);
    setCreating(false);
    setForm(formFromProcedure(p));
    setError("");
  }

  function startCreate() {
    setCreating(true);
    setEditingId(null);
    setForm(emptyForm());
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

  return (
    <div className="min-h-screen bg-[#FAFAFE]">
      <header className="bg-white border-b border-[#E5E5F0] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push("/calculadora")} className="text-lg font-semibold text-[#2E1A73]">
            ← Radar Precya
          </button>
          <span className="text-sm text-[#9999BB]">Olá, {clinicName} 👋</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 pt-6 pb-12 flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-[#1A1A2E]">Procedimentos</h1>

        {!showForm && (
          <>
            <div className="flex flex-col gap-3">
              {list.map((p) => (
                <button
                  key={p.id}
                  onClick={() => startEdit(p)}
                  className="bg-white rounded-2xl border border-[#E5E5F0] p-4 text-left hover:border-[#B79CFF] transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[#1A1A2E]">{p.name}</p>
                    <p className="font-semibold text-[#5E3ECF]">{formatCurrency(p.price)}</p>
                  </div>
                  <p className="text-xs text-[#9999BB] mt-1">
                    {p.time_minutes > 0 ? `${p.time_minutes} min` : "Tempo não informado"}
                    {p.return_time_minutes > 0 ? ` + ${p.return_time_minutes} min retorno` : ""}
                  </p>
                </button>
              ))}
            </div>

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

            <div className="flex gap-3">
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
          </div>
        )}
      </main>
    </div>
  );
}
