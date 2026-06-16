# 🎯 MVP — RADAR PRECYA

## O que é o MVP

O MVP (Fase 1) é o mínimo necessário para uma clínica comprar, acessar e usar o Radar para tomar decisões de precificação no WhatsApp.

---

## ✅ O QUE ENTRA no MVP

### Autenticação
- [x] Magic link (sem senha)
- [x] Login por e-mail
- [x] Sessão de 30 dias
- [x] Logout

### Onboarding
- [x] Passo 1: Nome da clínica
- [x] Passo 2: Gastos mensais + volume de atendimentos
- [x] Passo 3: Cadastro de procedimentos (nome, preço, produto, comissão)
- [x] Passo 4: Confirmação e resumo

### Calculadora
- [x] Seleção de procedimento
- [x] Exibição de custo por atendimento
- [x] Exibição de lucro sem desconto
- [x] Slider de desconto (0–50%)
- [x] Cálculo instantâneo de lucro com desconto
- [x] Badge de status (saudável / risco / prejuízo)
- [x] Mensagem WhatsApp gerada automaticamente
- [x] Botão de copiar mensagem

### Webhook
- [x] Kiwify
- [x] Hotmart
- [x] Mercado Pago
- [x] Asaas
- [x] Idempotência
- [x] Log de auditoria

### Infraestrutura
- [x] Multi-tenant (isolamento por clinic_id)
- [x] Mobile-first
- [x] Design system completo (cores, tipografia, componentes)

---

## ❌ O QUE NÃO ENTRA no MVP

### Features de produto
- [ ] Relatórios e gráficos
- [ ] Histórico de simulações salvo
- [ ] Comparação entre procedimentos
- [ ] Meta de faturamento
- [ ] Análise de concorrência
- [ ] Sugestão de preço por IA/LLM

### Multiusuário
- [ ] Convidar profissional (staff)
- [ ] Permissões por role (além de owner/staff básico)
- [ ] Segunda conta na mesma clínica
- [ ] Auditoria de ações por usuário

### Integrações
- [ ] Integração com agenda (Clinicorp, iClinic, etc.)
- [ ] Integração com financeiro
- [ ] API pública
- [ ] Webhooks de saída (notificações)

### Conteúdo
- [ ] Blog / artigos
- [ ] Tutoriais em vídeo inline
- [ ] Onboarding interativo com tour

### Pagamentos
- [ ] Troca de plano pelo app
- [ ] Cancelamento pelo app
- [ ] Portal do cliente (boleto, nota fiscal)

### Administrativo
- [ ] Painel de admin (backoffice)
- [ ] Métricas de uso (dashboard interno)
- [ ] Gestão de clínicas pela equipe Precya

---

## Critérios de Aceite do MVP

Para considerar o MVP **concluído**, todos os itens abaixo devem funcionar:

### Fluxo completo de compra → uso

```
1. Simular webhook de compra (Kiwify)
   → Clínica criada no banco ✓
   → Usuária criada ✓
   → E-mail enviado ✓

2. Clicar no magic link do e-mail
   → Login bem-sucedido ✓
   → Redirecionado para onboarding ✓

3. Completar onboarding (4 passos)
   → Dados salvos no banco ✓
   → Redirecionado para calculadora ✓

4. Usar calculadora
   → Selecionar procedimento ✓
   → Mover slider ✓
   → Ver badge de status ✓
   → Copiar mensagem WhatsApp ✓

5. Fechar e reabrir o app
   → Sessão mantida ✓
   → Calculadora disponível (sem onboarding de novo) ✓
```

### Segurança

```
6. Tentar acessar /calculadora sem login
   → Redirecionado para /login ✓

7. Tentar acessar dado de outra clínica via URL
   → 404 ou dados da própria clínica ✓

8. Usar magic link expirado (>15min)
   → Erro claro com opção de solicitar novo ✓

9. Usar magic link já utilizado
   → Erro claro ✓

10. Webhook duplicado (mesmo event_id)
    → Processado apenas 1 vez ✓
```

### UX

```
11. Abrir no celular (375px)
    → Layout correto, sem scroll horizontal ✓
    → Slider funcional no touch ✓
    → Copiar mensagem funciona ✓
```

---

## Estimativa de Horas

| Módulo | Horas estimadas |
|--------|----------------|
| Setup Next.js + Prisma + Tailwind | 2h |
| Magic link + sessão | 6h |
| Webhook (4 plataformas) | 8h |
| Onboarding (4 passos) | 10h |
| Calculadora | 8h |
| Design system (componentes base) | 6h |
| Testes de integração básicos | 6h |
| Deploy (Docker + Coolify) | 4h |
| **Total** | **~50h** |

---

## Ordem de Implementação Recomendada

```
1. Setup (Next.js, Prisma, Tailwind, env vars)
2. Schema de banco + migrations
3. Magic link (sem e-mail real, só log)
4. Sessão + middleware de proteção
5. Onboarding (telas + API)
6. Calculadora (lógica + UI)
7. Webhook (Kiwify primeiro, depois outros)
8. E-mail real (Resend)
9. Testes de segurança
10. Deploy
```

---

## O que muda após MVP (Fase 2)

- Histórico de simulações com gráfico de evolução
- Convidar profissionais (multi-usuário)
- Relatório mensal por procedimento
- Integração com agenda

**Mas isso não é agora. Foque no MVP.**
