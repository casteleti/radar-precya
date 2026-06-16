export type MarginStatus = "healthy" | "risk" | "loss";

export interface SimulationInput {
  monthly_fixed_costs: number;
  monthly_appointments: number;
  price: number;
  product_cost: number;
  commission_pct: number;
  discount_pct: number;
}

export interface SimulationResult {
  cost_per_appointment: number;
  commission_value: number;
  total_cost: number;
  final_price: number;
  profit_original: number;
  profit: number;
  margin_pct: number;
  status: MarginStatus;
}

export function simulate(input: SimulationInput): SimulationResult {
  const {
    monthly_fixed_costs,
    monthly_appointments,
    price,
    product_cost,
    commission_pct,
    discount_pct,
  } = input;

  const cost_per_appointment = monthly_fixed_costs / Math.max(monthly_appointments, 1);
  const commission_value = price * (commission_pct / 100);
  const total_cost = cost_per_appointment + product_cost + commission_value;
  const final_price = price * (1 - discount_pct / 100);
  const profit_original = price - total_cost;
  const profit = final_price - total_cost;
  const margin_pct = final_price > 0 ? (profit / final_price) * 100 : 0;

  return {
    cost_per_appointment,
    commission_value,
    total_cost,
    final_price,
    profit_original,
    profit,
    margin_pct,
    status: getMarginStatus(profit, profit_original),
  };
}

function getMarginStatus(profit: number, profit_original: number): MarginStatus {
  if (profit <= 0) return "loss";
  if (profit >= profit_original * 0.8) return "healthy";
  return "risk";
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
