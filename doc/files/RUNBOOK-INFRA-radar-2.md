# Prompt para o Claude Code — Adicionar o Radar dentro do app.precya

> Copie tudo abaixo da linha e cole no Claude Code, na raiz do **repositório do app.precya**.

---

## MISSÃO

Você vai adicionar um novo produto — o **Radar** (calculadora de preços para clínicas de estética) — **dentro deste repositório existente** (`app.precya`), de forma **completamente isolada**:

- código do radar em **pastas próprias**, sem misturar com o app atual;
- dados do radar num **banco de dados NOVO e dedicado**, criado dentro do **Postgres que JÁ está rodando** (mesma instância, banco separado);
- **sem quebrar absolutamente nada** do app.precya, que está em produção.

O objetivo é poder, no futuro, extrair o radar para o próprio servidor com o mínimo de esforço. Por isso a separação interna é obrigatória desde o primeiro commit.

---

## ⛔ REGRAS INVIOLÁVEIS (GUARD-RAILS) — leia antes de tocar em qualquer coisa

Você **NUNCA** deve, em hipótese alguma, sem eu aprovar explicitamente o comando exato:

1. **Modificar, mover ou apagar qualquer arquivo existente** do app.precya. Se um passo parecer exigir editar um arquivo que já existe, **PARE e me pergunte**, mostrando o diff proposto.
2. **Tocar no `prisma/schema.prisma` atual** nem nas migrations existentes do app.precya. O radar terá o **seu próprio** schema e migrations, em pasta separada.
3. **Rodar qualquer comando destrutivo de banco**: nada de `DROP`, `TRUNCATE`, `prisma migrate reset`, `prisma db push --force-reset`, ou `--accept-data-loss`. Proibido.
4. **Apontar o Prisma do radar para o banco do app.precya.** O radar usa uma variável de ambiente **distinta** (`RADAR_DATABASE_URL`) que aponta para o **banco novo**, jamais para o banco atual.
5. **Executar qualquer SQL contra o Postgres por conta própria.** Você **monta** o SQL e me mostra; **eu** rodo ou aprovo a execução.
6. **Commitar segredos** (senhas, connection strings reais). Apenas `.env.example` com placeholders vai pro Git. O `.env` real fica fora do versionamento.
7. **Alterar configuração de infra**: Docker, Coolify, firewall, variáveis globais do servidor. Fora de escopo.
8. **Rodar migrations contra produção sem minha aprovação.** Sempre me mostre o que será aplicado primeiro.

> Se qualquer instrução minha colidir com estas regras, **as regras vencem** — pare e me avise.

---

## MODO DE TRABALHO

- Trabalhe **uma fase por vez**. Ao fim de cada fase, **pare, me mostre o resultado e espere meu "ok"** antes de seguir.
- Antes de **qualquer** escrita em banco ou edição de arquivo existente, mostre exatamente o que vai fazer e **peça aprovação**.
- Prefira sempre a abordagem **aditiva** (criar arquivos novos) à abordagem que edita o que já existe.

---

## FASE 0 — Reconhecimento (SOMENTE LEITURA, não altere nada)

1. Confirme que estamos no repositório certo: este é o **app.precya** (e **não** o repositório `radar-precya`). Se não for, pare e me avise.
2. Mapeie a estrutura atual sem modificar nada:
   - framework e versão (espera-se Next.js App Router);
   - como as rotas estão organizadas (existe `app/`? usa route groups?);
   - se já existe `prisma/schema.prisma` e como o cliente Prisma é instanciado;
   - se existe `middleware.ts` (importante para roteamento por subdomínio depois);
   - como variáveis de ambiente são lidas e onde o `.env.example` mora.
3. Me entregue um **resumo do que encontrou** + o **plano das próximas fases adaptado a essa estrutura real**. Espere meu ok.

---

## FASE 1 — Banco novo no Postgres existente (eu executo o SQL)

1. **Não rode SQL.** Apenas **monte** o script abaixo, ajustando nomes se eu pedir, e me entregue para eu executar como superusuário do Postgres:

   ```sql
   -- Cria um usuário dedicado e um banco SEPARADO para o radar,
   -- dentro da mesma instância Postgres já em execução.
   CREATE ROLE radar_user WITH LOGIN PASSWORD 'TROCAR_POR_SENHA_FORTE';
   CREATE DATABASE radar OWNER radar_user;

   -- Princípio de menor privilégio: radar_user não deve acessar o banco do app.precya.
   -- (rode conectado ao banco do app.precya, substituindo <db_app> pelo nome real)
   REVOKE CONNECT ON DATABASE <db_app> FROM radar_user;
   ```

2. Explique-me, em uma linha cada: por que um **banco** separado (e não um schema) e por que um **usuário** separado — para eu confirmar que entendi o isolamento.
3. A connection string do radar usará esse `radar_user` + banco `radar`, na **mesma host/porta** do Postgres atual. Ela vira a variável **`RADAR_DATABASE_URL`** (nunca `DATABASE_URL`).
4. Documente `RADAR_DATABASE_URL` no `.env.example` com placeholder. **Não** coloque a senha real em lugar nenhum versionado.

---

## FASE 2 — Estrutura de pastas isolada (aditivo)

Crie a casa do radar **sem encostar** no código existente:

1. Route group próprio para a UI e API do radar, por exemplo:

   ```
   app/
   └── (radar)/
       ├── radar/                 ← páginas do radar
       │   └── page.tsx           ← placeholder inicial ("Radar — em construção")
       └── api/
           └── radar/             ← route handlers do radar
   ```

   - O radar **não importa** nada de dentro do código do app.precya, e vice-versa.
2. **Roteamento por subdomínio (`radar.precya.com.br`): PARE e me pergunte.** Se exigir editar um `middleware.ts` existente, mostre o diff e espere aprovação. Por ora, sirva o radar em **`/radar`** (puramente aditivo, risco zero). O subdomínio a gente liga depois, no Coolify.

---

## FASE 3 — Prisma do radar, totalmente isolado

O radar tem o **próprio** Prisma, que nunca cruza com o do app.precya:

1. Crie um schema separado, ex.: `prisma/radar/schema.prisma`, com:
   - `datasource db { url = env("RADAR_DATABASE_URL") }`
   - um `generator` com **`output` customizado** (ex.: `../../src/generated/radar`) para o cliente do radar **não sobrescrever** o cliente do app.precya;
   - os modelos iniciais do radar (ex.: `User`, `Calculo`, `RegraProcedimento`) — só o esqueleto.
2. As migrations do radar ficam em `prisma/radar/migrations/` (próprias, separadas).
3. Gere o cliente e a primeira migration **apontando explicitamente** para esse schema:
   - `prisma generate --schema=prisma/radar/schema.prisma`
   - `prisma migrate dev --schema=prisma/radar/schema.prisma` → **me mostre o SQL da migration ANTES de aplicar** e espere ok.
4. Crie um módulo de cliente Prisma do radar (ex.: `src/lib/radar-db.ts`) que instancia **apenas** o cliente gerado do radar. O app.precya continua usando o cliente dele, intocado.

---

## FASE 4 — Verificação de não-regressão (prova de que nada quebrou)

Antes de declarar pronto:

1. Rode o build do projeto inteiro e confirme que **compila sem erros** (`next build` ou equivalente).
2. Confirme que as rotas e o Prisma **do app.precya continuam intactos** — nenhum arquivo dele foi alterado (`git status` deve mostrar **apenas arquivos novos**, fora as exceções que eu aprovei explicitamente).
3. Confirme que `/radar` responde (placeholder) e que o cliente Prisma do radar conecta no banco `radar`.
4. Me entregue um **diff resumido** (`git status` + lista de arquivos criados) para eu revisar antes de qualquer commit.

---

## CHECKPOINTS DE PARADA OBRIGATÓRIA (pare e pergunte)

- Antes de **executar qualquer SQL** ou migration.
- Antes de **editar qualquer arquivo que já existe** (mostre o diff).
- Se precisar mexer em `middleware.ts`, configs de build, ou `package.json` de forma que afete o app.precya.
- Se o `git status` mostrar **qualquer modificação** em arquivo do app.precya que eu não aprovei.
- Se algo na estrutura real divergir deste plano — **não improvise**, me pergunte.

---

## RESULTADO ESPERADO AO FINAL

- App.precya **100% intocado e funcionando** (apenas arquivos novos no diff).
- Radar vivendo em `app/(radar)/`, isolado, servido em `/radar`.
- Banco `radar` separado no mesmo Postgres, acessado por `radar_user` via `RADAR_DATABASE_URL`.
- Prisma do radar próprio (schema, migrations e cliente separados).
- Nada commitado com segredos; `.env.example` atualizado.
- Caminho de extração futura trivial: `pg_dump radar` + mover a pasta `(radar)/`.

Comece pela **FASE 0** e pare para eu revisar.
