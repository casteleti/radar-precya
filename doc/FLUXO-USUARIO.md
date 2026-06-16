# 🗺️ FLUXO DO USUÁRIO — RADAR PRECYA

## Fluxo Completo (Visual)

```
[PLATAFORMA DE PAGAMENTO]
        ↓ webhook
[POST /api/webhook/:plataforma]
        ↓ cria clinic + user + subscription
        ↓ envia magic link por e-mail
[E-MAIL: "Seu acesso chegou!"]
        ↓ usuária clica no link
[/magic-link?token=xxx]
        ↓ valida token → cria sessão
[REDIRECT → /onboarding]
        ↓
[ONBOARDING PASSO 1: Nome da clínica]
        ↓
[ONBOARDING PASSO 2: Gastos mensais]
        ↓
[ONBOARDING PASSO 3: Procedimentos]
        ↓
[ONBOARDING PASSO 4: Confirmação]
        ↓
[REDIRECT → /calculadora]
        ↓
[CALCULADORA: Seleciona procedimento]
        ↓
[SIMULAÇÃO: Move slider de desconto]
        ↓
[RESULTADO: Badge + Lucro + Texto WhatsApp]
        ↓
[COPIA MENSAGEM WHATSAPP]
```

---

## FASE 1: Compra

O usuário compra via Kiwify, Hotmart, Mercado Pago ou Asaas.

- Plataforma envia webhook para `/api/webhook/:plataforma`
- Sistema cria clinic, user e subscription automaticamente
- Sistema envia e-mail com magic link

**O usuário nunca cadastra senha.**

---

## FASE 2: E-mail de Boas-Vindas

```
Assunto: 🎉 Seu acesso ao Radar Precya está aqui!

Olá, [Nome]!

Seu acesso foi ativado. Clique no botão abaixo para entrar:

[ACESSAR MEU RADAR]

Este link expira em 15 minutos.
Se não foi você, ignore este e-mail.
```

---

## FASE 3: Login por Magic Link

**Tela: `/magic-link?token=xxx`**

### Estados da tela

**Carregando:**
```
⏳ Verificando seu acesso...
```

**Sucesso:**
```
✅ Acesso confirmado!
   Redirecionando...
```

**Token expirado:**
```
⏰ Este link expirou.
   [Solicitar novo link]
```

**Token inválido:**
```
❌ Link inválido ou já utilizado.
   [Solicitar novo link]
```

---

## FASE 4: LOGIN MANUAL (acesso recorrente)

**Tela: `/login`**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [Logo Radar Precya]

  Entre com seu e-mail

  ┌─────────────────────────┐
  │ seu@email.com           │
  └─────────────────────────┘

  [Enviar link de acesso]

  Você receberá um link mágico
  no seu e-mail. Sem senha! 🔮
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Após envio:**
```
📧 Link enviado!
   Verifique seu e-mail.
   O link expira em 15 minutos.
```

**Validações:**
- E-mail obrigatório
- Formato de e-mail válido
- E-mail deve existir no banco (erro genérico para não revelar)

---

## FASE 5: ONBOARDING

### Barra de Progresso

```
● ─── ● ─── ○ ─── ○
1     2     3     4
```

---

### PASSO 1: Nome da Clínica

**Título:** Vamos começar! Como se chama sua clínica?
**Subtítulo:** Isso aparecerá no seu painel.

```
┌──────────────────────────────┐
│ Nome da clínica              │
│ ┌──────────────────────────┐ │
│ │ Ex: Studio Bella         │ │
│ └──────────────────────────┘ │
│                              │
│        [Continuar →]         │
└──────────────────────────────┘
```

**Validações:**
- Obrigatório
- Mínimo 2 caracteres
- Máximo 80 caracteres

**O que salva:** `clinics.name`

---

### PASSO 2: Gastos Mensais

**Título:** Quanto você gasta por mês na clínica?
**Subtítulo:** Inclua aluguel, funcionários, contas, materiais fixos. Não precisa ser exato — uma estimativa já ajuda muito!

```
┌──────────────────────────────┐
│ 💡 Gastos fixos mensais      │
│ ┌──────────────────────────┐ │
│ │ R$ 0,00                  │ │
│ └──────────────────────────┘ │
│                              │
│ 📅 Atendimentos por mês      │
│ ┌──────────────────────────┐ │
│ │ 0                        │ │
│ └──────────────────────────┘ │
│                              │
│ ← Voltar   [Continuar →]    │
└──────────────────────────────┘
```

**Microcopy de ajuda:**
- Gastos: "Aluguel + salários + contas de luz/água/internet + materiais"
- Atendimentos: "Quantos clientes você atende em média por mês?"

**Validações:**
- Gastos: obrigatório, ≥ 0, numérico
- Atendimentos: obrigatório, ≥ 1, inteiro

**O que salva:** `clinic_cost_profiles.monthly_fixed_costs`, `clinic_cost_profiles.monthly_appointments`

---

### PASSO 3: Seus Procedimentos

**Título:** Quais procedimentos você realiza?
**Subtítulo:** Adicione os principais. Você pode editar depois.

```
┌──────────────────────────────┐
│ [+ Adicionar procedimento]   │
│                              │
│ ┌──────────────────────────┐ │
│ │ Nome: Limpeza de Pele    │ │
│ │ Preço: R$ 150,00         │ │
│ │ Produto/insumo: R$ 20,00 │ │
│ │ Comissão: 0%             │ │
│ │                    [✕]   │ │
│ └──────────────────────────┘ │
│                              │
│ ← Voltar   [Continuar →]    │
└──────────────────────────────┘
```

**Campos por procedimento:**
- Nome (obrigatório, max 80 chars)
- Preço de venda (obrigatório, R$, ≥ 0)
- Custo de produto/insumo (opcional, R$, default 0)
- Comissão da profissional (opcional, %, default 0)

**Regras:**
- Mínimo 1 procedimento para continuar
- Máximo 20 procedimentos no onboarding

**O que salva:** `procedures` (um registro por procedimento)

---

### PASSO 4: Confirmação

**Título:** Tudo certo! Veja o resumo.
**Subtítulo:** Você pode editar qualquer informação depois.

```
┌──────────────────────────────┐
│ ✅ Clínica                   │
│    Studio Bella              │
│                              │
│ ✅ Gastos mensais            │
│    R$ 8.000,00               │
│    120 atendimentos/mês      │
│    → R$ 66,67 por atendimento│
│                              │
│ ✅ Procedimentos (3)         │
│    • Limpeza de Pele — R$ 150│
│    • Peeling — R$ 200        │
│    • Botox — R$ 500          │
│                              │
│ ← Voltar  [Ir para Radar →] │
└──────────────────────────────┘
```

**Após confirmar:** redireciona para `/calculadora`

---

## FASE 6: CALCULADORA

### Layout

```
┌─────────────────────────────────────────┐
│ [Logo]              Olá, Studio Bella 👋 │
├─────────────────────────────────────────┤
│                                         │
│  Selecione o procedimento               │
│  ┌───────────────────────────────────┐  │
│  │ ▼ Limpeza de Pele — R$ 150,00    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─────────────────┐ ┌───────────────┐  │
│  │  💰 Lucro bruto │ │ 📊 Custo unit │  │
│  │   R$ 63,33      │ │   R$ 86,67    │  │
│  └─────────────────┘ └───────────────┘  │
│                                         │
│  Simular desconto                       │
│  ────────────────────────────────────── │
│  0%     [========●========]     50%     │
│                  15%                    │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  Com 15% de desconto:               ││
│  │  Preço: R$ 127,50                   ││
│  │  Lucro: R$ 40,83                    ││
│  │  ● MARGEM SAUDÁVEL                  ││
│  └─────────────────────────────────────┘│
│                                         │
│  [📱 Ver mensagem WhatsApp]             │
│                                         │
└─────────────────────────────────────────┘
```

### Modo WhatsApp

Ao clicar "Ver mensagem WhatsApp":

```
┌─────────────────────────────────────────┐
│  📱 Mensagem para WhatsApp              │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Oi! 😊 Que bom que você gostou da   ││
│  │ Limpeza de Pele!                    ││
│  │                                     ││
│  │ Posso sim fazer por R$ 127,50.      ││
│  │ Seria um desconto especial de 15%   ││
│  │ para você. 💜                       ││
│  │                                     ││
│  │ Quer agendar?                       ││
│  └─────────────────────────────────────┘│
│                                         │
│  [📋 Copiar mensagem]                   │
│                                         │
│  ✓ Copiado!  ← aparece por 2s          │
└─────────────────────────────────────────┘
```

---

## Integração com Outros Docs

- Fórmulas de cálculo → **CALCULADORA.md**
- Componentes visuais → **DESIGN-SYSTEM.md**
- O que salva em cada passo → **BANCO-DADOS.md**
- Segurança do magic link → **SEGURANCA.md**
