"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, parseCurrency } from "@/lib/utils";

interface Procedure {
  id?: string;
  name: string;
  price: number;
  product_cost: number;
  commission_pct: number;
}

interface Props {
  initialStep: number;
  initialClinicName: string;
  initialProfile: { monthly_fixed_costs: number; monthly_appointments: number } | null;
  initialProcedures: Procedure[];
}

function ProgressBar({ steps, current }: { steps: number; current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: steps }, (_, i) => i + 1).map((step, idx) => (
        <div key={step} className="flex items-center flex-1">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors ${
            step < current ? "bg-[#5E3ECF]" :
            step === current ? "bg-[#5E3ECF] ring-2 ring-[#B79CFF]" :
            "bg-[#E5E5F0]"
          }`} />
          {idx < steps - 1 && (
            <div className={`h-0.5 flex-1 mx-1 transition-colors ${step < current ? "bg-[#5E3ECF]" : "bg-[#E5E5F0]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OnboardingClient({ initialStep, initialClinicName, initialProfile, initialProcedures }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [clinicName, setClinicName] = useState(initialClinicName);

  // Step 2
  const [fixedCosts, setFixedCosts] = useState(initialProfile?.monthly_fixed_costs ?? 0);
  const [fixedCostsDisplay, setFixedCostsDisplay] = useState(
    initialProfile ? formatCurrency(initialProfile.monthly_fixed_costs) : ""
  );
  const [appointments, setAppointments] = useState(initialProfile?.monthly_appointments ?? 0);

  // Step 3
  const [procedures, setProcedures] = useState<Procedure[]>(initialProcedures);
  const [showForm, setShowForm] = useState(false);
  const [newProc, setNewProc] = useState<Procedure>({ name: "", price: 0, product_cost: 0, commission_pct: 0 });
  const [newProcPriceDisplay, setNewProcPriceDisplay] = useState("");
  const [newProcCostDisplay, setNewProcCostDisplay] = useState("");

  async function post(url: string, body: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Erro ao salvar");
  }

  async function handleStep1() {
    if (!clinicName.trim()) return;
    setLoading(true);
    try {
      await post("/api/onboarding/step1", { clinic_name: clinicName.trim() });
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2() {
    if (!appointments || appointments < 1) return;
    setLoading(true);
    try {
      await post("/api/onboarding/step2", {
        monthly_fixed_costs: fixedCosts,
        monthly_appointments: appointments,
      });
      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep3() {
    if (procedures.length === 0) return;
    const newOnes = procedures.filter((p) => !p.id);
    if (newOnes.length > 0) {
      setLoading(true);
      try {
        await post("/api/onboarding/step3", { procedures: newOnes });
      } finally {
        setLoading(false);
      }
    }
    setStep(4);
  }

  async function handleComplete() {
    setLoading(true);
    try {
      await post("/api/onboarding/complete", {});
      router.push("/calculadora");
    } finally {
      setLoading(false);
    }
  }

  function addProcedure() {
    if (!newProc.name || newProc.price <= 0) return;
    setProcedures([...procedures, { ...newProc }]);
    setNewProc({ name: "", price: 0, product_cost: 0, commission_pct: 0 });
    setNewProcPriceDisplay("");
    setNewProcCostDisplay("");
    setShowForm(false);
  }

  const costPerAppointment = appointments > 0 ? fixedCosts / appointments : 0;

  return (
    <div className="min-h-screen bg-[#EDE9FF] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-[#2E1A73]">Radar Precya</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-white/80 p-6">
          <ProgressBar steps={4} current={step} />

          {/* STEP 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-semibold text-[#1A1A2E]">Vamos começar! Como se chama sua clínica? 🌸</h2>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#4A4A6A]">Nome da clínica</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Ex: Studio Bella"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                  className="h-11 px-4 rounded-xl border border-[#E5E5F0] text-base
                             focus:outline-none focus:ring-2 focus:ring-[#B79CFF] focus:border-[#5E3ECF]
                             transition-all placeholder:text-[#9999BB]"
                />
                <span className="text-xs text-[#9999BB]">Esse nome aparecerá no seu painel.</span>
              </div>
              <button
                onClick={handleStep1}
                disabled={loading || clinicName.trim().length < 2}
                className="h-11 bg-[#5E3ECF] text-white rounded-xl font-semibold hover:bg-[#7C4DFF]
                           transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Salvando..." : "Continuar →"}
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-xl font-semibold text-[#1A1A2E]">Quanto você gasta por mês na clínica? 💸</h2>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#4A4A6A]">💡 Gastos fixos mensais</label>
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
                  className="h-11 px-4 rounded-xl border border-[#E5E5F0] text-base
                             focus:outline-none focus:ring-2 focus:ring-[#B79CFF] focus:border-[#5E3ECF]
                             transition-all placeholder:text-[#9999BB]"
                />
                <span className="text-xs text-[#9999BB]">Aluguel + salários + contas + materiais fixos</span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#4A4A6A]">📅 Atendimentos por mês</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={appointments || ""}
                  onChange={(e) => setAppointments(Number(e.target.value))}
                  placeholder="0"
                  min={1}
                  className="h-11 px-4 rounded-xl border border-[#E5E5F0] text-base
                             focus:outline-none focus:ring-2 focus:ring-[#B79CFF] focus:border-[#5E3ECF]
                             transition-all placeholder:text-[#9999BB]"
                />
                <span className="text-xs text-[#9999BB]">Quantos clientes você atende em média por mês?</span>
              </div>
              {fixedCosts > 0 && appointments > 0 && (
                <div className="bg-[#EDE9FF] rounded-xl p-3 text-sm text-[#4A4A6A]">
                  📊 Custo por atendimento: <strong className="text-[#5E3ECF]">{formatCurrency(costPerAppointment)}</strong>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 h-11 border border-[#B79CFF] text-[#5E3ECF] rounded-xl font-semibold hover:bg-[#EDE9FF] transition-all">
                  ← Voltar
                </button>
                <button
                  onClick={handleStep2}
                  disabled={loading || appointments < 1}
                  className="flex-1 h-11 bg-[#5E3ECF] text-white rounded-xl font-semibold hover:bg-[#7C4DFF]
                             transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Salvando..." : "Continuar →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-[#1A1A2E]">Quais procedimentos você realiza? 💆‍♀️</h2>
              <p className="text-sm text-[#9999BB]">Adicione pelo menos 1. Você pode editar depois!</p>

              {procedures.map((p, i) => (
                <div key={i} className="bg-[#F5F5FA] rounded-xl p-3 flex justify-between items-start">
                  <div>
                    <p className="font-medium text-[#1A1A2E] text-sm">{p.name}</p>
                    <p className="text-xs text-[#9999BB]">
                      {formatCurrency(p.price)}
                      {p.product_cost > 0 && ` · Produto: ${formatCurrency(p.product_cost)}`}
                      {p.commission_pct > 0 && ` · Comissão: ${p.commission_pct}%`}
                    </p>
                  </div>
                  <button
                    onClick={() => setProcedures(procedures.filter((_, idx) => idx !== i))}
                    className="text-[#9999BB] hover:text-[#E65A5A] text-lg leading-none ml-2"
                  >✕</button>
                </div>
              ))}

              {showForm ? (
                <div className="border border-[#B79CFF] rounded-xl p-4 flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Nome do procedimento *"
                    value={newProc.name}
                    onChange={(e) => setNewProc({ ...newProc, name: e.target.value })}
                    className="h-10 px-3 rounded-lg border border-[#E5E5F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#B79CFF]"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Preço de venda *"
                    value={newProcPriceDisplay}
                    onChange={(e) => {
                      const v = parseCurrency(e.target.value);
                      setNewProc({ ...newProc, price: v });
                      setNewProcPriceDisplay(formatCurrency(v));
                    }}
                    className="h-10 px-3 rounded-lg border border-[#E5E5F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#B79CFF]"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Custo de produto (opcional)"
                    value={newProcCostDisplay}
                    onChange={(e) => {
                      const v = parseCurrency(e.target.value);
                      setNewProc({ ...newProc, product_cost: v });
                      setNewProcCostDisplay(formatCurrency(v));
                    }}
                    className="h-10 px-3 rounded-lg border border-[#E5E5F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#B79CFF]"
                  />
                  <input
                    type="number"
                    placeholder="Comissão % (opcional)"
                    value={newProc.commission_pct || ""}
                    onChange={(e) => setNewProc({ ...newProc, commission_pct: Number(e.target.value) })}
                    min={0} max={100}
                    className="h-10 px-3 rounded-lg border border-[#E5E5F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#B79CFF]"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowForm(false)} className="flex-1 h-9 border border-[#E5E5F0] text-[#9999BB] rounded-lg text-sm">Cancelar</button>
                    <button
                      onClick={addProcedure}
                      disabled={!newProc.name || newProc.price <= 0}
                      className="flex-1 h-9 bg-[#5E3ECF] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                    >Salvar</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  className="h-11 border-2 border-dashed border-[#B79CFF] text-[#5E3ECF] rounded-xl font-medium hover:bg-[#EDE9FF] transition-all text-sm"
                >
                  + Adicionar procedimento
                </button>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 h-11 border border-[#B79CFF] text-[#5E3ECF] rounded-xl font-semibold hover:bg-[#EDE9FF] transition-all">
                  ← Voltar
                </button>
                <button
                  onClick={handleStep3}
                  disabled={loading || procedures.length === 0}
                  className="flex-1 h-11 bg-[#5E3ECF] text-white rounded-xl font-semibold hover:bg-[#7C4DFF]
                             transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Salvando..." : "Continuar →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-[#1A1A2E]">Tudo certo! Veja o resumo 🎉</h2>

              <div className="bg-[#F5F5FA] rounded-xl p-4 flex flex-col gap-1">
                <p className="text-xs font-semibold text-[#9999BB] uppercase tracking-wide">✅ Sua clínica</p>
                <p className="font-semibold text-[#1A1A2E]">{clinicName}</p>
              </div>

              {(fixedCosts > 0 || appointments > 0) && (
                <div className="bg-[#F5F5FA] rounded-xl p-4 flex flex-col gap-1">
                  <p className="text-xs font-semibold text-[#9999BB] uppercase tracking-wide">✅ Gastos mensais</p>
                  <p className="font-semibold text-[#1A1A2E]">{formatCurrency(fixedCosts)}</p>
                  <p className="text-sm text-[#4A4A6A]">{appointments} atendimentos/mês → <strong>{formatCurrency(costPerAppointment)}</strong> por atend.</p>
                </div>
              )}

              {procedures.length > 0 && (
                <div className="bg-[#F5F5FA] rounded-xl p-4 flex flex-col gap-1">
                  <p className="text-xs font-semibold text-[#9999BB] uppercase tracking-wide">✅ Procedimentos ({procedures.length})</p>
                  {procedures.map((p, i) => (
                    <p key={i} className="text-sm text-[#4A4A6A]">• {p.name} — {formatCurrency(p.price)}</p>
                  ))}
                </div>
              )}

              <p className="text-xs text-[#9999BB] text-center">Você pode editar tudo isso depois nas configurações. 😊</p>

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 h-11 border border-[#B79CFF] text-[#5E3ECF] rounded-xl font-semibold hover:bg-[#EDE9FF] transition-all">
                  ← Voltar
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 h-11 bg-[#5E3ECF] text-white rounded-xl font-semibold hover:bg-[#7C4DFF]
                             transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? "Entrando..." : "Ir para o Radar →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
