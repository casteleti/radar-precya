# ⚛️ COMPONENTES — RADAR PRECYA

## Estrutura de Pastas

```
components/
├── ui/                      # Átomos reutilizáveis
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── CurrencyInput.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── ProgressBar.tsx
│   ├── Slider.tsx
│   └── LoadingSpinner.tsx
├── layout/                  # Layout compartilhado
│   ├── AppHeader.tsx
│   └── PageWrapper.tsx
├── auth/                    # Autenticação
│   ├── LoginForm.tsx
│   └── MagicLinkVerifier.tsx
├── onboarding/              # Fluxo de onboarding
│   ├── OnboardingLayout.tsx
│   ├── Step1ClinicName.tsx
│   ├── Step2MonthlyCosts.tsx
│   ├── Step3Procedures.tsx
│   ├── Step4Confirmation.tsx
│   └── ProcedureForm.tsx
└── calculadora/             # Calculadora principal
    ├── CalculadoraClient.tsx
    ├── ProcedureSelector.tsx
    ├── CostSummary.tsx
    ├── DiscountSlider.tsx
    ├── SimulationResult.tsx
    ├── MarginBadge.tsx
    └── WhatsAppMessage.tsx
```

---

## Componentes UI (Átomos)

### Button

```tsx
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-brand-700 text-white hover:bg-brand-600 shadow-sm',
    secondary: 'border border-brand-300 text-brand-700 hover:bg-brand-100',
    ghost: 'text-neutral-700 hover:bg-neutral-100',
    danger: 'bg-danger text-white hover:bg-danger/90'
  }

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-6 text-lg'
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner className="mr-2 h-4 w-4" />}
      {children}
    </button>
  )
}
```

### Input

```tsx
// components/ui/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helper?: string
  error?: string
}

export function Input({ label, helper, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-neutral-700">{label}</label>
      )}
      <input
        className={cn(
          'h-11 w-full rounded-xl border border-neutral-200 px-4 text-base text-neutral-900',
          'placeholder:text-neutral-400',
          'focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-700',
          'transition-all',
          error && 'border-danger focus:ring-danger/30',
          className
        )}
        {...props}
      />
      {helper && !error && (
        <span className="text-xs text-neutral-400">{helper}</span>
      )}
      {error && (
        <span className="text-xs text-danger">{error}</span>
      )}
    </div>
  )
}
```

### CurrencyInput

```tsx
// components/ui/CurrencyInput.tsx
interface CurrencyInputProps {
  label?: string
  value: number
  onChange: (value: number) => void
  helper?: string
  error?: string
}

export function CurrencyInput({ label, value, onChange, helper, error }: CurrencyInputProps) {
  const [display, setDisplay] = useState(formatCurrency(value))

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '')
    const numeric = Number(raw) / 100
    setDisplay(formatCurrency(numeric))
    onChange(numeric)
  }

  return (
    <Input
      label={label}
      value={display}
      onChange={handleChange}
      helper={helper}
      error={error}
      inputMode="numeric"
    />
  )
}
```

### Badge

```tsx
// components/ui/Badge.tsx
interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'default'
  children: React.ReactNode
}

export function Badge({ variant, children }: BadgeProps) {
  const variants = {
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    default: 'bg-brand-100 text-brand-700'
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
      variants[variant]
    )}>
      {children}
    </span>
  )
}
```

### ProgressBar

```tsx
// components/ui/ProgressBar.tsx
interface ProgressBarProps {
  steps: number
  current: number // 1-indexed
}

export function ProgressBar({ steps, current }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: steps }, (_, i) => i + 1).map((step, index) => (
        <React.Fragment key={step}>
          <div className={cn(
            'h-3 w-3 rounded-full transition-colors',
            step < current && 'bg-brand-700',
            step === current && 'bg-brand-700 ring-2 ring-brand-300',
            step > current && 'bg-neutral-200'
          )} />
          {index < steps - 1 && (
            <div className={cn(
              'h-0.5 flex-1 transition-colors',
              step < current ? 'bg-brand-700' : 'bg-neutral-200'
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
```

---

## Componentes de Onboarding

### OnboardingLayout

```tsx
// components/onboarding/OnboardingLayout.tsx
interface OnboardingLayoutProps {
  step: number
  totalSteps: number
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function OnboardingLayout({
  step, totalSteps, title, subtitle, children
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-brand-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-4">
          <Logo />
          <ProgressBar steps={totalSteps} current={step} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
          <h1 className="text-2xl font-semibold text-brand-900 mb-1">{title}</h1>
          {subtitle && (
            <p className="text-sm text-neutral-400 mb-6">{subtitle}</p>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
```

### ProcedureForm

```tsx
// components/onboarding/ProcedureForm.tsx
interface ProcedureFormProps {
  procedure?: Partial<ProcedureInput>
  onSave: (procedure: ProcedureInput) => void
  onCancel: () => void
}

export function ProcedureForm({ procedure, onSave, onCancel }: ProcedureFormProps) {
  const [name, setName] = useState(procedure?.name ?? '')
  const [price, setPrice] = useState(procedure?.price ?? 0)
  const [productCost, setProductCost] = useState(procedure?.product_cost ?? 0)
  const [commissionPct, setCommissionPct] = useState(procedure?.commission_pct ?? 0)

  // ... render form
}
```

---

## Componentes da Calculadora

### CalculadoraClient

```tsx
// components/calculadora/CalculadoraClient.tsx
'use client'

interface CalculadoraClientProps {
  costProfile: ClinicCostProfile
  procedures: Procedure[]
  clinicName: string
}

export function CalculadoraClient({
  costProfile, procedures, clinicName
}: CalculadoraClientProps) {
  const {
    selectedProcedureId, setSelectedProcedureId,
    discountPct, setDiscountPct,
    result, whatsappMessage
  } = useCalculadora(costProfile, procedures)

  const [showWhatsApp, setShowWhatsApp] = useState(false)

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader clinicName={clinicName} />
      <main className="max-w-3xl mx-auto p-4 pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <ProcedureSelector
            procedures={procedures}
            value={selectedProcedureId}
            onChange={setSelectedProcedureId}
          />
          {result && (
            <>
              <CostSummary result={result} />
              <DiscountSlider value={discountPct} onChange={setDiscountPct} />
            </>
          )}
        </div>
        <div>
          {result && (
            <SimulationResult
              result={result}
              discountPct={discountPct}
              onShowWhatsApp={() => setShowWhatsApp(true)}
            />
          )}
        </div>
      </main>
      {showWhatsApp && (
        <WhatsAppMessage
          text={whatsappMessage}
          onClose={() => setShowWhatsApp(false)}
        />
      )}
    </div>
  )
}
```

### MarginBadge

```tsx
// components/calculadora/MarginBadge.tsx
export function MarginBadge({ status }: { status: MarginStatus }) {
  const map = {
    healthy: { label: '✅ Margem Saudável', variant: 'success' as const },
    risk:    { label: '⚠️ Margem em Risco', variant: 'warning' as const },
    loss:    { label: '❌ Prejuízo',         variant: 'danger' as const }
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}
```

### WhatsAppMessage

```tsx
// components/calculadora/WhatsAppMessage.tsx
interface WhatsAppMessageProps {
  text: string
  onClose: () => void
}

export function WhatsAppMessage({ text, onClose }: WhatsAppMessageProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">📱 Mensagem WhatsApp</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">✕</button>
        </div>
        <div className="bg-[#ECE5DD] rounded-xl p-4 mb-4 text-sm text-neutral-800 whitespace-pre-wrap">
          {text}
        </div>
        <Button onClick={handleCopy} className="w-full">
          {copied ? '✓ Copiado!' : '📋 Copiar mensagem'}
        </Button>
      </div>
    </div>
  )
}
```

---

## Convenções

- Server Components por padrão — `'use client'` apenas quando necessário
- Props tipadas com `interface`, não `type`
- Sem `default export` em componentes de UI (usar named exports)
- `cn()` para condicionar classes (instalar `clsx` + `tailwind-merge`)
- Animações via classes Tailwind ou CSS keyframes (sem Framer Motion no MVP)

---

## Integração com Outros Docs

- Estilos detalhados → **DESIGN-SYSTEM.md**
- Lógica da calculadora → **CALCULADORA.md** (hook `useCalculadora`)
- Telas completas → **FLUXO-USUARIO.md**
