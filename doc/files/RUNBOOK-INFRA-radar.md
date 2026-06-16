# RUNBOOK — Infra/VPS · radar.precya.com.br

Provisionamento do **3º projeto** (`radar.precya.com.br`) numa VPS Hetzner **já em produção**,
compartilhada com `app.precya.com.br`, orquestrada por **Coolify**.

> Escopo deste documento: **somente infraestrutura** (VPS, Coolify, DNS, Postgres, backup,
> limites, observabilidade). A aplicação (Next.js/Prisma/Auth.js) é um runbook separado.

---

## ⚠️ Contexto crítico — leia antes de tudo

A VPS já hospeda um app pagante (`app.precya.com.br`). O objetivo número 1 deste runbook é:

> **Adicionar o radar SEM nunca colocar o `app.precya` em risco.**

Toda decisão aqui prioriza isso sobre velocidade ou elegância.

---

## Legenda de execução (regra de delegação ao Claude Code)

Cada passo é etiquetado. **Respeite a etiqueta.**

| Etiqueta | Significado |
| --- | --- |
| 🟢 **[AGENTE-OK]** | Claude Code pode executar/gerar. Não muta o sistema da VPS nem toca no `app.precya`. |
| 🔵 **[SOMENTE-LEITURA]** | Claude Code pode rodar via SSH, mas é **read-only** (inspeção). Nada de escrita. |
| 🔴 **[HUMANO]** | Você executa. Geralmente UI do Coolify/Cloudflare ou ação com blast radius. O agente pode **documentar/descrever**, mas **não executar**. |

### 🚫 Lista de NUNCA (mesmo que pareça conveniente)

O Claude Code **NÃO** deve, em hipótese alguma, sem aprovação humana explícita por comando:

- Rodar `rescale` / resize da VPS (muda preço p/ tabela nova + reinicia → derruba o `app.precya`).
- Alterar firewall (`ufw`, iptables, ou Hetzner Cloud Firewall). Uma regra errada = lockout ou Postgres exposto.
- Mexer no daemon do Docker, em redes Docker, ou em **qualquer container do `app.precya`**.
- Tocar no Coolify em si (update, restart do serviço, alteração de config global).
- Instalar pacotes de sistema (`apt install ...`) no host.
- Apagar volumes, imagens ou dados (`docker volume rm`, `docker system prune`, `rm -rf`).
- Manusear segredos de produção em texto plano fora do cofre de env do Coolify.
- Fazer `git push --force` ou qualquer escrita destrutiva em repositório.

Se algum passo exigir uma dessas ações, o agente **para e te pergunta**.

---

## FASE 0 — Pré-voo (diagnóstico read-only)

**Objetivo:** decidir se cabe sem rescale.

🔵 **[SOMENTE-LEITURA]** — SSH na VPS e rodar:

```bash
free -h                      # RAM total / livre
df -h /                      # disco livre na raiz
docker stats --no-stream     # consumo atual por container
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

**Critério de decisão (go / no-go):**

| Recurso | Mínimo confortável p/ o radar | Ação se não bater |
| --- | --- | --- |
| RAM livre | **≥ 2 GB** | Não improvisar. Pausar e avaliar rescale (🔴 humano). |
| Disco livre | **≥ 15–20 GB** | Idem. Disco não encolhe depois de subir. |

> Se ficar apertado: **não comprimir na marra.** Rescale é decisão humana consciente
> (lembrar: rescale hoje move a máquina pra tabela de preço nova da Hetzner).

**Saída esperada desta fase:** um veredito escrito — "cabe" ou "precisa rescale" — colado de volta no chat.

---

## FASE 1 — DNS (Cloudflare)

🔴 **[HUMANO]** (o agente descreve; você clica)

1. No Cloudflare, na zona `precya.com.br`, criar **somente** o registro do radar:
   - Tipo **A** · Nome `radar` · Conteúdo **= mesmo IP da VPS** do `app.precya`.
   - (Se você usa IPv6: também um **AAAA** apontando pro mesmo IPv6.)
   - Proxy **laranja (ativado)** → ganha cache de borda (PoP São Paulo), oculta o IP de origem, SSL e DDoS.
2. **Não tocar** em nenhum outro registro existente. Mexer no `app` é fora de escopo e perigoso.
3. SSL mode no Cloudflare: **Full (Strict)** — combina com o Let's Encrypt que o Coolify emite na origem.

> Como é o mesmo servidor, **não há custo de IPv4 novo** na Hetzner.

---

## FASE 2 — Banco de dados (Postgres dedicado no Coolify)

🔴 **[HUMANO]** (UI do Coolify — o agente NÃO cria recursos no Coolify)

1. Criar um recurso **PostgreSQL novo e dedicado** ao radar (container próprio, separado do `app.precya`).
2. **Nunca** expor porta pública. O Postgres fica **só na rede interna do Docker**.
   - Confirme que não há `ports:` mapeando pra host. Acesso só via rede interna do projeto.
3. Anotar a connection string interna — ela vira `DATABASE_URL` do app (Fase 3).
4. Definir **limite de memória** no container do banco (ver Fase 4).

> Alternativa (só se a Fase 0 mostrar RAM apertada): reusar o Postgres existente criando
> um **database separado** pro radar. Menos isolamento, mas economiza RAM. Decisão humana.

---

## FASE 3 — Deploy da aplicação (Coolify, a partir do Git)

> Pré-requisito: o repositório do radar já scaffoldado (runbook da aplicação, separado).
> Esta fase é só o **wiring de infra** do deploy.

🟢 **[AGENTE-OK]** — gerar artefatos no repositório:
- `Dockerfile` (ou confirmar build pack) compatível com Coolify.
- `.env.example` documentando todas as variáveis (sem valores reais).
- Healthcheck endpoint documentado (ex.: `/api/health`).

🔴 **[HUMANO]** — no Coolify:
1. Novo recurso de aplicação → fonte: repositório Git do radar.
2. Domínio: `https://radar.precya.com.br` → Coolify emite Let's Encrypt automaticamente.
3. Variáveis de ambiente (cofre do Coolify, **nunca** no Git):
   - `DATABASE_URL` (Postgres da Fase 2)
   - segredos do Auth.js, Sentry DSN, PostHog key, chaves do provedor de pagamento (quando definido)
4. Build + primeiro deploy. Validar pelo healthcheck antes de divulgar a URL.

---

## FASE 4 — Guardrails na máquina compartilhada (proteger o `app.precya`)

🔴 **[HUMANO]** (UI do Coolify) — **não pular esta fase.**

O risco numa VPS compartilhada é um projeto sufocar o outro. Mitigação:

1. **Limite de memória por container** do radar:
   - App Next.js: começar com **limite de 1 GB**.
   - Postgres do radar: **limite de 1 GB** (ajustar conforme dados crescem).
2. Assim, se o radar vazar memória ou tomar pico de tráfego, ele é contido — **não derruba o `app.precya`**.
3. (Opcional) Limite de CPU se a Fase 0 mostrou folga curta de núcleos.

---

## FASE 5 — Backup do Postgres (desde o dia 1, mesmo com zero vendas)

🔴 **[HUMANO]** (UI do Coolify)

1. Agendar **backup automático** do Postgres do radar.
2. Destino: storage **S3-compatível** (Cloudflare R2, Backblaze B2, ou bucket equivalente).
   - 🚫 Backup no mesmo disco da VPS **não conta como backup** (se o disco morre, morre junto).
3. Definir retenção (ex.: 7 diários + 4 semanais).
4. 🔵 **[SOMENTE-LEITURA]** Testar **restore** num ambiente isolado depois — backup não testado é esperança, não backup.

---

## FASE 6 — Observabilidade (SaaS no começo)

🟢 **[AGENTE-OK]** — wiring no código (já coberto no runbook da app):
- **Sentry**: usar free tier **SaaS** (não self-host agora — um serviço a menos pra patchar).
- **PostHog**: idem, free tier SaaS.

🔴 **[HUMANO]**: criar os projetos no Sentry/PostHog e colar DSN/keys no cofre de env do Coolify.

---

## Checklist de segurança (rodar ao final)

- [ ] `app.precya.com.br` continua **no ar e respondendo** (testar antes e depois de cada fase).
- [ ] Postgres do radar **sem porta pública** (`docker ps` não mostra mapeamento pra host).
- [ ] Limites de memória aplicados no app e no banco do radar.
- [ ] Backup do Postgres agendado **e** apontando pra storage externo.
- [ ] Nenhum segredo commitado no Git (`.env` no `.gitignore`; só `.env.example` versionado).
- [ ] SSL válido em `https://radar.precya.com.br`.
- [ ] Nenhuma regra de firewall foi alterada sem aprovação consciente.

---

## Plano de rollback

O radar é **aditivo** — não altera o `app.precya`. Rollback é simples:

1. No Coolify, **parar/remover** o app do radar e o Postgres do radar.
2. Remover o registro DNS `radar` no Cloudflare.
3. O `app.precya` permanece intocado em qualquer cenário (foi esse o objetivo do desenho).

> Por isso a ordem importa: tudo que o radar adiciona é descartável sem tocar no que já vende.

---

## Como trabalhar com o Claude Code a partir daqui

1. Você dá a ele **este runbook** + acesso ao repositório.
2. Ele executa só o que é 🟢 e 🔵; nas 🔴, ele **te entrega o passo-a-passo** e espera você confirmar.
3. Em qualquer passo que toque a lista 🚫, ele **para e pergunta**.
4. Comandos de mutação no host: **um de cada vez, com sua aprovação** — nunca em lote.

> Observação honesta sobre a UI do Coolify: muita coisa aqui é clique, não shell.
> Confirme nomes de menu contra a versão do seu Coolify, pois a interface muda entre releases.
