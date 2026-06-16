# 🔐 SEGURANÇA — RADAR PRECYA

## Checklist Rápido

- [ ] Magic link expira em 15 min
- [ ] Magic link invalida após uso
- [ ] Sessão expira em 30 dias (cookie httpOnly)
- [ ] Todas as queries filtram por `clinic_id`
- [ ] Webhook valida assinatura HMAC
- [ ] Webhook é idempotente (event_id único)
- [ ] Rate limiting em `/api/auth/send-magic-link`
- [ ] Sem senha armazenada em nenhum lugar
- [ ] CSRF protection (SameSite=Lax no cookie)
- [ ] Inputs sanitizados (Zod no servidor)

---

## 1. Autenticação — Magic Link

### Fluxo

```
1. POST /api/auth/send-magic-link { email }
2. Busca user pelo email
3. Gera token UUID v4
4. Salva: magic_link_tokens { user_id, token, expires_at: now + 15min }
5. Envia e-mail com link: /magic-link?token=<token>
6. GET /api/auth/verify?token=<token>
7. Valida: existe? não expirado? não usado?
8. Marca used_at = now()
9. Cria sessão: sessions { user_id, token: UUID, expires_at: now + 30d }
10. Set-Cookie: session_token=<token>; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000
```

### Implementação

```typescript
// lib/auth.ts

export async function sendMagicLink(email: string) {
  const user = await prisma.user.findFirst({ where: { email } })

  // Sempre retorna sucesso (não revelar se email existe)
  if (!user) return { success: true }

  // Invalidar tokens anteriores do usuário
  await prisma.magicLinkToken.updateMany({
    where: { user_id: user.id, used_at: null },
    data: { used_at: new Date() }
  })

  const token = randomUUID()
  const expires_at = new Date(Date.now() + 15 * 60 * 1000) // 15 min

  await prisma.magicLinkToken.create({
    data: { user_id: user.id, token, expires_at }
  })

  await sendEmail({
    to: email,
    subject: '🎉 Seu acesso ao Radar Precya está aqui!',
    html: magicLinkEmailTemplate(token)
  })

  return { success: true }
}

export async function verifyMagicLink(token: string) {
  const record = await prisma.magicLinkToken.findUnique({
    where: { token },
    include: { user: true }
  })

  if (!record) throw new Error('INVALID_TOKEN')
  if (record.used_at) throw new Error('TOKEN_ALREADY_USED')
  if (record.expires_at < new Date()) throw new Error('TOKEN_EXPIRED')

  // Marcar como usado (ANTES de criar sessão — evita race condition)
  await prisma.magicLinkToken.update({
    where: { id: record.id },
    data: { used_at: new Date() }
  })

  // Criar sessão
  const sessionToken = randomUUID()
  await prisma.session.create({
    data: {
      user_id: record.user_id,
      token: sessionToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  })

  return { sessionToken, user: record.user }
}
```

### Recuperar Sessão

```typescript
export async function getServerSession(
  cookieStore?: ReadonlyRequestCookies
): Promise<Session | null> {
  const cookies = cookieStore ?? (await import('next/headers')).cookies()
  const token = cookies.get('session_token')?.value

  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { clinic: true } } }
  })

  if (!session) return null
  if (session.expires_at < new Date()) return null

  return {
    user_id: session.user.id,
    clinic_id: session.user.clinic_id,
    email: session.user.email,
    role: session.user.role,
    onboarding_completed: session.user.onboarding_completed
  }
}
```

---

## 2. Rate Limiting

```typescript
// lib/rate-limit.ts
// Implementar com um Map em memória (dev) ou Redis (prod)

const requests = new Map<string, number[]>()

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now()
  const timestamps = (requests.get(key) ?? []).filter(
    t => t > now - windowMs
  )

  if (timestamps.length >= limit) return false

  timestamps.push(now)
  requests.set(key, timestamps)
  return true
}

// Uso em /api/auth/send-magic-link:
// Máximo 3 requisições por IP por 10 minutos
const allowed = checkRateLimit(`magic-link:${ip}`, 3, 10 * 60 * 1000)
if (!allowed) {
  return Response.json(
    { error: 'Muitas tentativas. Aguarde alguns minutos.' },
    { status: 429 }
  )
}
```

---

## 3. Multi-Tenant — Isolamento

### Regra de Ouro

**NUNCA** fazer query sem `clinic_id` (exceto tabelas de autenticação).

```typescript
// ✅ CORRETO
const procedures = await prisma.procedure.findMany({
  where: { clinic_id: session.clinic_id }
})

// ❌ ERRO CRÍTICO — vaza dados entre clínicas
const procedures = await prisma.procedure.findMany()

// ✅ CORRETO — validar que o procedimento pertence à clínica
const procedure = await prisma.procedure.findFirst({
  where: {
    id: procedureId,
    clinic_id: session.clinic_id  // obrigatório!
  }
})
if (!procedure) return Response.json({ error: 'Not found' }, { status: 404 })
```

### Helper de Validação

```typescript
export async function requireOwnedProcedure(
  procedureId: string,
  clinicId: string
) {
  const procedure = await prisma.procedure.findFirst({
    where: { id: procedureId, clinic_id: clinicId }
  })
  if (!procedure) throw new Error('PROCEDURE_NOT_FOUND')
  return procedure
}
```

---

## 4. Webhook Security

### Kiwify — Validação de Assinatura

```typescript
// lib/webhook/kiwify.ts

export function validateKiwifySignature(
  body: string,
  signature: string
): boolean {
  const secret = process.env.WEBHOOK_SECRET_KIWIFY!
  const expected = createHmac('sha1', secret)
    .update(body)
    .digest('hex')

  return timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}
```

### Hotmart — Validação de Token

```typescript
// lib/webhook/hotmart.ts

export function validateHotmartToken(token: string): boolean {
  return timingSafeEqual(
    Buffer.from(token),
    Buffer.from(process.env.WEBHOOK_SECRET_HOTMART!)
  )
}
```

### Idempotência

```typescript
export async function processWebhookIdempotent(
  platform: string,
  eventId: string,
  handler: () => Promise<void>
) {
  // Verificar se já processou
  const existing = await prisma.webhookLog.findUnique({
    where: { platform_event_id: { platform, event_id: eventId } }
  })

  if (existing?.processed) {
    console.log(`[webhook] Already processed: ${platform}/${eventId}`)
    return
  }

  // Criar log (registra a tentativa)
  await prisma.webhookLog.upsert({
    where: { platform_event_id: { platform, event_id: eventId } },
    create: { platform, event_id: eventId, payload: {}, processed: false },
    update: {}
  })

  try {
    await handler()
    await prisma.webhookLog.update({
      where: { platform_event_id: { platform, event_id: eventId } },
      data: { processed: true }
    })
  } catch (error) {
    await prisma.webhookLog.update({
      where: { platform_event_id: { platform, event_id: eventId } },
      data: { error: String(error) }
    })
    throw error
  }
}
```

---

## 5. Payload Normalizado

Todos os webhooks normalizam para o mesmo formato interno.

```typescript
interface NormalizedWebhookPayload {
  platform: 'kiwify' | 'hotmart' | 'mercadopago' | 'asaas'
  event_type: 'purchase' | 'refund' | 'chargeback' | 'subscription_cancelled'
  event_id: string
  order_id: string
  customer_name: string
  customer_email: string
  plan?: string
  amount: number
}

// Exemplo: normalizar Kiwify
export function normalizeKiwify(payload: any): NormalizedWebhookPayload {
  return {
    platform: 'kiwify',
    event_type: payload.order_status === 'paid' ? 'purchase' : 'refund',
    event_id: payload.webhook_id,
    order_id: payload.order_id,
    customer_name: payload.Customer.full_name,
    customer_email: payload.Customer.email,
    plan: payload.Product.name,
    amount: payload.order_total
  }
}
```

---

## 6. Validação de Inputs (Zod)

```typescript
// schemas/onboarding.ts
import { z } from 'zod'

export const step1Schema = z.object({
  clinic_name: z.string().min(2).max(80).trim()
})

export const step2Schema = z.object({
  monthly_fixed_costs: z.number().min(0),
  monthly_appointments: z.number().int().min(1)
})

export const procedureSchema = z.object({
  name: z.string().min(1).max(80).trim(),
  price: z.number().min(0.01),
  product_cost: z.number().min(0).default(0),
  commission_pct: z.number().min(0).max(100).default(0)
})
```

---

## 7. Logging de Auditoria

```typescript
// Logar eventos críticos de segurança
async function auditLog(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ...data
  }))
}

// Exemplos de uso:
auditLog('magic_link_sent', { email, user_id })
auditLog('magic_link_verified', { user_id, clinic_id })
auditLog('magic_link_failed', { token, reason: 'expired' })
auditLog('webhook_received', { platform, event_id, event_type })
auditLog('webhook_processed', { platform, event_id, clinic_id })
```

---

## 8. Headers de Segurança

```typescript
// next.config.ts
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline';"
  }
]
```

---

## Integração com Outros Docs

- Schema de tabelas → **BANCO-DADOS.md** (magic_link_tokens, sessions, webhook_logs)
- Fluxo de login → **FLUXO-USUARIO.md** (FASE 3 e 4)
- Multi-tenant → **ARQUITETURA.md** (seção "Multi-Tenant")
