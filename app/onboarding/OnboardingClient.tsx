"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, parseCurrency } from "@/lib/utils";
import { calculateCapacity, calculatePricing, type PaymentMethod } from "@/lib/calculadora";

interface Props {
  initialClinicName: string;
}

const TIME_OPTIONS = [15, 30, 45, 60];
const OCCUPANCY_OPTIONS = [30, 50, 70, 85];
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

function Card({
  title,
  subtitle,
  selected,
  onClick,
  icon,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onClick: () => void;
  icon: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border transition-all active:scale-[0.98] flex items-start gap-3 ${
        selected ? "border-[#5E3ECF] bg-[#EDE9FF]" : "border-[#E5E5F0] bg-white hover:border-[#B79CFF]"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <div>
        <p className="font-semibold text-[#1A1A2E] text-sm">{title}</p>
        {subtitle && <p className="text-xs text-[#9999BB] mt-0.5">{subtitle}</p>}
      </div>
    </button>
  );
}

function Stepper({ value, onChange, min = 1, max = 31 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center justify-center gap-6">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-11 h-11 rounded-full bg-[#EDE9FF] text-[#5E3ECF] text-xl font-bold active:scale-90 transition-all"
      >
        −
      </button>
      <span className="text-3xl font-bold text-[#1A1A2E] w-16 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-11 h-11 rounded-full bg-[#EDE9FF] text-[#5E3ECF] text-xl font-bold active:scale-90 transition-all"
      >
        +
      </button>
    </div>
  );
}

function StepHeader({ step, total, title, subtitle }: { step: number; total: number; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <div className="h-1 bg-[#E5E5F0] rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-[#5E3ECF] rounded-full transition-all"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
      <p className="text-xs text-[#9999BB] mb-2">{step} de {total}</p>
      <h2 className="text-xl font-semibold text-[#1A1A2E]">{title}</h2>
      {subtitle && <p className="text-sm text-[#9999BB] mt-1">{subtitle}</p>}
    </div>
  );
}

type Screen = "welcome" | "costs" | "capacity" | "capacity_result" | "financial" | "procedure" | "first_value";

export default function OnboardingClient({ initialClinicName }: Props) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("welcome");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [clinicName, setClinicName] = useState(initialClinicName);

  const [costMode, setCostMode] = useState<"direct" | "category">("direct");
  const [fixedCosts, setFixedCosts] = useState(0);
  const [fixedCostsDisplay, setFixedCostsDisplay] = useState("");
  const [categories, setCategories] = useState<{ label: string; value: number; display: string }[]>([
    { label: "Aluguel", value: 0, display: "" },
    { label: "Equipe", value: 0, display: "" },
    { label: "Pró-labore", value: 0, display: "" },
    { label: "Marketing", value: 0, display: "" },
    { label: "Softwares", value: 0, display: "" },
    { label: "Contador", value: 0, display: "" },
    { label: "Equipamentos / manutenção", value: 0, display: "" },
    { label: "Água, luz e internet", value: 0, display: "" },
    { label: "Outros", value: 0, display: "" },
  ]);
  const categoryTotal = categories.reduce((sum, c) => sum + c.value, 0);

  const [daysPerMonth, setDaysPerMonth] = useState(22);
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [occupancyPct, setOccupancyPct] = useState<number | null>(null);
  const [occupancyEstimated, setOccupancyEstimated] = useState(false);

  const capacityResult = useMemo(
    () =>
      calculateCapacity({
        monthly_fixed_costs: fixedCosts,
        days_per_month: daysPerMonth,
        hours_per_day: hoursPerDay,
        occupancy_pct: occupancyPct ?? 70,
        payment_method: "both",
        card_fee_pct: 0,
        tax_pct: 0,
        target_margin_pct: 0,
      }),
    [fixedCosts, daysPerMonth, hoursPerDay, occupancyPct]
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("both");
  const [cardFeePct, setCardFeePct] = useState(4.5);
  const [taxPct, setTaxPct] = useState<number | null>(null);
  const [targetMarginPct, setTargetMarginPct] = useState(35);

  const [procName, setProcName] = useState("");
  const [procPrice, setProcPrice] = useState(0);
  const [procPriceDisplay, setProcPriceDisplay] = useState("");
  const [procTime, setProcTime] = useState<number | null>(null);
  const [procCost, setProcCost] = useState(0);
  const [procCostDisplay, setProcCostDisplay] = useState("");
  const [hasCommission, setHasCommission] = useState<boolean | null>(null);
  const [commissionPct, setCommissionPct] = useState(0);
  const [returnTime, setReturnTime] = useState(0);

  const firstResult = useMemo(() => {
    if (!procTime) return null;
    return calculatePricing(
      {
        monthly_fixed_costs: fixedCosts,
        days_per_month: daysPerMonth,
        hours_per_day: hoursPerDay,
        occupancy_pct: occupancyPct ?? 70,
        payment_method: paymentMethod,
        card_fee_pct: cardFeePct,
        tax_pct: taxPct ?? 6,
        target_margin_pct: targetMarginPct,
      },
      {
        price: procPrice,
        product_cost: procCost,
        commission_pct: hasCommission ? commissionPct : 0,
        time_minutes: procTime,
        return_time_minutes: returnTime,
      }
    );
  }, [fixedCosts, daysPerMonth, hoursPerDay, occupancyPct, paymentMethod, cardFeePct, taxPct, targetMarginPct, procPrice, procCost, hasCommission, commissionPct, procTime, returnTime]);

  async function post(url: string, body: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Erro ao salvar");
    return data;
  }

  async function handleCosts() {
    const total = costMode === "direct" ? fixedCosts : categoryTotal;
    if (total <= 0) return;
    setLoading(true);
    setError("");
    try {
      if (clinicName.trim()) {
        await post("/api/onboarding/step1", { clinic_name: clinicName.trim() });
      }
      if (costMode === "direct") {
        await post("/api/onboarding/step2", { monthly_fixed_costs: total });
      } else {
        const categoryValueMap: Record<string, string> = {
          "Aluguel": "aluguel",
          "Equipe": "equipe",
          "Pró-labore": "pro_labore",
          "Marketing": "marketing",
          "Softwares": "softwares",
          "Contador": "contador",
          "Equipamentos / manutenção": "equipamentos",
          "Água, luz e internet": "agua_luz_internet",
          "Outros": "outros",
        };
        const items = categories
          .filter((c) => c.value > 0)
          .map((c) => ({
            description: c.label,
            category: categoryValueMap[c.label] ?? "outros",
            monthly_value: c.value,
          }));
        await post("/api/onboarding/step2", { items });
      }
      setFixedCosts(total);
      setScreen("capacity");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  async function handleCapacity() {
    const occ = occupancyPct ?? 70;
    const estimated = occupancyPct === null;
    setLoading(true);
    setError("");
    try {
      await post("/api/onboarding/step3", {
        days_per_month: daysPerMonth,
        hours_per_day: hoursPerDay,
        occupancy_pct: occ,
        occupancy_estimated: estimated,
      });
      setOccupancyPct(occ);
      setOccupancyEstimated(estimated);
      setScreen("capacity_result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinancial() {
    const tax = taxPct ?? 6;
    setLoading(true);
    setError("");
    try {
      await post("/api/onboarding/step4", {
        payment_method: paymentMethod,
        card_fee_pct: cardFeePct,
        tax_pct: tax,
        target_margin_pct: targetMarginPct,
      });
      setTaxPct(tax);
      setScreen("procedure");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  async function handleProcedure() {
    if (!procName.trim() || procPrice <= 0 || !procTime) return;
    setLoading(true);
    setError("");
    try {
      await post("/api/onboarding/step5", {
        name: procName.trim(),
        price: procPrice,
        time_minutes: procTime,
        return_time_minutes: returnTime,
        product_cost: procCost,
        commission_pct: hasCommission ? commissionPct : 0,
      });
      setScreen("first_value");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-[#FAFAFE] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {screen === "welcome" && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5F0] p-8 text-center flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold text-[#2E1A73]">Radar Precya</h1>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-[#1A1A2E] leading-snug">
                Vamos descobrir quanto seus procedimentos realmente deixam de lucro.
              </h2>
              <p className="text-3xl">🌸</p>
              <p className="text-sm text-[#9999BB]">Leva menos de 3 minutos.</p>
            </div>
            {!initialClinicName && (
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Nome da sua clínica"
                autoFocus
                className="h-11 px-4 rounded-xl border border-[#E5E5F0] text-base text-center
                           focus:outline-none focus:ring-2 focus:ring-[#B79CFF] focus:border-[#5E3ECF]"
              />
            )}
            <button
              onClick={() => setScreen("costs")}
              disabled={!initialClinicName ? clinicName.trim().length < 2 : false}
              className="h-12 bg-[#5E3ECF] text-white rounded-xl font-semibold hover:bg-[#7C4DFF]
                         transition-all active:scale-95 disabled:opacity-50"
            >
              Começar →
            </button>
          </div>
        )}

        {screen === "costs" && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5F0] p-6">
            <StepHeader step={1} total={4} title="Quanto custa manter sua clínica funcionando?" subtitle="Inclui aluguel, equipe, marketing, sistemas, contador e demais despesas fixas." />

            <div className="flex flex-col gap-3 mb-4">
              <Card icon="💼" title="Já sei o valor mensal" selected={costMode === "direct"} onClick={() => setCostMode("direct")} />
              <Card icon="🧮" title="Quero calcular por categorias" selected={costMode === "category"} onClick={() => setCostMode("category")} />
            </div>

            {costMode === "direct" ? (
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
                autoFocus
                className="w-full h-12 px-4 rounded-xl border border-[#E5E5F0] text-lg font-semibold
                           focus:outline-none focus:ring-2 focus:ring-[#B79CFF] focus:border-[#5E3ECF] mb-4"
              />
            ) : (
              <div className="flex flex-col gap-2 mb-4">
                {categories.map((c, i) => (
                  <div key={c.label} className="flex items-center justify-between border-b border-[#F0F0F7] pb-2">
                    <span className="text-sm text-[#4A4A6A]">{c.label}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={c.display}
                      onChange={(e) => {
                        const v = parseCurrency(e.target.value);
                        const next = [...categories];
                        next[i] = { ...c, value: v, display: formatCurrency(v) };
                        setCategories(next);
                      }}
                      placeholder="R$ 0,00"
                      className="w-32 h-9 px-3 rounded-lg border border-[#E5E5F0] text-sm text-right
                                 focus:outline-none focus:ring-2 focus:ring-[#B79CFF]"
                    />
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-semibold text-[#1A1A2E]">Total mensal</span>
                  <span className="text-lg font-bold text-[#5E3ECF]">{formatCurrency(categoryTotal)}</span>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-[#E65A5A] mb-3">{error}</p>}

            <button
              onClick={handleCosts}
              disabled={loading || (costMode === "direct" ? fixedCosts <= 0 : categoryTotal <= 0)}
              className="w-full h-12 bg-[#5E3ECF] text-white rounded-xl font-semibold hover:bg-[#7C4DFF]
                         transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Continuar →"}
            </button>
          </div>
        )}

        {screen === "capacity" && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5F0] p-6">
            <StepHeader step={2} total={4} title="Qual a capacidade da sua clínica?" subtitle="Assim calculamos o custo por hora com mais precisão." />

            <div className="flex flex-col gap-6 mb-6">
              <div>
                <p className="text-sm font-medium text-[#4A4A6A] mb-2 text-center">Dias por mês que você atende</p>
                <Stepper value={daysPerMonth} onChange={setDaysPerMonth} min={1} max={31} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#4A4A6A] mb-2 text-center">Horas disponíveis por dia</p>
                <Stepper value={hoursPerDay} onChange={setHoursPerDay} min={1} max={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#4A4A6A] mb-2">Qual sua ocupação média atual?</p>
                <div className="grid grid-cols-2 gap-2">
                  {OCCUPANCY_OPTIONS.map((o) => (
                    <Chip key={o} active={occupancyPct === o} onClick={() => setOccupancyPct(o)}>{o}%</Chip>
                  ))}
                  <Chip active={occupancyPct === null} onClick={() => setOccupancyPct(null)}>Não sei</Chip>
                </div>
                {occupancyPct === null && (
                  <p className="text-xs text-[#9999BB] mt-2">Usamos 70% como estimativa inicial. Você pode ajustar depois.</p>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-[#E65A5A] mb-3">{error}</p>}

            <button
              onClick={handleCapacity}
              disabled={loading}
              className="w-full h-12 bg-[#5E3ECF] text-white rounded-xl font-semibold hover:bg-[#7C4DFF]
                         transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Calculando..." : "Calcular"}
            </button>
          </div>
        )}

        {screen === "capacity_result" && (
          <div className="bg-gradient-to-br from-[#2E1A73] to-[#5E3ECF] rounded-2xl shadow-lg p-8 text-center flex flex-col gap-6">
            <p className="text-white/80 text-sm font-medium tracking-wide">✨ Seu Radar Financeiro</p>
            <div>
              <p className="text-white/70 text-sm mb-1">Sua clínica custa</p>
              <p className="text-5xl font-bold text-white">{formatCurrency(capacityResult.cost_per_hour)}</p>
              <p className="text-white/70 text-sm mt-1">por hora</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-xs text-white/70">Horas disponíveis</p>
                <p className="text-lg font-semibold text-white">{capacityResult.hours_available.toFixed(0)}h/mês</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-xs text-white/70">Horas efetivas</p>
                <p className="text-lg font-semibold text-white">{capacityResult.effective_hours.toFixed(0)}h/mês</p>
              </div>
            </div>
            <p className="text-white/80 text-sm">Quanto mais sua agenda enche, menor fica seu custo por hora.</p>
            <button
              onClick={() => setScreen("financial")}
              className="h-12 bg-white text-[#5E3ECF] rounded-xl font-semibold hover:bg-white/90 transition-all active:scale-95"
            >
              Continuar →
            </button>
          </div>
        )}

        {screen === "financial" && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5F0] p-6">
            <StepHeader step={3} total={4} title="Configuração financeira" subtitle="Essas informações impactam no preço final." />

            <div className="flex flex-col gap-5 mb-4">
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

            {error && <p className="text-sm text-[#E65A5A] mb-3">{error}</p>}

            <button
              onClick={handleFinancial}
              disabled={loading}
              className="w-full h-12 bg-[#5E3ECF] text-white rounded-xl font-semibold hover:bg-[#7C4DFF]
                         transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Continuar →"}
            </button>
          </div>
        )}

        {screen === "procedure" && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5F0] p-6">
            <StepHeader step={4} total={4} title="Novo procedimento" subtitle="Vamos entender os detalhes para calcular com precisão." />

            <div className="flex flex-col gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-[#4A4A6A] block mb-1">Nome do procedimento</label>
                <input
                  type="text"
                  value={procName}
                  onChange={(e) => setProcName(e.target.value)}
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
                  value={procPriceDisplay}
                  onChange={(e) => {
                    const v = parseCurrency(e.target.value);
                    setProcPrice(v);
                    setProcPriceDisplay(formatCurrency(v));
                  }}
                  placeholder="R$ 0,00"
                  className="w-full h-11 px-4 rounded-xl border border-[#E5E5F0] text-base
                             focus:outline-none focus:ring-2 focus:ring-[#B79CFF] focus:border-[#5E3ECF]"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-[#4A4A6A] mb-2">Tempo total consumido</p>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_OPTIONS.map((t) => (
                    <Chip key={t} active={procTime === t} onClick={() => setProcTime(t)}>{t}min</Chip>
                  ))}
                </div>
                <p className="text-xs text-[#9999BB] mt-1">Inclui preparo, execução, fotos, limpeza e registro.</p>
              </div>

              <div>
                <label className="text-sm font-medium text-[#4A4A6A] block mb-1">Custo de insumos (opcional)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={procCostDisplay}
                  onChange={(e) => {
                    const v = parseCurrency(e.target.value);
                    setProcCost(v);
                    setProcCostDisplay(formatCurrency(v));
                  }}
                  placeholder="R$ 0,00"
                  className="w-full h-11 px-4 rounded-xl border border-[#E5E5F0] text-base
                             focus:outline-none focus:ring-2 focus:ring-[#B79CFF] focus:border-[#5E3ECF]"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-[#4A4A6A] mb-2">Existe comissão?</p>
                <div className="grid grid-cols-2 gap-2">
                  <Chip active={hasCommission === false} onClick={() => setHasCommission(false)}>Não</Chip>
                  <Chip active={hasCommission === true} onClick={() => setHasCommission(true)}>Sim</Chip>
                </div>
                {hasCommission && (
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={commissionPct || ""}
                    onChange={(e) => setCommissionPct(Number(e.target.value))}
                    placeholder="% de comissão"
                    className="w-full h-11 mt-2 px-4 rounded-xl border border-[#E5E5F0] text-base
                               focus:outline-none focus:ring-2 focus:ring-[#B79CFF] focus:border-[#5E3ECF]"
                  />
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-[#4A4A6A] block mb-1">Tempo de retorno/retoque (opcional)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 15, 30].map((t) => (
                    <Chip key={t} active={returnTime === t} onClick={() => setReturnTime(t)}>{t} min</Chip>
                  ))}
                </div>
              </div>
            </div>

            {firstResult && firstResult.valid && (
              <div className="bg-[#EDE9FF] rounded-xl p-3 mb-4 text-sm text-[#4A4A6A]">
                Preço saudável estimado: <strong className="text-[#5E3ECF]">{formatCurrency(firstResult.preco_saudavel)}</strong>
              </div>
            )}
            {firstResult && !firstResult.valid && (
              <p className="text-sm text-[#E65A5A] mb-3">{firstResult.error}</p>
            )}

            {error && <p className="text-sm text-[#E65A5A] mb-3">{error}</p>}

            <button
              onClick={handleProcedure}
              disabled={loading || !procName.trim() || procPrice <= 0 || !procTime}
              className="w-full h-12 bg-[#5E3ECF] text-white rounded-xl font-semibold hover:bg-[#7C4DFF]
                         transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar procedimento"}
            </button>
          </div>
        )}

        {screen === "first_value" && firstResult && firstResult.valid && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5F0] p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-[#1A1A2E]">Procedimento: {procName}</h2>

            <div className="bg-[#2E1A73] rounded-2xl p-5 text-center">
              <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Preço saudável</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(firstResult.preco_saudavel)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F5F5FA] rounded-xl p-3 text-center">
                <p className="text-xs text-[#9999BB]">Preço mínimo</p>
                <p className="font-semibold text-[#1A1A2E]">{formatCurrency(firstResult.preco_minimo)}</p>
              </div>
              <div className="bg-[#F5F5FA] rounded-xl p-3 text-center">
                <p className="text-xs text-[#9999BB]">Preço premium</p>
                <p className="font-semibold text-[#1A1A2E]">{formatCurrency(firstResult.preco_premium)}</p>
              </div>
            </div>

            <button
              onClick={handleComplete}
              disabled={loading}
              className="h-12 bg-[#5E3ECF] text-white rounded-xl font-semibold hover:bg-[#7C4DFF]
                         transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Ir para o Radar →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
