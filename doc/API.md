# 🔌 API — RADAR PRECYA

## Visão Geral

Todas as rotas da API usam Next.js Route Handlers (`app/api/**/route.ts`). Respostas em JSON. Autenticação via cookie de sessão (exceto webhooks).

---

## Autenticação

### POST /api/auth/send-magic-link

Envia magic link por e-mail.

**Request:**
```json
{ "email": "user@example.com" }
```

**Response (200):**
```json
{ "success": true }
```

**Response (429):**
```json
{ "error": "Muitas tentativas. Aguarde alguns minutos." }
```

**Notas:**
- Sempre retorna 200, mesmo se o e-mail não existir (segurança)
- Rate limit: 3 req / 10 min por IP

---

### GET /api/auth/verify?token=xxx

Verifica magic link e cria sessão.

**Response (200):**
```json
{ "success": true, "redirect": "/onboarding" }
```

**Response (400):**
```json
{ "error": "TOKEN_EXPIRED" }
{ "error": "TOKEN_ALREADY_USED" }
{ "error": "INVALID_TOKEN" }
```

---

### POST /api/auth/logout

Encerra a sessão.

**Response (200):**
```json
{ "success": true }
```

---

## Onboarding

### POST /api/onboarding/step1

Salva nome da clínica.

**Headers:** `Cookie: session_token=xxx`

**Request:**
```json
{ "clinic_name": "Studio Bella" }
```

**Response (200):**
```json
{ "success": true }
```

**Response (401):**
```json
{ "error": "Unauthorized" }
```

---

### POST /api/onboarding/step2

Salva gastos mensais e volume de atendimentos.

**Request:**
```json
{
  "monthly_fixed_costs": 8000,
  "monthly_appointments": 120
}
```

**Response (200):**
```json
{ "success": true }
```

---

### POST /api/onboarding/step3

Salva procedimentos.

**Request:**
```json
{
  "procedures": [
    {
      "name": "Limpeza de Pele",
      "price": 150,
      "product_cost": 20,
      "commission_pct": 10
    }
  ]
}
```

**Response (200):**
```json
{ "success": true, "procedure_ids": ["uuid-1", "uuid-2"] }
```

---

### POST /api/onboarding/complete

Marca onboarding como concluído.

**Response (200):**
```json
{ "success": true, "redirect": "/calculadora" }
```

---

## Procedimentos

### GET /api/procedures

Lista procedimentos ativos da clínica.

**Response (200):**
```json
{
  "procedures": [
    {
      "id": "uuid",
      "name": "Limpeza de Pele",
      "price": 150,
      "product_cost": 20,
      "commission_pct": 10
    }
  ]
}
```

---

### POST /api/procedures

Cria novo procedimento.

**Request:**
```json
{
  "name": "Peeling",
  "price": 200,
  "product_cost": 30,
  "commission_pct": 15
}
```

**Response (201):**
```json
{ "id": "uuid", "name": "Peeling", ... }
```

---

### PATCH /api/procedures/:id

Atualiza procedimento existente.

**Request:** campos parciais do procedimento.

**Response (200):**
```json
{ "success": true }
```

**Validação:** Verifica que `clinic_id` do procedimento = `clinic_id` da sessão.

---

### DELETE /api/procedures/:id

Desativa procedimento (soft delete: `active = false`).

**Response (200):**
```json
{ "success": true }
```

---

## Webhooks

### POST /api/webhook/kiwify

**Headers:**
```
X-Kiwify-Signature: sha1=<hmac>
```

**Payload (exemplo):**
```json
{
  "webhook_id": "evt_xxx",
  "order_id": "ORD-123",
  "order_status": "paid",
  "Customer": {
    "full_name": "Ana Souza",
    "email": "ana@email.com"
  },
  "Product": {
    "name": "Radar Precya Anual"
  },
  "order_total": 297
}
```

**Response (200):**
```json
{ "received": true }
```

**Response (400):**
```json
{ "error": "Invalid signature" }
```

---

### POST /api/webhook/hotmart

**Headers:**
```
X-Hotmart-Hottok: <token>
```

**Payload (exemplo):**
```json
{
  "id": "evt_yyy",
  "event": "PURCHASE_APPROVED",
  "data": {
    "purchase": { "order_date": "...", "status": "APPROVED" },
    "buyer": { "name": "Maria", "email": "maria@email.com" },
    "product": { "name": "Radar Precya" }
  }
}
```

---

### POST /api/webhook/mercadopago

**Headers:**
```
x-signature: ts=xxx,v1=yyy
```

---

### POST /api/webhook/asaas

**Headers:**
```
asaas-access-token: <token>
```

---

## Erros Padrão

| Status | Código | Descrição |
|--------|--------|-----------|
| 400 | `INVALID_INPUT` | Dados inválidos |
| 401 | `UNAUTHORIZED` | Sem sessão ou sessão expirada |
| 403 | `FORBIDDEN` | Sem permissão para o recurso |
| 404 | `NOT_FOUND` | Recurso não encontrado |
| 409 | `CONFLICT` | Já existe (ex: e-mail duplicado) |
| 429 | `RATE_LIMITED` | Muitas requisições |
| 500 | `INTERNAL_ERROR` | Erro interno |

---

## Validação

Todos os endpoints usam Zod para validar o body antes de qualquer operação.

```typescript
// Exemplo padrão de route handler
export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session) {
    return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = step2Schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'INVALID_INPUT', details: parsed.error.flatten() }, { status: 400 })
  }

  // lógica...
}
```

---

## Integração com Outros Docs

- Schemas de validação → **SEGURANCA.md** (seção "Validação de Inputs")
- Payload dos webhooks → **SEGURANCA.md** (seção "Payload Normalizado")
- Estrutura do banco → **BANCO-DADOS.md**
