# 🏗️ ARQUITETURA — RADAR PRECYA

## Visão Geral

Radar Precya é um microSaaS multi-tenant construído com Next.js 15 App Router. Cada clínica é completamente isolada por `clinic_id`.

---

## Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | Next.js (App Router) | 15.x |
| Linguagem | TypeScript | 5.x |
| Estilo | Tailwind CSS | 3.x |
| ORM | Prisma | 5.x |
| Banco | PostgreSQL | 15.x |
| Auth | Magic Link (email) | — |
| Deploy | Docker + Coolify | — |
| Infra | Hetzner Cloud | — |
| Email | Resend | — |

---

## Estrutura de Pastas

```
radar-precya/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── magic-link/
│   │       └── page.tsx
│   ├── (app)/
│   │   ├── onboarding/
│   │   │   └── page.tsx
│   │   └── calculadora/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── send-magic-link/
│   │   │   │   └── route.ts
│   │   │   └── verify/
│   │   │       └── route.ts
│   │   ├── webhook/
│   │   │   ├── kiwify/
│   │   │   │   └── route.ts
│   │   │   ├── hotmart/
│   │   │   │   └── route.ts
│   │   │   └── mercadopago/
│   │   │       └── route.ts
│   │   ├── onboarding/
│   │   │   └── route.ts
│   │   └── simulation/
│   │       └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── onboarding/
│   └── calculadora/
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── email.ts
│   └── webhook/
│       ├── normalize.ts
│       ├── kiwify.ts
│       ├── hotmart.ts
│       └── mercadopago.ts
├── prisma/
│   └── schema.prisma
└── middleware.ts
```

---

## Multi-Tenant

Toda clínica tem um `clinic_id`. **SEMPRE** filtrar por `clinic_id` em todas as queries.

```typescript
// ✅ CORRETO
const procedures = await prisma.procedure.findMany({
  where: { clinic_id: session.clinic_id }
})

// ❌ ERRADO — vaza dados entre clínicas
const procedures = await prisma.procedure.findMany()
```

### Hierarquia de dados

```
clinics
  └── users (clinic_id)
  └── subscriptions (clinic_id)
  └── clinic_cost_profiles (clinic_id)
  └── procedures (clinic_id)
  └── simulations (clinic_id)
```

---

## Middleware

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const session = getSession(request)

  // Rotas públicas
  const publicRoutes = ['/login', '/magic-link', '/api/webhook']
  if (publicRoutes.some(r => request.nextUrl.pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Sem sessão → login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Onboarding incompleto → forçar onboarding
  if (!session.onboarding_completed && !request.nextUrl.pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return NextResponse.next()
}
```

---

## Padrões de Código

### Server Components (default)
Use para páginas que buscam dados no servidor.

```typescript
// app/(app)/calculadora/page.tsx
export default async function CalculadoraPage() {
  const session = await getServerSession()
  const procedures = await prisma.procedure.findMany({
    where: { clinic_id: session.clinic_id }
  })
  return <CalculadoraClient procedures={procedures} />
}
```

### Client Components
Use apenas onde há interatividade (formulários, estados, animações).

```typescript
'use client'
// components/calculadora/SimuladorDesconto.tsx
```

### API Routes
Sempre validar sessão e `clinic_id`.

```typescript
// app/api/simulation/route.ts
export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  // ... lógica com session.clinic_id
}
```

---

## Fluxo de Autenticação

```
1. Usuária digita e-mail em /login
2. POST /api/auth/send-magic-link
3. Gera token único (uuid) + expira em 15 min
4. Salva no banco (magic_link_tokens)
5. Envia e-mail com link: /magic-link?token=xxx
6. Usuária clica → GET /api/auth/verify?token=xxx
7. Valida token (existe + não expirado + não usado)
8. Cria sessão (cookie httpOnly, 30 dias)
9. Redireciona para /onboarding ou /calculadora
```

---

## Sessão

```typescript
interface Session {
  user_id: string
  clinic_id: string
  email: string
  role: 'owner' | 'staff'
  onboarding_completed: boolean
}
```

Cookie: `session_token` — httpOnly, secure, SameSite=Lax, 30 dias.

---

## Webhooks

Plataformas suportadas: Kiwify, Hotmart, Mercado Pago, Asaas.

```
POST /api/webhook/kiwify
POST /api/webhook/hotmart
POST /api/webhook/mercadopago
POST /api/webhook/asaas
```

Cada webhook:
1. Valida assinatura (HMAC ou token fixo)
2. Verifica idempotência (event_id já processado?)
3. Normaliza payload → formato interno
4. Cria/atualiza clinic + user + subscription
5. Envia magic link por e-mail
6. Registra log de auditoria

---

## Variáveis de Ambiente

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
RESEND_API_KEY=...
WEBHOOK_SECRET_KIWIFY=...
WEBHOOK_SECRET_HOTMART=...
WEBHOOK_SECRET_MERCADOPAGO=...
WEBHOOK_SECRET_ASAAS=...
NEXT_PUBLIC_APP_URL=https://radar.precya.com.br
```

---

## Integração com Outros Docs

- Schema de banco → **BANCO-DADOS.md**
- Segurança do webhook → **SEGURANCA.md**
- Componentes React → **COMPONENTES.md**
- Deploy → **DEPLOY.md**
