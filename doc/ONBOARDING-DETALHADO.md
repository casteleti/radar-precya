# 📋 ONBOARDING DETALHADO — RADAR PRECYA

## Visão Geral

O onboarding acontece logo após o primeiro login por magic link. É obrigatório — o middleware bloqueia acesso à calculadora enquanto `onboarding_completed = false`.

**4 passos. Mobile-first. Tom amigável.**

---

## Estrutura de Rotas

```
/onboarding          → redireciona para /onboarding/1
/onboarding/1        → Passo 1: Nome da clínica
/onboarding/2        → Passo 2: Gastos mensais
/onboarding/3        → Passo 3: Procedimentos
/onboarding/4        → Passo 4: Confirmação
```

Cada passo salva via API antes de avançar. Se a usuária fechar e voltar, retoma do passo não concluído.

---

## PASSO 1 — Nome da Clínica

### Tela

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [Logo]

  ● ─── ○ ─── ○ ─── ○

  Vamos começar! Como se chama
  sua clínica? 🌸

  ┌────────────────────────────┐
  │ Ex: Studio Bella           │
  └────────────────────────────┘
  Esse nome aparecerá no seu painel.

              [Continuar →]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Microcopy

- **Título:** "Vamos começar! Como se chama sua clínica? 🌸"
- **Placeholder:** "Ex: Studio Bella"
- **Helper:** "Esse nome aparecerá no seu painel."
- **Botão:** "Continuar →"

### Validações (frontend + backend)

| Campo | Regra |
|-------|-------|
| `clinic_name` | Obrigatório |
| `clinic_name` | Mínimo 2 caracteres |
| `clinic_name` | Máximo 80 caracteres |
| `clinic_name` | Trim (remover espaços) |

### Comportamento

- Input com foco automático ao carregar a tela
- Botão desabilitado enquanto campo vazio
- Enter no input avança para o próximo passo
- Ao clicar "Continuar": POST /api/onboarding/step1 → navega para /onboarding/2

---

## PASSO 2 — Gastos Mensais

### Tela

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [Logo]

  ● ─── ● ─── ○ ─── ○

  Quanto você gasta por mês
  na clínica? 💸

  💡 Gastos fixos mensais
  ┌────────────────────────────┐
  │ R$ 0,00                    │
  └────────────────────────────┘
  Aluguel + salários + contas + materiais fixos

  📅 Atendimentos por mês
  ┌────────────────────────────┐
  │ 0                          │
  └────────────────────────────┘
  Quantos clientes você atende em média?

  ← Voltar          [Continuar →]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Microcopy

- **Título:** "Quanto você gasta por mês na clínica? 💸"
- **Label gastos:** "💡 Gastos fixos mensais"
- **Helper gastos:** "Aluguel + salários + contas + materiais fixos"
- **Label atendimentos:** "📅 Atendimentos por mês"
- **Helper atendimentos:** "Quantos clientes você atende em média?"

### Card informativo (aparece abaixo após preencher ambos)

```
📊 Custo por atendimento: R$ 66,67
   Com R$ 8.000 de gastos e 120 atendimentos.
```

### Validações

| Campo | Regra |
|-------|-------|
| `monthly_fixed_costs` | Obrigatório |
| `monthly_fixed_costs` | ≥ 0 |
| `monthly_fixed_costs` | Numérico |
| `monthly_appointments` | Obrigatório |
| `monthly_appointments` | ≥ 1 (evitar divisão por zero) |
| `monthly_appointments` | Inteiro |
| `monthly_appointments` | ≤ 10.000 |

---

## PASSO 3 — Procedimentos

### Tela (estado inicial — sem procedimentos)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [Logo]

  ● ─── ● ─── ● ─── ○

  Quais procedimentos você
  realiza? 💆‍♀️

  Adicione pelo menos 1 para continuar.
  Você pode editar depois!

  ┌────────────────────────────────┐
  │  + Adicionar procedimento      │
  └────────────────────────────────┘

  ← Voltar          [Continuar →]
  (botão desabilitado enquanto sem procedimentos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Tela (com procedimentos)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Quais procedimentos você
  realiza? 💆‍♀️

  ┌──────────────────────────────┐
  │ Limpeza de Pele              │
  │ Preço: R$ 150,00             │
  │ Produto: R$ 20,00 · Comissão: 10%│
  │                        [✕]  │
  └──────────────────────────────┘

  ┌──────────────────────────────┐
  │ Peeling Químico              │
  │ Preço: R$ 220,00             │
  │ Produto: R$ 35,00 · Comissão: 0% │
  │                        [✕]  │
  └──────────────────────────────┘

  [+ Adicionar outro]

  ← Voltar          [Continuar →]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Formulário de Procedimento (inline ou modal)

```
Nome do procedimento *
┌──────────────────────────────────┐
│ Ex: Limpeza de Pele              │
└──────────────────────────────────┘

Preço de venda *
┌──────────────────────────────────┐
│ R$ 0,00                          │
└──────────────────────────────────┘

Custo de produto/insumo
┌──────────────────────────────────┐
│ R$ 0,00                          │
└──────────────────────────────────┘
Produtos usados no procedimento (opcional)

Comissão da profissional
┌──────────────────────────────────┐
│ 0%                               │
└──────────────────────────────────┘
Se houver repasse para profissional terceirizada

[Cancelar]          [Salvar]
```

### Validações por Procedimento

| Campo | Regra |
|-------|-------|
| `name` | Obrigatório, 1–80 chars |
| `price` | Obrigatório, > 0 |
| `product_cost` | Opcional, ≥ 0, default 0 |
| `commission_pct` | Opcional, 0–100, default 0 |

### Regras de Negócio

- Mínimo: 1 procedimento para avançar
- Máximo: 20 procedimentos no onboarding
- Nomes duplicados: permitido (clínicas podem ter variações)

---

## PASSO 4 — Confirmação

### Tela

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [Logo]

  ● ─── ● ─── ● ─── ●

  Tudo certo! Veja o resumo 🎉

  ┌──────────────────────────────┐
  │ ✅ Sua clínica               │
  │    Studio Bella              │
  └──────────────────────────────┘

  ┌──────────────────────────────┐
  │ ✅ Gastos mensais            │
  │    R$ 8.000,00               │
  │    120 atendimentos/mês      │
  │    → R$ 66,67 por atendimento│
  └──────────────────────────────┘

  ┌──────────────────────────────┐
  │ ✅ Procedimentos (2)         │
  │    • Limpeza de Pele — R$ 150│
  │    • Peeling — R$ 220        │
  └──────────────────────────────┘

  Você pode editar tudo isso depois
  nas configurações. 😊

  ← Voltar    [Ir para o Radar →]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Comportamento ao clicar "Ir para o Radar →"

1. POST /api/onboarding/complete
2. Atualiza `users.onboarding_completed = true`
3. Redireciona para `/calculadora`

---

## Persistência entre Sessões

Se a usuária fechar o browser no meio do onboarding:

- Passo 1 salvo → ao voltar, campo já preenchido
- Passo 2 salvo → idem
- Passo 3 salvo → procedimentos listados
- Se nenhum salvo → começa do passo 1

O middleware redireciona para `/onboarding` enquanto `onboarding_completed = false`. A página de onboarding detecta o progresso e exibe o passo correto.

```typescript
// app/onboarding/page.tsx (Server Component)
export default async function OnboardingPage() {
  const session = await getServerSession()
  const profile = await prisma.clinicCostProfile.findUnique({
    where: { clinic_id: session.clinic_id }
  })
  const procedures = await prisma.procedure.findMany({
    where: { clinic_id: session.clinic_id }
  })
  const clinic = await prisma.clinic.findUnique({
    where: { id: session.clinic_id }
  })

  // Detectar passo atual
  if (!clinic?.name || clinic.name === '') redirect('/onboarding/1')
  if (!profile) redirect('/onboarding/2')
  if (procedures.length === 0) redirect('/onboarding/3')
  redirect('/onboarding/4')
}
```

---

## Integração com Outros Docs

- Componentes React de cada passo → **COMPONENTES.md**
- Estilos e animações → **DESIGN-SYSTEM.md**
- Schema do banco → **BANCO-DADOS.md**
- Endpoints de API → **API.md**
