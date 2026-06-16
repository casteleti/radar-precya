import { prisma } from "@/lib/prisma";
import { sendMagicLinkEmail } from "@/lib/email";
import { type NormalizedPayload } from "./normalize";
import { randomUUID } from "crypto";

export async function processWebhook(payload: NormalizedPayload, rawBody: unknown) {
  // Idempotência
  const existing = await prisma.webhookLog.findUnique({
    where: { platform_event_id: { platform: payload.platform, event_id: payload.event_id } },
  });
  if (existing?.processed) {
    console.log(`[webhook] already processed: ${payload.platform}/${payload.event_id}`);
    return;
  }

  await prisma.webhookLog.upsert({
    where: { platform_event_id: { platform: payload.platform, event_id: payload.event_id } },
    create: {
      platform: payload.platform,
      event_type: payload.event_type,
      event_id: payload.event_id,
      payload: rawBody as object,
      processed: false,
    },
    update: {},
  });

  try {
    if (payload.event_type === "purchase") {
      await handlePurchase(payload);
    }

    await prisma.webhookLog.update({
      where: { platform_event_id: { platform: payload.platform, event_id: payload.event_id } },
      data: { processed: true },
    });
  } catch (error) {
    await prisma.webhookLog.update({
      where: { platform_event_id: { platform: payload.platform, event_id: payload.event_id } },
      data: { error: String(error) },
    });
    throw error;
  }
}

async function handlePurchase(payload: NormalizedPayload) {
  if (!payload.customer_email) {
    throw new Error("Missing customer_email in webhook payload");
  }

  // Verificar se clínica já existe para esse pedido
  const existingSub = await prisma.subscription.findFirst({
    where: { platform: payload.platform, platform_order_id: payload.order_id },
  });
  if (existingSub) return;

  // Criar clínica
  const clinic = await prisma.clinic.create({
    data: { name: payload.customer_name || "Minha Clínica" },
  });

  // Criar usuário
  const user = await prisma.user.create({
    data: {
      clinic_id: clinic.id,
      email: payload.customer_email,
      name: payload.customer_name || null,
      role: "owner",
    },
  });

  // Atualizar owner
  await prisma.clinic.update({
    where: { id: clinic.id },
    data: { owner_user_id: user.id },
  });

  // Criar subscription
  await prisma.subscription.create({
    data: {
      clinic_id: clinic.id,
      platform: payload.platform,
      platform_order_id: payload.order_id,
      plan: payload.plan,
      status: "active",
    },
  });

  // Enviar magic link
  const token = randomUUID();
  await prisma.magicLinkToken.create({
    data: {
      user_id: user.id,
      token,
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h no primeiro acesso
    },
  });

  await sendMagicLinkEmail(payload.customer_email, token, payload.customer_name || null);

  console.log(`[webhook] clinic created: ${clinic.id} for ${payload.customer_email}`);
}
