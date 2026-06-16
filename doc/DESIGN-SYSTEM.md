# 🎨 DESIGN SYSTEM — RADAR PRECYA

## Visão Geral

Estilo: **SaaS premium, wellness-tech, feminino sofisticado**. Sem cara de ERP. Cards com bordas suaves, sombras leves, tipografia leve e conversacional.

---

## Cores

### Paleta Principal

```css
/* tailwind.config.ts */
colors: {
  brand: {
    900: '#2E1A73',  /* Roxo escuro — títulos, marca */
    700: '#5E3ECF',  /* Roxo principal — botões, CTAs */
    600: '#7C4DFF',  /* Roxo vibrante — hover, detalhes */
    300: '#B79CFF',  /* Roxo claro — badges, fundos */
    100: '#EDE9FF',  /* Roxo suave — backgrounds */
  },
  success: '#2BAE66',   /* Verde — margem saudável */
  warning: '#F5A623',   /* Laranja — margem em risco */
  danger:  '#E65A5A',   /* Vermelho — prejuízo */
  neutral: {
    900: '#1A1A2E',
    700: '#4A4A6A',
    400: '#9999BB',
    100: '#F5F5FA',
    50:  '#FAFAFE',
  }
}
```

### Uso das Cores

| Cor | Uso |
|-----|-----|
| `brand-900` | Títulos principais, logo |
| `brand-700` | Botões primários, links |
| `brand-600` | Hover de botões |
| `brand-300` | Badges, chips |
| `brand-100` | Background de cards destacados |
| `success` | Status "Margem saudável", valores positivos |
| `warning` | Status "Margem em risco" |
| `danger` | Status "Prejuízo", erros |

---

## Tipografia

```css
/* globals.css */
font-family: 'Plus Jakarta Sans', 'Poppins', sans-serif;
```

### Escala

| Token | Tamanho | Peso | Uso |
|-------|---------|------|-----|
| `text-3xl font-semibold` | 30px | 600 | Título de página |
| `text-2xl font-semibold` | 24px | 600 | Título de seção |
| `text-xl font-medium` | 20px | 500 | Subtítulo de card |
| `text-base font-normal` | 16px | 400 | Corpo, labels |
| `text-sm font-normal` | 14px | 400 | Microcopy, ajuda |
| `text-xs font-medium` | 12px | 500 | Badges, chips |

### Regras
- ✅ Usar `font-semibold` para headlines, nunca `font-bold` pesado
- ✅ Microcopy leve, conversacional — tom de consultora, não de sistema
- ❌ Nunca usar `font-black` ou `font-extrabold`

---

## Espaçamento

Baseado na escala do Tailwind (múltiplos de 4px).

| Token | Valor | Uso |
|-------|-------|-----|
| `p-4` | 16px | Padding interno de cards |
| `p-6` | 24px | Padding de seções |
| `gap-4` | 16px | Gap entre elementos relacionados |
| `gap-6` | 24px | Gap entre seções |
| `mb-2` | 8px | Label → input |
| `mb-4` | 16px | Campo → próximo campo |
| `mb-8` | 32px | Seção → seção |

---

## Componentes

### Button

```tsx
// Variantes
<Button variant="primary">Continuar</Button>
<Button variant="secondary">Voltar</Button>
<Button variant="ghost">Cancelar</Button>
<Button variant="danger">Excluir</Button>

// Tamanhos
<Button size="sm" />   // h-8, text-sm
<Button size="md" />   // h-10, text-base (default)
<Button size="lg" />   // h-12, text-lg

// Estilos base
className="rounded-xl font-semibold transition-all duration-200 
           active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"

// Primary
"bg-brand-700 text-white hover:bg-brand-600 shadow-sm shadow-brand-300"

// Secondary
"border border-brand-300 text-brand-700 hover:bg-brand-100"
```

### Card

```tsx
<Card>
  <CardHeader title="Título" subtitle="Subtítulo opcional" />
  <CardBody>...</CardBody>
  <CardFooter>...</CardFooter>
</Card>

// Estilos
"bg-white rounded-2xl shadow-sm border border-neutral-100 p-6"

// Card destacado
"bg-brand-100 rounded-2xl border border-brand-300 p-6"
```

### Input

```tsx
<Input
  label="Nome da Clínica"
  placeholder="Ex: Clínica Bella"
  helper="Como aparecerá para seus clientes"
  error="Campo obrigatório"
/>

// Estilos
label: "text-sm font-medium text-neutral-700 mb-2"
input: "w-full h-11 px-4 rounded-xl border border-neutral-200 
        text-base text-neutral-900 placeholder:text-neutral-400
        focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-700
        transition-all"
error: "border-danger focus:ring-danger/30"
helper: "text-xs text-neutral-400 mt-1"
error_msg: "text-xs text-danger mt-1"
```

### Badge (Status)

```tsx
<Badge variant="success">Margem Saudável</Badge>
<Badge variant="warning">Margem em Risco</Badge>
<Badge variant="danger">Prejuízo</Badge>
<Badge variant="default">Sem desconto</Badge>

// Estilos base
"inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"

// Variantes
success: "bg-success/10 text-success"
warning: "bg-warning/10 text-warning"
danger:  "bg-danger/10 text-danger"
default: "bg-brand-100 text-brand-700"
```

### CurrencyInput

```tsx
<CurrencyInput
  label="Preço do atendimento"
  value={price}
  onChange={setPrice}
  prefix="R$"
/>

// Formatação: R$ 1.200,00
// Aceita apenas números, formata automaticamente
```

### ProgressBar (Onboarding)

```tsx
<ProgressBar steps={4} current={2} />

// Visual: ● ● ○ ○ com linha conectando
// Cores: completed=brand-700, current=brand-700(pulsing), pending=neutral-200
```

### WhatsAppMessage

```tsx
<WhatsAppMessage text={generatedText} onCopy={handleCopy} />

// Card com fundo #ECE5DD (tom WhatsApp)
// Fonte monospace ou sans-serif leve
// Botão "Copiar mensagem" com ícone
// Feedback: "✓ Copiado!" por 2s após clicar
```

---

## Slider de Desconto

```tsx
<DiscountSlider
  value={discount}
  onChange={setDiscount}
  min={0}
  max={50}
  step={5}
/>

// Track: bg-neutral-200, filled: bg-brand-700
// Thumb: w-5 h-5, bg-white, border-2 border-brand-700, shadow
// Label flutuante acima do thumb: "15%"
```

---

## Animações

```css
/* Entrada de cards */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Resultado da calculadora */
.animate-result-in {
  animation: resultIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes resultIn {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}
```

---

## Responsividade

Mobile-first. Breakpoints:

| Breakpoint | Largura | Layout |
|-----------|---------|--------|
| (default) | < 640px | 1 coluna, padding 16px |
| `sm` | 640px+ | 1 coluna, padding 24px |
| `md` | 768px+ | Cards side-by-side |
| `lg` | 1024px+ | Layout 2/3 + 1/3 |

```tsx
// Exemplo: grid da calculadora
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">/* Inputs */</div>
  <div>/* Resultado */</div>
</div>
```

---

## Acessibilidade

- ✅ Contraste mínimo 4.5:1 em todos os textos
- ✅ Focus ring visível em todos os interativos
- ✅ Labels semânticos em todos os inputs
- ✅ ARIA labels em ícones sem texto
- ✅ `role="status"` no resultado da calculadora (live region)

---

## Dark Mode

Não implementado no MVP. Preparar com CSS variables, não hardcoded.

---

## Integração com Outros Docs

- Cores de status → **CALCULADORA.md** (seção "Status Badge")
- Componente WhatsApp → **CALCULADORA.md** (seção "Modo WhatsApp")
- Telas de onboarding → **FLUXO-USUARIO.md**
