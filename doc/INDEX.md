# 📚 ÍNDICE COMPLETO — DOCUMENTAÇÃO RADAR PRECYA

## 🎯 Bem-vindo!

Esta documentação foi desenhada para guiar o Claude Code na construção completa do Radar.

**Leia nesta ordem:**

---

## 1️⃣ COMECE AQUI (30 minutos)

### **README.md**
**O quê?** Visão geral, stack resumida, estrutura de docs  
**Por quê?** Entender o big picture  
**Tempo:** 5 minutos

### **FLUXO-USUARIO.md**
**O quê?** Jornada completa do usuário: compra → login → onboarding → calculadora  
**Por quê?** Ver como tudo se conecta  
**Tempo:** 15 minutos

### **DESIGN-SYSTEM.md** (seção "Visão Geral")
**O quê?** Cores, tipografia, componentes principais  
**Por quê?** Entender visual antes de codificar  
**Tempo:** 10 minutos

---

## 2️⃣ ARQUITETURA (1 hora)

### **ARQUITETURA.md**
**O quê?** Stack (Next.js, TypeScript, Prisma), padrões, multi-tenant, middleware  
**Por quê?** Saber como estruturar o código  
**Tempo:** 30 minutos

### **BANCO-DADOS.md**
**O quê?** Schema Prisma completo, tabelas, relacionamentos, queries  
**Por quê?** Saber exatamente quais modelos criar  
**Tempo:** 20 minutos

### **SEGURANCA.md** (seção "Checklist")
**O quê?** Checklist de segurança, validações críticas  
**Por quê?** Não esquecer de nada  
**Tempo:** 10 minutos

---

## 3️⃣ IMPLEMENTAÇÃO (4-6 horas)

### **FLUXO-USUARIO.md** (completo)
**O quê?** Cada tela, microcopy exato, validações  
**Por quê?** Código exato do que codificar  
**Tempo:** 60 minutos

### **CALCULADORA.md**
**O quê?** Fórmulas, validações, geração de respostas WhatsApp  
**Por quê?** Lógica mais importante (100% client-side)  
**Tempo:** 45 minutos

### **DESIGN-SYSTEM.md** (completo)
**O quê?** Componentes, animações, responsividade, acessibilidade  
**Por quê?** Codificar UI corretamente  
**Tempo:** 60 minutos

### **BANCO-DADOS.md** (completo)
**O quê?** Queries exemplo, validações, migrations  
**Por quê?** Implementar ORM corretamente  
**Tempo:** 45 minutos

---

## 4️⃣ SEGURANÇA & INTEGRAÇÃO (2-3 horas)

### **SEGURANCA.md** (completo)
**O quê?** Magic link, webhook, rate limiting, isolamento multi-tenant  
**Por quê?** Não ter brechas críticas  
**Tempo:** 90 minutos

### **API-WEBHOOK.md** (se criado)
**O quê?** Endpoints, payload normalizado, tratamento de erros  
**Por quê?** Webhook de pagamento deve ser perfeito  
**Tempo:** 45 minutos

---

## 5️⃣ VALIDAÇÃO (1-2 horas)

### **MVP.md**
**O quê?** Exatamente o que entra e o que não entra  
**Por quê?** Não gastar tempo em features fora do MVP  
**Tempo:** 30 minutos

### **SEGURANCA.md** (checklist final)
**O quê?** Validar cada item antes de deploy  
**Por quê?** Garantir que não saiu errado  
**Tempo:** 30 minutos

---

## 📖 Documentos Disponíveis

### Core (Fundamental)

| Documento | Prioridade | Tempo | Quando ler |
|-----------|-----------|-------|-----------|
| **README.md** | 🔴 Crítica | 5 min | Primeiro |
| **ARQUITETURA.md** | 🔴 Crítica | 30 min | Antes de codificar |
| **FLUXO-USUARIO.md** | 🔴 Crítica | 90 min | Ao codificar telas |
| **BANCO-DADOS.md** | 🔴 Crítica | 30 min | Ao criar models |
| **CALCULADORA.md** | 🔴 Crítica | 45 min | Ao codificar lógica |

### Design & UX

| Documento | Prioridade | Tempo | Quando ler |
|-----------|-----------|-------|-----------|
| **DESIGN-SYSTEM.md** | 🟡 Alta | 60 min | Antes de codificar UI |

### Segurança & DevOps

| Documento | Prioridade | Tempo | Quando ler |
|-----------|-----------|-------|-----------|
| **SEGURANCA.md** | 🔴 Crítica | 90 min | Ao codificar auth/webhook |

### Guia de Produto

| Documento | Prioridade | Tempo | Quando ler |
|-----------|-----------|-------|-----------|
| **MVP.md** | 🟡 Alta | 30 min | Ao decidir features |

---

## 🔍 Como Encontrar Coisas

### "Como implementar magic link?"
→ SEGURANCA.md → Seção "2. Autenticação"

### "Qual é a fórmula de lucro com desconto?"
→ CALCULADORA.md → Seção "3. Simulação de Desconto"

### "Como validar isolamento multi-tenant?"
→ ARQUITETURA.md → Seção "Padrões" + SEGURANCA.md → Seção "3. Multi-Tenant"

### "Qual é o schema de Procedure?"
→ BANCO-DADOS.md → Seção "Model Procedure"

### "Como ficaria a tela do onboarding passo 2?"
→ FLUXO-USUARIO.md → Seção "PASSO 2: Gastos Mensais"

### "Que cores usar para status badge?"
→ DESIGN-SYSTEM.md → Seção "Badge" + CALCULADORA.md → Seção "4. Status Badge"

### "Como fazer webhook idempotente?"
→ SEGURANCA.md → Seção "4. Webhook Security" + BANCO-DADOS.md → "Idempotência"

### "O que entra no MVP?"
→ MVP.md → Seção "✅ O QUE ENTRA"

### "Qual é a ordem de telas?"
→ FLUXO-USUARIO.md → Seção "Fluxo Completo (Visual)"

---

## 🎬 Como Usar com Claude Code

### **Cenário 1: Codificar Onboarding**

```
1. Abrir FLUXO-USUARIO.md → "FASE 4: ONBOARDING"
2. Ler exatamente cada passo (1-4)
3. Ver DESIGN-SYSTEM.md → componentes usados
4. Ver BANCO-DADOS.md → o que salva
5. Implementar cada tela
6. Validar com SEGURANCA.md → validações
```

### **Cenário 2: Codificar Calculadora**

```
1. Abrir CALCULADORA.md → leia na ordem
2. Copie as fórmulas exatas
3. Implemente validações
4. Gere respostas WhatsApp
5. Teste com exemplos do doc
6. Integre com UI do DESIGN-SYSTEM.md
```

### **Cenário 3: Codificar Webhook**

```
1. Abrir SEGURANCA.md → "4. Webhook Security"
2. Copie código de validação de assinatura
3. Implemente idempotência (BANCO-DADOS.md)
4. Normalizar payload (código no SEGURANCA.md)
5. Criar/atualizar subscription (BANCO-DADOS.md)
6. Log auditoria (SEGURANCA.md → "7. Logging")
```

### **Cenário 4: Revisar Antes de Deploy**

```
1. SEGURANCA.md → Fazer checklist completo
2. MVP.md → Validar que nada extra foi adicionado
3. FLUXO-USUARIO.md → Testar cada tela
4. CALCULADORA.md → Testar com 5 exemplos
5. BANCO-DADOS.md → Verificar queries estão isoladas
6. DESIGN-SYSTEM.md → Validar visual
```

---

## 📝 Estrutura de um Documento

Cada documento segue este padrão:

```
Título (emoji + nome)
├─ Visão Geral (o que é?)
├─ Seções Temáticas
│  ├─ Código/Exemplos
│  ├─ Tabelas de Referência
│  ├─ Avisos importantes
│  └─ Casos de Uso
├─ Integração com Outros Docs
└─ Nota final
```

---

## 🚨 Avisos Importantes

### Magic Word: "SEMPRE"
Se um doc diz "SEMPRE", não é sugestão, é regra crítica.

Exemplo:
```
SEMPRE validar clinic_id em queries
SEMPRE usar magic link (não senha)
SEMPRE validar webhook signature
```

### Magic Word: "NUNCA"
Se um doc diz "NUNCA", é linha vermelha.

Exemplo:
```
NUNCA fazer query sem clinic_id
NUNCA salvar cartão
NUNCA confiar em event_id do front
```

### ✅ / ❌
- ✅ = Correto, fazer assim
- ❌ = Errado, não fazer

---

## 🔄 Fluxo de Desenvolvimento

```
1. Ler README (visão geral)
   ↓
2. Ler FLUXO-USUARIO (sequência)
   ↓
3. Ler ARQUITETURA (estrutura)
   ↓
4. Criar BANCO-DADOS (schema)
   ↓
5. Implementar AUTH (SEGURANCA)
   ↓
6. Implementar ONBOARDING (FLUXO-USUARIO + DESIGN-SYSTEM)
   ↓
7. Implementar CALCULADORA (CALCULADORA + DESIGN-SYSTEM)
   ↓
8. Implementar WEBHOOK (SEGURANCA + BANCO-DADOS)
   ↓
9. Testes (CALCULADORA + SEGURANCA)
   ↓
10. Checklist (MVP + SEGURANCA)
   ↓
11. Deploy
```

---

## 📊 Estatísticas de Documentação

```
Total de documentos: 10+
Total de seções: 150+
Linhas de código exemplo: 500+
Tabelas de referência: 30+
Checklists: 5+
Fluxogramas: 10+
Tempo total de leitura: 6-8 horas
Tempo total de implementação: 80-120 horas (com testes)
```

---

## 🆘 Troubleshooting

### "Não sei por onde começar"
→ Leia **README.md** + **FLUXO-USUARIO.md**

### "Como sei se está certo?"
→ Compare com exemplos em **BANCO-DADOS.md**, **CALCULADORA.md**, **FLUXO-USUARIO.md**

### "Tenho dúvida de segurança"
→ Procure em **SEGURANCA.md**

### "Não sei que cor usar"
→ Procure em **DESIGN-SYSTEM.md**

### "Que tela codificar primeiro?"
→ Procure em **FLUXO-USUARIO.md** → "Fluxo Completo"

### "Tenho uma feature fora do MVP?"
→ Consulte **MVP.md** → "❌ O QUE NÃO ENTRA"

---

## 📞 Contato / Suporte

Este é um projeto interno. Qualquer dúvida:

1. Revise o documento relevante
2. Procure a seção específica
3. Procure exemplos de código
4. Se ainda tiver dúvida, deixe comentário no código

---

## 🎉 Pronto para Começar?

Abra **README.md** agora e comece a leitura!

---

**Documentação última atualizada**: 15 de junho de 2025  
**Status**: Pronto para desenvolvimento  
**Versão**: 1.0
