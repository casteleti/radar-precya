export type Platform = "kiwify" | "hotmart" | "mercadopago" | "asaas";
export type EventType = "purchase" | "refund" | "chargeback" | "cancelled";

export interface NormalizedPayload {
  platform: Platform;
  event_type: EventType;
  event_id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  plan?: string;
  amount: number;
}

export function normalizeKiwify(body: Record<string, unknown>): NormalizedPayload {
  const status = body.order_status as string;
  return {
    platform: "kiwify",
    event_type: status === "paid" ? "purchase" : "refund",
    event_id: (body.webhook_id ?? body.order_id) as string,
    order_id: body.order_id as string,
    customer_name: (body.Customer as Record<string, string>)?.full_name ?? "",
    customer_email: (body.Customer as Record<string, string>)?.email ?? "",
    plan: (body.Product as Record<string, string>)?.name,
    amount: Number(body.order_total ?? 0),
  };
}

export function normalizeHotmart(body: Record<string, unknown>): NormalizedPayload {
  const data = body.data as Record<string, unknown>;
  const event = body.event as string;
  return {
    platform: "hotmart",
    event_type: event === "PURCHASE_APPROVED" ? "purchase" : "refund",
    event_id: body.id as string,
    order_id: (data?.purchase as Record<string, string>)?.order ?? (body.id as string),
    customer_name: (data?.buyer as Record<string, string>)?.name ?? "",
    customer_email: (data?.buyer as Record<string, string>)?.email ?? "",
    plan: (data?.product as Record<string, string>)?.name,
    amount: Number(((data?.purchase as Record<string, unknown>)?.price as Record<string, unknown>)?.value ?? 0),
  };
}

export function normalizeMercadoPago(body: Record<string, unknown>): NormalizedPayload {
  return {
    platform: "mercadopago",
    event_type: body.type === "payment" ? "purchase" : "refund",
    event_id: String(body.id ?? body.data),
    order_id: String((body.data as Record<string, unknown>)?.id ?? body.id),
    customer_name: "",
    customer_email: "",
    amount: 0,
  };
}

export function normalizeAsaas(body: Record<string, unknown>): NormalizedPayload {
  const event = body.event as string;
  return {
    platform: "asaas",
    event_type: event?.includes("RECEIVED") ? "purchase" : "refund",
    event_id: (body.id ?? `asaas-${Date.now()}`) as string,
    order_id: (body.payment as Record<string, string>)?.id ?? (body.id as string),
    customer_name: (body.payment as Record<string, string>)?.customer ?? "",
    customer_email: "",
    amount: Number((body.payment as Record<string, unknown>)?.value ?? 0),
  };
}
