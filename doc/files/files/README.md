# 📊 RADAR PRECYA — Documentação Completa

**Radar Precya** é um microSaaS premium de precificação inteligente para clínicas de estética.

## 🎯 O que é o Radar

Uma calculadora inteligente que ajuda clínicas a:
- ✅ Entender lucro real por atendimento
- ✅ Descobrir preço mínimo e saudável
- ✅ Simular desconto durante negociação
- ✅ Gerar respostas prontas para WhatsApp
- ✅ Tomar decisões rápidas e seguras

## 🚀 Quick Start

```bash
# Clone, instale, rode
git clone ...
npm install
npm run dev
```

Acesse: `http://localhost:3000`

## 📁 Estrutura de Documentos

| Documento | Propósito |
|-----------|-----------|
| **ARQUITETURA.md** | Stack, multi-tenant, infra |
| **DESIGN-SYSTEM.md** | Cores, fontes, componentes |
| **FLUXO-USUARIO.md** | Jornada completa do usuário |
| **BANCO-DADOS.md** | Schema, tabelas, relacionamentos |
| **API.md** | Endpoints, webhooks, payloads |
| **SEGURANCA.md** | Checklist, práticas, validações |
| **COMPONENTES.md** | Estrutura React, component tree |
| **ONBOARDING-DETALHADO.md** | Cada tela, microcopy exato |
| **CALCULADORA.md** | Lógica de cálculo, simulações |
| **DEPLOY.md** | Stack, containers, Hetzner, Coolify |
| **MVP.md** | Definição exata do que entra/sai |
| **ROADMAP.md** | Futuro do produto |

## 🎨 Design System Resumido

### Cores
- **Roxo escuro** (#2E1A73): Títulos, marca
- **Roxo principal** (#5E3ECF): Botões, CTAs
- **Roxo vibrante** (#7C4DFF): Hover, detalhes
- **Roxo claro** (#B79CFF): Badges, fundos
- **Sucesso** (#2BAE66): Margem protegida
- **Alerta** (#F5A623): Margem em risco
- **Erro** (#E65A5A): Prejuízo

### Tipografia
- **Font**: Poppins ou Plus Jakarta Sans
- **Headlines**: Semibold, não bold pesado
- **Microcopy**: Leve, conversacional

### Estilo
- SaaS premium, wellness-tech, feminino sofisticado
- Sem cara de ERP, sem visual corporativo pesado
- Cards com bordas suaves, sombras leves

## 🏗️ Multi-Tenant

Cada clínica é isolada por `clinic_id`:

```
clinics (id, name, owner_user_id, status, ...)
  ├─ users (clinic_id, email, role, ...)
  ├─ subscriptions (clinic_id, platform, status, ...)
  ├─ clinic_cost_profiles (clinic_id, fixed_costs, ...)
  ├─ procedures (clinic_id, name, price, ...)
  └─ simulations (clinic_id, procedure_id, ...)
```

**Regra crítica:** Nunca retornar dados sem filtrar por `clinic_id`.

## 🔐 Autenticação

- **Magic Link**: Sem senha, por e-mail
- **Sessão**: 30 dias
- **Multi-usuário**: Owner + Staff
- **Webhook**: Kiwify, Hotmart, Mercado Pago, Asaas

## 📲 Fluxo Principal

```
1. Compra (plataforma de pagamento)
   ↓
2. Webhook chega (normalizado)
   ↓
3. Cria clinic, user, subscription
   ↓
4. Envia e-mail com magic link
   ↓
5. Usuária clica
   ↓
6. Login via magic link
   ↓
7. Onboarding (4 passos)
   ↓
8. Primeira simulação
   ↓
9. Calculadora
```

## 🧮 Lógica de Cálculo (Simplificada)

```javascript
// Custo por atendimento
custo_por_atendimento = gastos_mensais / atendimentos_por_mes

// Lucro em um preço
lucro = preco - (custo_por_atendimento + custo_produto + comissao)

// Impacto de desconto
lucro_com_desconto = preco * (1 - desconto%) - (custo_por_atendimento + custo_produto + comissao)

// Status de margem
if lucro_com_desconto > 0:
  if lucro_com_desconto > lucro * 0.8: Verde (saudável)
  else: Laranja (atenção)
else: Vermelho (prejuízo)
```

## 📊 MVP (Fase 1)

### ✅ Entra no MVP
- Onboarding (4 passos)
- Calculadora (simular preço/desconto)
- Modo WhatsApp (copiar resposta)
- Magic link (sem senha)
- Multi-tenant com clinic_id
- Webhook de pagamento
- Design system completo
- Mobile-first

### ❌ NÃO entra no MVP
- Relatórios
- Histórico de simulações
- Integração com agenda
- Multi-profissional
- Análise de concorrência
- IA/LLM para insights
- Permissões complexas
- Segunda conta na clínica

## 🚀 Como usar esta documentação

1. **Leia** `ARQUITETURA.md` primeiro (entenda o todo)
2. **Leia** `DESIGN-SYSTEM.md` (antes de codificar UI)
3. **Leia** `FLUXO-USUARIO.md` (entenda a jornada)
4. **Leia** `BANCO-DADOS.md` (antes de criar schema)
5. **Copie** estrutura de `COMPONENTES.md`
6. **Use** `ONBOARDING-DETALHADO.md` para telas exatas
7. **Implemente** lógica de `CALCULADORA.md`
8. **Valide** com `SEGURANCA.md`
9. **Deploy** com `DEPLOY.md`

## 🔗 Comandos Úteis

```bash
# Rodar dev
npm run dev

# Build
npm run build

# Gerar Prisma
npx prisma generate

# Migração
npx prisma migrate

# Seed (futura)
npx prisma db seed
```

## 📞 Suporte

Em caso de dúvida, revise o documento específico ou procure comentários no código.

---

**Versão**: 1.0  
**Último update**: 15 de junho de 2025  
**Status**: Pronto para desenvolvimento
