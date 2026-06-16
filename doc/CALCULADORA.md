# 🧮 CALCULADORA — RADAR PRECYA

## Visão Geral

A calculadora é o coração do produto. Roda **100% no client-side** (sem chamadas à API durante a simulação) para ter resposta instantânea.

---

## 1. Dados de Entrada

```typescript
interface CalculadoraInputs {
  // Do banco (carregados na montagem da página)
  monthly_fixed_costs: number    // R$ gastos mensais
  monthly_appointments: number   // atendimentos/mês

  // Do procedimento selecionado
  procedure_name: string
  price: number          // preço de venda (R$)
  product_cost: number   // custo do produto/insumo (R$)
  commission_pct: number // comissão da profissional (%)

  // Da interação do usuário
  discount_pct: number   // slider: 0–50%
}
```

---

## 2. Fórmulas

### Custo por Atendimento

```typescript
const cost_per_appointment =
  monthly_fixed_costs / monthly_appointments
```

### Comissão em Reais

```typescript
const commission_value =
  price * (commission_pct / 100)
```

### Custo Total do Atendimento

```typescript
const total_cost =
  cost_per_appointment + product_cost + commission_value
```

### Preço com Desconto

```typescript
const final_price =
  price * (1 - discount_pct / 100)
```

### Lucro (sem desconto)

```typescript
const profit_no_discount =
  price - total_cost
```

### Lucro (com desconto)

```typescript
const profit_with_discount =
  final_price - total_cost
```

### Margem Percentual

```typescript
const margin_pct =
  (profit_with_discount / final_price) * 100
```

---

## 3. Simulação de Desconto

A simulação é executada sempre que o slider muda.

```typescript
function simulate(inputs: CalculadoraInputs): SimulationResult {
  const {
    monthly_fixed_costs,
    monthly_appointments,
    price,
    product_cost,
    commission_pct,
    discount_pct
  } = inputs

  const cost_per_appointment = monthly_fixed_costs / monthly_appointments
  const commission_value = price * (commission_pct / 100)
  const total_cost = cost_per_appointment + product_cost + commission_value
  const final_price = price * (1 - discount_pct / 100)
  const profit = final_price - total_cost
  const margin_pct = final_price > 0 ? (profit / final_price) * 100 : 0

  return {
    cost_per_appointment,
    commission_value,
    total_cost,
    final_price,
    profit,
    margin_pct,
    status: getMarginStatus(profit, profit - (price - total_cost))
  }
}
```

---

## 4. Status Badge

O status é determinado comparando o **lucro com desconto** ao **lucro original**.

```typescript
type MarginStatus = 'healthy' | 'risk' | 'loss'

function getMarginStatus(
  profit_with_discount: number,
  profit_original: number
): MarginStatus {
  if (profit_with_discount <= 0) {
    return 'loss'
  }

  if (profit_with_discount >= profit_original * 0.8) {
    return 'healthy'
  }

  return 'risk'
}
```

### Visualização

| Status | Badge | Cor | Condição |
|--------|-------|-----|---------|
| `healthy` | ✅ Margem Saudável | Verde `#2BAE66` | lucro ≥ 80% do original |
| `risk` | ⚠️ Margem em Risco | Laranja `#F5A623` | lucro > 0 e < 80% do original |
| `loss` | ❌ Prejuízo | Vermelho `#E65A5A` | lucro ≤ 0 |

---

## 5. Exemplos de Cálculo

### Exemplo 1: Limpeza de Pele

```
Gastos mensais: R$ 6.000
Atendimentos/mês: 80
→ Custo/atendimento: R$ 75,00

Procedimento:
  Preço: R$ 150,00
  Produto: R$ 15,00
  Comissão: 10% = R$ 15,00
  Total custo: R$ 105,00

Sem desconto:
  Lucro: R$ 45,00

Com 15% de desconto:
  Preço final: R$ 127,50
  Lucro: R$ 22,50
  Margem: 17,6%
  80% do original: R$ 36,00
  22,50 < 36,00 → ⚠️ RISCO

Com 5% de desconto:
  Preço final: R$ 142,50
  Lucro: R$ 37,50
  80% do original: R$ 36,00
  37,50 ≥ 36,00 → ✅ SAUDÁVEL
```

### Exemplo 2: Botox

```
Gastos mensais: R$ 8.000
Atendimentos/mês: 40
→ Custo/atendimento: R$ 200,00

Procedimento:
  Preço: R$ 500,00
  Produto: R$ 120,00
  Comissão: 20% = R$ 100,00
  Total custo: R$ 420,00

Sem desconto:
  Lucro: R$ 80,00

Com 20% de desconto:
  Preço final: R$ 400,00
  Lucro: R$ -20,00 → ❌ PREJUÍZO
```

---

## 6. Modo WhatsApp

Gera uma mensagem personalizada baseada no resultado da simulação.

```typescript
function generateWhatsAppMessage(
  procedure_name: string,
  discount_pct: number,
  final_price: number,
  status: MarginStatus
): string {
  if (discount_pct === 0) {
    return (
      `Oi! 😊 Obrigada pelo interesse na ${procedure_name}!\n\n` +
      `O valor é R$ ${formatCurrency(final_price)}. ` +
      `Posso te ajudar a agendar? 💜`
    )
  }

  if (status === 'loss') {
    return (
      `Oi! 😊 Que bom que você gostou da ${procedure_name}!\n\n` +
      `No momento não consigo fazer desconto nesse procedimento, ` +
      `mas posso te oferecer condições especiais de pagamento. ` +
      `O valor é R$ ${formatCurrency(final_price / (1 - discount_pct / 100))}. ` +
      `Vamos conversar? 💜`
    )
  }

  return (
    `Oi! 😊 Que bom que você gostou da ${procedure_name}!\n\n` +
    `Posso sim fazer por R$ ${formatCurrency(final_price)}. ` +
    `Seria um desconto especial de ${discount_pct}% para você. 💜\n\n` +
    `Quer agendar?`
  )
}
```

### Formatação de moeda

```typescript
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
// R$ 1.250,00
```

---

## 7. Estado da Calculadora (React)

```typescript
// hooks/useCalculadora.ts
export function useCalculadora(
  costProfile: ClinicCostProfile,
  procedures: Procedure[]
) {
  const [selectedProcedureId, setSelectedProcedureId] = useState(
    procedures[0]?.id ?? ''
  )
  const [discountPct, setDiscountPct] = useState(0)

  const procedure = procedures.find(p => p.id === selectedProcedureId)

  const result = useMemo(() => {
    if (!procedure) return null
    return simulate({
      monthly_fixed_costs: costProfile.monthly_fixed_costs,
      monthly_appointments: costProfile.monthly_appointments,
      price: procedure.price,
      product_cost: procedure.product_cost,
      commission_pct: procedure.commission_pct,
      discount_pct: discountPct
    })
  }, [procedure, costProfile, discountPct])

  const whatsappMessage = useMemo(() => {
    if (!result || !procedure) return ''
    return generateWhatsAppMessage(
      procedure.name,
      discountPct,
      result.final_price,
      result.status
    )
  }, [result, procedure, discountPct])

  return {
    selectedProcedureId,
    setSelectedProcedureId,
    discountPct,
    setDiscountPct,
    result,
    whatsappMessage
  }
}
```

---

## 8. Validações

- `monthly_appointments` nunca pode ser 0 (divisão por zero)
- `price` deve ser > 0
- `discount_pct` entre 0 e 50 (slider limitado)
- Se `cost_per_appointment > price`, alertar usuária (custo maior que preço)

---

## Integração com Outros Docs

- Cores de status → **DESIGN-SYSTEM.md** (seção "Badge")
- Schema dos dados → **BANCO-DADOS.md**
- Componente slider → **DESIGN-SYSTEM.md** (seção "Slider")
- Tela completa → **FLUXO-USUARIO.md** (seção "FASE 6: CALCULADORA")
