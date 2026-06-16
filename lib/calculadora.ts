export type MarginStatus = "healthy" | "risk" | "loss";
export type PaymentMethod = "pix" | "card" | "both";

export interface ClinicCapacity {
  monthly_fixed_costs: number;
  days_per_month: number;
  hours_per_day: number;
  occupancy_pct: number; // 0-100
  payment_method: PaymentMethod;
  card_fee_pct: number; // 0-100
  tax_pct: number; // 0-100
  target_margin_pct: number; // 0-100
}

export interface ProcedureInput {
  price: number;
  product_cost: number;
  commission_pct: number; // 0-100
  time_minutes: number;
  return_time_minutes: number;
}

export interface CapacityResult {
  hours_available: number;
  effective_hours: number;
  cost_per_hour: number;
}

export interface PriceBreakdown {
  insumos: number;
  comissao: number;
  impostos: number;
  taxas: number;
  tempo: number;
  total: number;
}

export interface PricingResult {
  valid: boolean;
  error?: string;
  cost_per_hour: number;
  base_cost: number;
  percentual_sobre_venda: number;
  preco_minimo: number;
  preco_saudavel: number;
  preco_premium: number;
  breakdown: PriceBreakdown;
}

export interface SimulationResult extends PricingResult {
  current_price: number;
  discount_pct: number;
  final_price: number;
  profit: number;
  profit_per_hour: number;
  margin_pct: number;
  status: MarginStatus;
  desconto_maximo_seguro: number;
  desconto_limite: number;
  below_saudavel: boolean;
  below_minimo: boolean;
}

const MAX_PCT_SOBRE_VENDA = 0.9;

export function calculateCapacity(clinic: ClinicCapacity): CapacityResult {
  const hours_available = clinic.days_per_month * clinic.hours_per_day;
  const effective_hours = hours_available * (clinic.occupancy_pct / 100);
  const cost_per_hour =
    effective_hours > 0 ? clinic.monthly_fixed_costs / effective_hours : 0;

  return { hours_available, effective_hours, cost_per_hour };
}

export function effectiveCardFeePct(clinic: ClinicCapacity): number {
  return clinic.payment_method === "pix" ? 0 : clinic.card_fee_pct;
}

export function calculatePricing(
  clinic: ClinicCapacity,
  procedure: ProcedureInput
): PricingResult {
  const { cost_per_hour } = calculateCapacity(clinic);
  const card_fee_pct = effectiveCardFeePct(clinic);

  const time_total_hours = (procedure.time_minutes + procedure.return_time_minutes) / 60;
  const tempo_cost = time_total_hours * cost_per_hour;
  const base_cost = procedure.product_cost + tempo_cost;

  const commission_frac = procedure.commission_pct / 100;
  const tax_frac = clinic.tax_pct / 100;
  const card_fee_frac = card_fee_pct / 100;
  const target_margin_frac = clinic.target_margin_pct / 100;

  const percentual_sobre_venda = commission_frac + tax_frac + card_fee_frac;

  const breakdown: PriceBreakdown = {
    insumos: procedure.product_cost,
    comissao: 0,
    impostos: 0,
    taxas: 0,
    tempo: tempo_cost,
    total: 0,
  };

  if (percentual_sobre_venda >= MAX_PCT_SOBRE_VENDA) {
    return {
      valid: false,
      error:
        "Os percentuais estão muito altos para calcular um preço saudável. Revise comissão, imposto, taxa ou margem desejada.",
      cost_per_hour,
      base_cost,
      percentual_sobre_venda,
      preco_minimo: 0,
      preco_saudavel: 0,
      preco_premium: 0,
      breakdown,
    };
  }

  const preco_minimo = base_cost / (1 - percentual_sobre_venda);

  if (percentual_sobre_venda + target_margin_frac >= MAX_PCT_SOBRE_VENDA) {
    return {
      valid: false,
      error:
        "Os percentuais estão muito altos para calcular um preço saudável. Revise comissão, imposto, taxa ou margem desejada.",
      cost_per_hour,
      base_cost,
      percentual_sobre_venda,
      preco_minimo,
      preco_saudavel: 0,
      preco_premium: 0,
      breakdown,
    };
  }

  const preco_saudavel = base_cost / (1 - percentual_sobre_venda - target_margin_frac);
  const preco_premium = preco_saudavel * 1.15;

  breakdown.comissao = preco_minimo * commission_frac;
  breakdown.impostos = preco_minimo * tax_frac;
  breakdown.taxas = preco_minimo * card_fee_frac;
  breakdown.total = breakdown.insumos + breakdown.comissao + breakdown.impostos + breakdown.taxas + breakdown.tempo;

  return {
    valid: true,
    cost_per_hour,
    base_cost,
    percentual_sobre_venda,
    preco_minimo,
    preco_saudavel,
    preco_premium,
    breakdown,
  };
}

export function simulate(
  clinic: ClinicCapacity,
  procedure: ProcedureInput,
  discount_pct: number
): SimulationResult {
  const pricing = calculatePricing(clinic, procedure);
  const current_price = procedure.price;
  const final_price = current_price * (1 - discount_pct / 100);

  if (!pricing.valid) {
    return {
      ...pricing,
      current_price,
      discount_pct,
      final_price,
      profit: 0,
      profit_per_hour: 0,
      margin_pct: 0,
      status: "loss",
      desconto_maximo_seguro: 0,
      desconto_limite: 0,
      below_saudavel: false,
      below_minimo: false,
    };
  }

  const time_total_hours = (procedure.time_minutes + procedure.return_time_minutes) / 60;
  const commission_frac = procedure.commission_pct / 100;
  const tax_frac = clinic.tax_pct / 100;
  const card_fee_frac = effectiveCardFeePct(clinic) / 100;

  const costs_on_final_price =
    final_price * (commission_frac + tax_frac + card_fee_frac) + pricing.base_cost;
  const profit = final_price - costs_on_final_price;
  const profit_per_hour = time_total_hours > 0 ? profit / time_total_hours : 0;
  const margin_pct = final_price > 0 ? (profit / final_price) * 100 : 0;

  const desconto_maximo_seguro = Math.max(
    0,
    1 - pricing.preco_saudavel / current_price
  ) * 100;
  const desconto_limite = Math.max(
    0,
    1 - pricing.preco_minimo / current_price
  ) * 100;

  const below_saudavel = current_price < pricing.preco_saudavel;
  const below_minimo = current_price < pricing.preco_minimo;

  let status: MarginStatus = "healthy";
  if (profit <= 0) status = "loss";
  else if (final_price < pricing.preco_saudavel) status = "risk";

  return {
    ...pricing,
    current_price,
    discount_pct,
    final_price,
    profit,
    profit_per_hour,
    margin_pct,
    status,
    desconto_maximo_seguro,
    desconto_limite,
    below_saudavel,
    below_minimo,
  };
}

export function classificationLabel(margin_pct: number): { label: string; emoji: string } {
  if (margin_pct >= 45) return { label: "Excelente", emoji: "🟢" };
  if (margin_pct >= 25) return { label: "Saudável", emoji: "🟢" };
  if (margin_pct > 0) return { label: "Margem em risco", emoji: "⚠️" };
  return { label: "Prejuízo", emoji: "❌" };
}

export function generateWhatsAppMessage(
  procedure_name: string,
  discount_pct: number,
  final_price: number,
  original_price: number,
  status: MarginStatus
): string {
  if (discount_pct === 0) {
    return `Oi! 😊 Obrigada pelo interesse na ${procedure_name}!\n\nO valor é R$ ${formatBRL(final_price)}. Posso te ajudar a agendar? 💜`;
  }

  if (status === "loss") {
    return `Oi! 😊 Que bom que você gostou da ${procedure_name}!\n\nNo momento não consigo oferecer desconto nesse procedimento, mas adoraria te atender! O valor é R$ ${formatBRL(original_price)}. Posso te ajudar a agendar? 💜`;
  }

  return `Oi! 😊 Que bom que você gostou da ${procedure_name}!\n\nPosso sim fazer por R$ ${formatBRL(final_price)}. Seria um desconto especial de ${discount_pct}% para você. 💜\n\nQuer agendar?`;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export interface ClinicInsights {
  most_profitable_per_hour: { name: string; value: number } | null;
  most_time_consuming: { name: string; minutes: number } | null;
  needs_repricing: { name: string; margin_pct: number } | null;
  break_even_hours: number;
}

export function calculateInsights(
  clinic: ClinicCapacity,
  procedures: Array<ProcedureInput & { name: string }>
): ClinicInsights {
  if (procedures.length === 0) {
    return {
      most_profitable_per_hour: null,
      most_time_consuming: null,
      needs_repricing: null,
      break_even_hours: 0,
    };
  }

  const results = procedures.map((p) => ({
    name: p.name,
    minutes: p.time_minutes + p.return_time_minutes,
    ...simulate(clinic, p, 0),
  }));

  const most_profitable_per_hour = results.reduce((a, b) =>
    b.profit_per_hour > a.profit_per_hour ? b : a
  );
  const most_time_consuming = results.reduce((a, b) => (b.minutes > a.minutes ? b : a));
  const worstMargin = results.reduce((a, b) => (b.margin_pct < a.margin_pct ? b : a));

  const { cost_per_hour } = calculateCapacity(clinic);
  const break_even_hours = cost_per_hour > 0 ? clinic.monthly_fixed_costs / cost_per_hour : 0;

  return {
    most_profitable_per_hour:
      procedures.length >= 2
        ? { name: most_profitable_per_hour.name, value: most_profitable_per_hour.profit_per_hour }
        : null,
    most_time_consuming:
      procedures.length >= 2
        ? { name: most_time_consuming.name, minutes: most_time_consuming.minutes }
        : null,
    needs_repricing:
      procedures.length >= 2 && worstMargin.status !== "healthy"
        ? { name: worstMargin.name, margin_pct: worstMargin.margin_pct }
        : null,
    break_even_hours,
  };
}
