# 🗄️ BANCO DE DADOS — RADAR PRECYA

## Schema Prisma Completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── CLÍNICA ────────────────────────────────────────────
model Clinic {
  id              String   @id @default(uuid())
  name            String
  owner_user_id   String?
  status          ClinicStatus @default(active)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  users           User[]
  subscriptions   Subscription[]
  cost_profile    ClinicCostProfile?
  procedures      Procedure[]
  simulations     Simulation[]

  @@map("clinics")
}

enum ClinicStatus {
  active
  suspended
  cancelled
}

// ─── USUÁRIO ────────────────────────────────────────────
model User {
  id                    String   @id @default(uuid())
  clinic_id             String
  email                 String
  name                  String?
  role                  UserRole @default(owner)
  onboarding_completed  Boolean  @default(false)
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt

  clinic                Clinic   @relation(fields: [clinic_id], references: [id])
  magic_link_tokens     MagicLinkToken[]

  @@unique([clinic_id, email])
  @@index([email])
  @@map("users")
}

enum UserRole {
  owner
  staff
}

// ─── MAGIC LINK ─────────────────────────────────────────
model MagicLinkToken {
  id         String   @id @default(uuid())
  user_id    String
  token      String   @unique @default(uuid())
  expires_at DateTime
  used_at    DateTime?
  created_at DateTime @default(now())

  user       User     @relation(fields: [user_id], references: [id])

  @@index([token])
  @@map("magic_link_tokens")
}

// ─── SESSÃO ─────────────────────────────────────────────
model Session {
  id         String   @id @default(uuid())
  user_id    String
  token      String   @unique @default(uuid())
  expires_at DateTime
  created_at DateTime @default(now())

  @@index([token])
  @@map("sessions")
}

// ─── SUBSCRIPTION ───────────────────────────────────────
model Subscription {
  id                String             @id @default(uuid())
  clinic_id         String
  platform          PaymentPlatform
  platform_order_id String
  plan              String?
  status            SubscriptionStatus @default(active)
  starts_at         DateTime           @default(now())
  expires_at        DateTime?
  created_at        DateTime           @default(now())
  updated_at        DateTime           @updatedAt

  clinic            Clinic             @relation(fields: [clinic_id], references: [id])

  @@unique([platform, platform_order_id])
  @@index([clinic_id])
  @@map("subscriptions")
}

enum PaymentPlatform {
  kiwify
  hotmart
  mercadopago
  asaas
  manual
}

enum SubscriptionStatus {
  active
  expired
  cancelled
  suspended
}

// ─── PERFIL DE CUSTOS ───────────────────────────────────
model ClinicCostProfile {
  id                    String   @id @default(uuid())
  clinic_id             String   @unique
  monthly_fixed_costs   Float    @default(0)
  monthly_appointments  Int      @default(1)
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt

  clinic                Clinic   @relation(fields: [clinic_id], references: [id])

  @@map("clinic_cost_profiles")
}

// ─── PROCEDIMENTO ───────────────────────────────────────
model Procedure {
  id              String   @id @default(uuid())
  clinic_id       String
  name            String
  price           Float
  product_cost    Float    @default(0)
  commission_pct  Float    @default(0)
  active          Boolean  @default(true)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  clinic          Clinic   @relation(fields: [clinic_id], references: [id])
  simulations     Simulation[]

  @@index([clinic_id])
  @@map("procedures")
}

// ─── SIMULAÇÃO ──────────────────────────────────────────
model Simulation {
  id                  String   @id @default(uuid())
  clinic_id           String
  procedure_id        String
  original_price      Float
  discount_pct        Float    @default(0)
  final_price         Float
  cost_per_appointment Float
  product_cost        Float
  commission_value    Float
  profit              Float
  status              MarginStatus
  created_at          DateTime @default(now())

  clinic              Clinic    @relation(fields: [clinic_id], references: [id])
  procedure           Procedure @relation(fields: [procedure_id], references: [id])

  @@index([clinic_id])
  @@map("simulations")
}

enum MarginStatus {
  healthy
  risk
  loss
}

// ─── WEBHOOK LOG ────────────────────────────────────────
model WebhookLog {
  id           String   @id @default(uuid())
  platform     PaymentPlatform
  event_type   String
  event_id     String
  payload      Json
  processed    Boolean  @default(false)
  error        String?
  created_at   DateTime @default(now())

  @@unique([platform, event_id])
  @@index([platform, event_id])
  @@map("webhook_logs")
}
```

---

## Tabelas Resumidas

| Tabela | Propósito |
|--------|-----------|
| `clinics` | Cada clínica/tenant |
| `users` | Usuárias da clínica |
| `magic_link_tokens` | Tokens de autenticação por e-mail |
| `sessions` | Sessões ativas |
| `subscriptions` | Assinaturas e plataformas de pagamento |
| `clinic_cost_profiles` | Gastos mensais e volume de atendimentos |
| `procedures` | Procedimentos cadastrados |
| `simulations` | Histórico de simulações (opcional MVP) |
| `webhook_logs` | Log de webhooks recebidos (idempotência) |

---

## Queries Essenciais

### Criar clínica após webhook

```typescript
const clinic = await prisma.clinic.create({
  data: { name: payload.customer_name }
})

const user = await prisma.user.create({
  data: {
    clinic_id: clinic.id,
    email: payload.customer_email,
    name: payload.customer_name,
    role: 'owner'
  }
})

await prisma.clinic.update({
  where: { id: clinic.id },
  data: { owner_user_id: user.id }
})

await prisma.subscription.create({
  data: {
    clinic_id: clinic.id,
    platform: payload.platform,
    platform_order_id: payload.order_id,
    status: 'active'
  }
})
```

### Buscar dados para calculadora

```typescript
// SEMPRE filtrar por clinic_id
const costProfile = await prisma.clinicCostProfile.findUnique({
  where: { clinic_id: session.clinic_id }
})

const procedures = await prisma.procedure.findMany({
  where: {
    clinic_id: session.clinic_id,
    active: true
  },
  orderBy: { name: 'asc' }
})
```

### Idempotência de webhook

```typescript
async function isAlreadyProcessed(platform: string, eventId: string) {
  const log = await prisma.webhookLog.findUnique({
    where: { platform_event_id: { platform, event_id: eventId } }
  })
  return !!log?.processed
}
```

### Salvar onboarding passo 2

```typescript
await prisma.clinicCostProfile.upsert({
  where: { clinic_id: session.clinic_id },
  create: {
    clinic_id: session.clinic_id,
    monthly_fixed_costs: data.monthly_fixed_costs,
    monthly_appointments: data.monthly_appointments
  },
  update: {
    monthly_fixed_costs: data.monthly_fixed_costs,
    monthly_appointments: data.monthly_appointments
  }
})
```

### Marcar onboarding completo

```typescript
await prisma.user.update({
  where: { id: session.user_id },
  data: { onboarding_completed: true }
})
```

---

## Validações Críticas

- ✅ SEMPRE filtrar por `clinic_id` em toda query
- ✅ SEMPRE verificar que o `procedure_id` pertence à `clinic_id` da sessão
- ✅ NUNCA retornar dados de outra clínica
- ✅ Magic link: expirar em 15 min, invalidar após uso
- ✅ Sessão: expirar em 30 dias

---

## Migrações

```bash
# Criar migration
npx prisma migrate dev --name init

# Aplicar em produção
npx prisma migrate deploy

# Reset (dev only)
npx prisma migrate reset

# Visualizar banco
npx prisma studio
```

---

## Índices Importantes

- `users.email` — busca por e-mail no login
- `magic_link_tokens.token` — validação rápida de token
- `sessions.token` — validação rápida de sessão
- `webhook_logs.(platform, event_id)` — idempotência
- `procedures.clinic_id` — listagem da calculadora
- `simulations.clinic_id` — histórico por clínica
