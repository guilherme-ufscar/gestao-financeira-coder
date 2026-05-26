# CLAUDE.md — Cofrin (Gestão Financeira)

> Arquivo de instruções permanentes para o Claude Code neste projeto.
> Leia este arquivo inteiro no início de cada sessão e siga-o à risca. Ele tem prioridade sobre suposições próprias.
> A especificação funcional completa do produto está em `escopo.md` (raiz). Este `CLAUDE.md` cuida do COMO trabalhar; o `escopo.md` cuida do O QUE construir.

---

## 1. Visão do projeto

**Cofrin** é um app **mobile-first** de gestão financeira **pessoal e familiar**, em React, inspirado nos apps brasileiros Despezzas e budgi. Nome = brincadeira com "cofre" + finanças. Roda inteiramente em um servidor próprio via Docker Compose, e também é empacotado como APK Android via Capacitor. Funciona como web/PWA e como app nativo a partir do mesmo código.

A fonte da verdade do produto (funcionalidades, design system, entidades, requisitos) é o **`escopo.md`**. Sempre consulte-o. Se algo aqui e no escopo parecerem conflitar, o escopo manda no "o quê" e este arquivo manda no "como/processo".

---

## 2. REGRAS CRÍTICAS (NÃO VIOLAR)

Estas regras são absolutas. Quebrá-las atrapalha diretamente o meu fluxo de trabalho.

1. **NÃO rode `npm run build` (nem `yarn build`, `pnpm build`, `next build`, `vite build`, etc.) localmente/na sua sessão.** Não execute builds de produção do frontend. Eu mesmo farei os builds depois, na minha VPS, para não gastar tempo da sua execução. Você pode (e deve) **escrever** os scripts de build, Dockerfiles e configs — só **não executá-los**.

2. **NÃO rode `docker compose up`, `docker compose build`, `docker build`, nem qualquer comando que construa ou suba containers.** Escreva todos os `Dockerfile`, o `docker-compose.yml` e os arquivos de configuração corretamente, mas **não os execute**. O build e o `up` serão feitos por mim na VPS.

3. É permitido e esperado rodar comandos leves de desenvolvimento que ajudem a validar o código sem build pesado: instalar dependências (`npm install`), checagem de tipos (`tsc --noEmit`), lint (`eslint`), testes unitários rápidos, geração de client do ORM (ex: `prisma generate`), e migrations em modo de geração de arquivo (sem precisar de banco no ar). Evite qualquer processo demorado ou que exija a stack inteira no ar.

4. **Não exponha segredos.** Chaves (Resend, Turnstile secret, JWT, DB, VAPID) vão apenas em `.env` (no `.gitignore`). Mantenha um `.env.example` documentado sem valores reais. Nunca faça commit de `.env` nem cole chave real em código.

5. **Push obrigatório a cada etapa concluída** do roadmap (ver §6). Sem exceção.

6. **Regra de UI inegociável:** o design de todas as telas é gerado no **Google Stitch (via MCP)** ANTES de escrever qualquer código de frontend daquela tela.

7. **Sem emojis** em nenhum lugar do produto (UI, copy, ícones). Usar ícones vetoriais e logos/imagens.

---

## 3. Repositório e versionamento

- Repositório **já existe**: `https://github.com/guilherme-ufscar/gestao-financeira-coder`. **NÃO crie um repositório novo** — use este.
- Configure o remote para este repositório e faça push nele.
- Fluxo de commits:
  - Commits pequenos e descritivos, em português, no padrão convencional quando fizer sentido (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
  - **Ao concluir cada fase/etapa do roadmap, faça commit e `git push`.** Sem exceção.
  - Trabalhe na branch `main` (ou crie branches por fase e faça merge em `main` ao concluir — sua escolha, desde que o push aconteça).
- Garanta um `.gitignore` correto desde o primeiro commit: `node_modules`, `.env`, builds (`dist`, `.next`, `build`), artefatos do Capacitor/Android (`android/app/build`, `*.apk` se forem grandes — avalie), uploads locais, etc.

---

## 4. Stack e decisões técnicas

Você define e justifica a stack final no início, registrando a decisão neste arquivo (atualize a seção abaixo). Diretrizes/recomendações:

- **Frontend:** React, mobile-first, PWA-ready. Sugerido: Vite + React + TypeScript, ou Next.js se justificar SSR. TypeScript obrigatório.
- **Estilização:** sistema de design tokens (CSS variables) com tema **dark (padrão)** e **white**, troca por `prefers-color-scheme` + manual. Glassmorphism conforme escopo. Tailwind é aceitável desde que os tokens de tema fiquem centralizados.
- **Backend/API:** Node + TypeScript. Sugerido NestJS ou Fastify/Express bem estruturado (ou Next API routes se usar Next). Justifique.
- **Banco:** **PostgreSQL** (em container). ORM sugerido: **Prisma**.
- **Auth:** sessão segura (JWT httpOnly ou sessão server-side), refresh token, recuperação de senha por e-mail, **Cloudflare Turnstile** no cadastro.
- **E-mail:** **Resend** (confirmação, recuperação, convites de círculo familiar, alertas).
- **Notificações:** Web Push (Service Worker + VAPID) na web; notificações nativas via Capacitor no app. Abstrair o canal.
- **Mobile:** **Capacitor** para gerar o `.apk` (apontando para a API no servidor).
- **Workers/jobs:** para cálculo de rendimento das contas e disparo de notificações/cobranças recorrentes (cron/fila). Pode ser um serviço separado no compose.
- **Dinheiro:** sempre em **centavos (inteiro)**. Localização **pt-BR**, moeda **BRL**, datas BR.

> **DECISÕES TOMADAS (preencher/atualizar conforme avança):**
> - Framework frontend: Vite + React 18 + TypeScript (rápido, PWA-ready via vite-plugin-pwa, sem necessidade de SSR)
> - Backend: Fastify 5 + TypeScript (leve, performático, boa tipagem, plugins oficiais para cors/cookie/multipart/rate-limit)
> - ORM: Prisma 6 (excelente DX com TypeScript, migrations, suporte PostgreSQL completo)
> - Estilização: Tailwind CSS 3 + CSS variables (design tokens centralizados para dark/light)
> - State management: Zustand (leve, sem boilerplate, persist middleware para auth)
> - Formulários: react-hook-form + zod (validação tipada)
> - Gráficos: Recharts
> - Animações: Framer Motion
> - Ícones: Lucide React
> - Worker: node-cron (jobs de rendimento, recorrências, notificações)
> - Estrutura de pastas: monorepo com workspaces npm (web/, server/, worker/)

---

## 5. Infraestrutura, Docker e rede (ESCREVER, NÃO EXECUTAR)

- Tudo containerizado via `docker-compose.yml`: frontend, API, **PostgreSQL** (volume persistente), worker(s), e reverse proxy (Nginx ou Traefik) terminando TLS.
- **Domínio:** `gestaofinanceira.codermaster.com.br` (IP `66.94.105.155`), HTTPS.
- **Rede — requisito rígido:** todas as portas dos serviços são **internas** à rede do compose (banco, API, workers comunicam-se só pela rede interna, sem `ports:` expostos ao host). **A única porta pública é a `10206`**, exposta pelo ponto de entrada (reverse proxy / frontend que atende o domínio). Tudo o que não precisa ser acessível de fora permanece fechado.
- **Persistência:** todos os dados em volumes Docker no servidor. **Uploads** (avatar, comprovantes, etc.) salvos no próprio servidor em volume Docker persistente — nunca em serviço externo.
- Escreva Dockerfiles de produção (multi-stage), o compose, configs do proxy e variáveis de ambiente. **Não construa nem suba nada** — eu faço o build/`up` na VPS.
- Documente no `README` os passos exatos que EU vou rodar na VPS (clonar, preencher `.env`, `docker compose build`, `docker compose up -d`, gerar o APK), já que você não executará essas etapas.

---

## 6. Roadmap (executar em ordem; push ao fim de cada fase)

Faça o planejamento detalhado de cada fase antes de implementá-la. Ordem sugerida:

0. **Setup:** estrutura do monorepo/projeto, TypeScript, lint, design tokens (dark/white), tema base, `.gitignore`, `.env.example`, Dockerfiles + `docker-compose.yml` (escritos), `README`. → push.
1. **Auth & base:** cadastro/login, Turnstile, Resend (e-mails), sessão/refresh, recuperação de senha, layout base mobile-first (bottom-tab), aplicação da identidade (logo.svg / favicon.svg / nome Cofrin). → push.
2. **Contas/Carteiras:** CRUD de contas com logo de banco, saldo independente, transferências, rendimento automático configurável (com worker). → push.
3. **Transações & Categorias:** receitas/despesas, categorias com ícones, recorrências flexíveis, lançamento rápido, status pago/pendente, edição em massa de recorrentes. → push.
4. **Cartões & Parcelas:** cartões com bandeira detectada, card visual em tempo real no cadastro, limite usado/disponível, compras parceladas, faturas mensais, pagamento debitando conta. → push.
5. **Calendário & Saldo projetado:** calendário financeiro mensal; saldo projetado abaixo do saldo total. → push.
6. **Assinaturas:** área dedicada, logos, ciclos, total mensal/anual, cobranças automáticas no calendário/projeção. → push.
7. **Investimentos:** módulo separado (CDB, ações, FIIs, Tesouro, cripto…), patrimônio investido consolidado vs. saldo em conta. → push.
8. **Orçamento, Metas, Dívidas, Relatórios:** budget por categoria, metas, dívidas, gráficos/relatórios e dashboard customizável. → push.
9. **Gestão Familiar:** círculos, convites por e-mail, consolidação dos membros, permissões/privacidade, alternância individual ↔ família. → push.
10. **Notificações:** Web Push + Capacitor, eventos (vencimentos, parcelas, orçamento, assinaturas, atividade do círculo). → push.
11. **Capacitor/APK:** configurar Capacitor, nome **Cofrin**, ícones da pasta `android-icone`, splash a partir da logo, escrever os scripts/instruções de geração do `.apk` (eu gero o APK na VPS, mas deixe tudo configurado e os comandos documentados). → push.

> Cada fase: planejar → (Stitch para telas) → implementar → checagens leves (tsc/lint/teste) → commit → **push**.

---

## 7. Assets já presentes no projeto

- `logo.svg` (raiz) — logo branca, para identidade visual (login, onboarding, cabeçalho, splash). Adaptar cor no tema claro.
- `favicon.svg` (raiz) — favicon da web/PWA.
- `android-icone/` (pasta) — **ícones do app Android prontos**; usar no APK nas densidades/mipmaps corretas. Não gerar novos.
- `escopo.md` (raiz) — especificação funcional completa.

---

## 8. Estilo de trabalho

- Trabalhe de forma **autônoma e contínua**: não pare para pedir confirmação a cada passo. Siga o roadmap até o fim.
- Mantenha a seção "DECISÕES TOMADAS" (§4) e o roadmap (§6) atualizados conforme avança, marcando o que já foi concluído — assim você não se perde entre sessões longas.
- Código limpo, tipado, organizado por domínio. Comentários só onde agregam.
- Copy do produto em **pt-BR**.
- Antes de finalizar, revise o `README` com instruções claras do que EU farei na VPS (build, up, APK), já que você não executa build/compose.