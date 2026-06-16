import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const EMAIL = process.env.SEED_EMAIL ?? "ricardo@daksa.com.br";

async function main() {
  console.log(`\n🌱 Criando usuário de teste: ${EMAIL}\n`);

  // Limpar dados anteriores do seed (idempotente)
  const existing = await prisma.user.findFirst({ where: { email: EMAIL } });
  if (existing) {
    await prisma.magicLinkToken.deleteMany({ where: { user_id: existing.id } });
    await prisma.session.deleteMany({ where: { user_id: existing.id } });
    console.log("♻️  Usuário já existe — tokens antigos limpos.");
  }

  // Criar clínica
  const clinic = existing
    ? await prisma.clinic.findUnique({ where: { id: existing.clinic_id } })
    : await prisma.clinic.create({ data: { name: "Clínica Teste" } });

  if (!clinic) throw new Error("Clínica não encontrada");

  // Criar usuário (se não existe)
  const user = existing ?? (await prisma.user.create({
    data: {
      clinic_id: clinic.id,
      email: EMAIL,
      name: "Ricardo",
      role: "owner",
    },
  }));

  // Atualizar owner
  await prisma.clinic.update({
    where: { id: clinic.id },
    data: { owner_user_id: user.id },
  });

  // Criar magic link válido por 24h
  const token = randomUUID();
  await prisma.magicLinkToken.create({
    data: {
      user_id: user.id,
      token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = `${appUrl}/api/auth/verify?token=${token}`;

  console.log("✅ Seed concluído!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🏥 Clínica : ${clinic.name} (${clinic.id})`);
  console.log(`👤 Usuário : ${user.email}`);
  console.log(`🔗 Link    : ${link}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\nAbra o link acima para entrar direto no onboarding.\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
