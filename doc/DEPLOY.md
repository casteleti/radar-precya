# 🚀 DEPLOY — RADAR PRECYA

## Stack de Deploy

| Componente | Tecnologia |
|-----------|-----------|
| Servidor | Hetzner Cloud (CX21, 2 vCPU, 4GB RAM) |
| Orquestração | Coolify (self-hosted PaaS) |
| Container | Docker |
| Proxy reverso | Traefik (via Coolify) |
| SSL | Let's Encrypt automático |
| Banco | PostgreSQL 15 (container) |
| E-mail | Resend |

---

## Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Instalar dependências
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

---

## docker-compose.yml (desenvolvimento local)

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://radar:radar@db:5432/radar_precya
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      RESEND_API_KEY: ${RESEND_API_KEY}
      WEBHOOK_SECRET_KIWIFY: ${WEBHOOK_SECRET_KIWIFY}
      WEBHOOK_SECRET_HOTMART: ${WEBHOOK_SECRET_HOTMART}
      NEXT_PUBLIC_APP_URL: http://localhost:3000
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: radar
      POSTGRES_PASSWORD: radar
      POSTGRES_DB: radar_precya
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U radar"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

---

## Variáveis de Ambiente (Produção)

```env
# Banco
DATABASE_URL=postgresql://radar:<senha>@localhost:5432/radar_precya

# Auth
NEXTAUTH_SECRET=<string-aleatoria-64-chars>

# E-mail
RESEND_API_KEY=re_xxxxx

# Webhooks
WEBHOOK_SECRET_KIWIFY=<secret-kiwify>
WEBHOOK_SECRET_HOTMART=<token-hotmart>
WEBHOOK_SECRET_MERCADOPAGO=<secret-mp>
WEBHOOK_SECRET_ASAAS=<token-asaas>

# App
NEXT_PUBLIC_APP_URL=https://radar.precya.com.br
```

---

## Configuração do Coolify

### 1. Criar projeto no Coolify

- Tipo: Docker Compose ou Dockerfile
- Source: repositório Git (GitHub/GitLab)
- Branch: `main`

### 2. Configurar domínio

```
radar.precya.com.br → porta 3000
```

SSL automático via Let's Encrypt.

### 3. Configurar variáveis de ambiente

Adicionar todas as variáveis listadas acima no painel do Coolify.

### 4. Configurar banco de dados

Criar serviço PostgreSQL no Coolify ou usar instância externa.

---

## Pipeline de Deploy

```
git push origin main
       ↓
Coolify detecta push (webhook GitHub)
       ↓
docker build (usando Dockerfile)
       ↓
npx prisma migrate deploy
       ↓
Substituição do container (zero downtime)
       ↓
Health check: GET /api/health → 200
       ↓
✅ Deploy concluído
```

---

## Health Check

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return Response.json({ status: 'ok', db: 'connected' })
  } catch {
    return Response.json({ status: 'error', db: 'disconnected' }, { status: 503 })
  }
}
```

---

## Migrations em Produção

```bash
# Executar migrations antes de subir o container
# (Coolify: configurar como "Deploy command")
npx prisma migrate deploy
```

**Nunca** usar `prisma migrate dev` em produção — só `prisma migrate deploy`.

---

## next.config.ts (produção)

```typescript
// next.config.ts
const nextConfig = {
  output: 'standalone',  // necessário para Docker
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
        ]
      }
    ]
  }
}

export default nextConfig
```

---

## Rollback

```bash
# Via Coolify: UI → Deployments → selecionar deploy anterior → Redeploy
# Ou via CLI:
coolify redeploy --deployment=<id>
```

---

## Monitoramento

- Logs: Coolify → Logs do container
- Uptime: configurar UptimeRobot ou BetterUptime apontando para `/api/health`
- Banco: pg_activity ou Coolify dashboard

---

## Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] PostgreSQL rodando e acessível
- [ ] `prisma migrate deploy` executado
- [ ] Health check respondendo 200
- [ ] SSL ativo (`https://`)
- [ ] Webhook URLs atualizadas nas plataformas de pagamento
- [ ] Enviar magic link de teste e verificar e-mail
- [ ] Testar fluxo completo: compra → login → onboarding → calculadora
