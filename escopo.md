# Escopo — App de Gestão Financeira Pessoal e Familiar

> Documento de escopo completo. Serve como base para o Claude Code planejar arquitetura, modelagem de dados, design e roadmap de implementação.
> **Você (Claude Code) deve produzir o planejamento técnico, o `CLAUDE.md` e o roadmap em fases a partir deste escopo.**
> **Regra de UI inegociável:** gerar o design das telas no Google Stitch (MCP) ANTES de escrever qualquer código de frontend.
> **Regra de versionamento:** após cada etapa concluída, push para o GitHub.

---

## 0. Resumo executivo

Aplicativo **mobile-first** de controle financeiro pessoal e **familiar**, inspirado nos apps brasileiros **Despezzas** e **budgi**. O usuário separa valores por conta bancária, gerencia cartões de crédito com parcelamento, acompanha assinaturas, investimentos, orçamento e metas, e visualiza tudo num calendário financeiro. Há uma camada **individual** e uma camada de **gestão familiar** (círculo/grupo) que consolida as finanças de vários membros.

Roda inteiramente num servidor próprio com **Docker Compose**. Frontend React, empacotado também como **APK via Capacitor**. Sem Open Finance no primeiro momento — todo lançamento é manual (com a melhor UX possível para que isso não seja um atrito).

---

## 1. Infraestrutura e deploy

- **Servidor:** VPS dedicada, IP `66.94.105.155`.
- **Domínio:** `gestaofinanceira.codermaster.com.br` (HTTPS obrigatório, certificado válido — Let's Encrypt).
- **Orquestração:** Docker Compose. Todos os serviços (frontend, backend/API, banco de dados, eventuais workers/filas, reverse proxy) sobem via compose. **Todos os dados persistem no servidor** (volumes Docker).
- **Reverse proxy:** Nginx ou Traefik na frente, terminando TLS e roteando para os containers.
- **Backend:** decidir a stack (sugestão: Node/NestJS ou Next.js API routes, com Postgres + Prisma). Justificar a escolha pensando em multi-usuário, gestão familiar e futura escala.
- **Banco:** PostgreSQL (recomendado pela natureza relacional forte: contas, transações, parcelas, faturas, círculos familiares).
- **Empacotamento mobile:** **Capacitor** para gerar `.apk` Android a partir do mesmo código React. A app aponta para a API no servidor. Arquitetura deve funcionar tanto como PWA/web quanto como app nativo.

### Autenticação e acesso
- Ao acessar: tela de **criar conta** ou **login**.
- Criação de conta protegida por **CAPTCHA Cloudflare Turnstile**:
  - Site key: `0x4AAAAAADWxcIYnIuEowhAf`
  - Secret key: `0x4AAAAAADWxcOjMdPvfdcmGo2Mxsm8QvT0` (somente no backend, nunca exposta no client)
- Sessão segura (JWT httpOnly ou sessão server-side). Refresh token. Logout.
- Recuperação de senha por e-mail.

### E-mail transacional
- **Resend API** para todos os e-mails (confirmação de conta, recuperação de senha, convites de círculo familiar, alertas opcionais).
- API key: `re_AuKMfUxc_78MjTCK3Ned4VBhYXwJ1vmCB` (somente no backend).
- **Nunca** versionar as chaves em texto plano: usar variáveis de ambiente / `.env` fora do versionamento, com `.env.example` documentado.

### Notificações
- **Web (PWA/navegador):** Web Push API (Service Worker + VAPID) para notificações no navegador.
- **App (Capacitor):** notificações nativas do dispositivo (Capacitor Push Notifications / Local Notifications).
- O sistema deve abstrair o canal: a mesma "intenção de notificar" dispara push web ou nativo conforme a plataforma.
- Eventos que geram notificação: vencimento de conta/fatura próximo, parcela a vencer, orçamento estourando, cobrança de assinatura próxima, convite/atividade no círculo familiar.

---

## 2. Identidade visual e Design System (DETALHAMENTO EXTREMO)

> O design é prioridade máxima. Tem que ser **impecável, moderno e agradável**. As referências enviadas (glassmorphism, fundo escuro profundo azul/roxo, cartões de vidro, tipografia limpa, dados em destaque) definem a direção. **Sem emojis** em lugar nenhum — usar **ícones** (biblioteca de ícones vetoriais) e **imagens/logos** (logos de banco, bandeiras de cartão, logos de assinaturas).

### 2.1 Direção de arte
- **Estilo principal: DARK.** Fundo escuro profundo, tom azul-noite / roxo-escuro como base. É o foco do projeto.
- **Estilo claro (WHITE) disponível**, com **detecção automática pelo dispositivo** (`prefers-color-scheme`) e opção manual de troca nas configurações (Auto / Escuro / Claro).
- **Glassmorphism** como assinatura visual: superfícies de vidro fosco (blur + transparência + borda sutil luminosa) para cards de saldo, cartões de crédito e modais — exatamente como nas referências.
- Profundidade por **camadas**: fundo → gradiente sutil → cards de vidro → conteúdo. Sombras suaves e brilhos (glow) discretos nas bordas dos elementos principais.
- Cantos bem arredondados (cards grandes ~20-28px de raio). Respiro generoso (padding amplo).
- Microinterações e transições suaves em tudo (entrada de telas, toques, expansão de cards, troca de mês no calendário).

### 2.2 Paleta de cores (referência — refinar na implementação)

**Tema Dark:**
- Fundo base: `#0B0E1A` a `#111527` (azul-noite muito escuro), com gradiente sutil para um roxo escuro `#1A1230` em pontos focais.
- Superfície de vidro: branco a 6-10% de opacidade + `backdrop-blur`, borda `rgba(255,255,255,0.12)`.
- Primária (roxo/azul de marca): faixa `#6D5FFD` (roxo-azulado) → `#4F7DFF` (azul). Usar em gradiente nos CTAs e destaques.
- Secundária/accent: ciano suave `#3DD9D6` ou violeta `#A78BFA` para detalhes.
- Sucesso (receitas): verde `#2FD180`. Perigo (despesas/alertas): vermelho/coral `#FF5C7A`. Aviso: âmbar `#FFB454`.
- Texto: branco `#F4F6FF` (primário), cinza-azulado `#9AA3C4` (secundário), `#5C6488` (terciário/labels).

**Tema White:**
- Fundo: `#F5F6FB` / branco. Superfícies: branco puro com sombra suave em vez de vidro translúcido escuro (ou vidro claro). Mesma família de primária/accent, ajustando contraste.
- Manter a mesma linguagem (cantos, espaçamento, gradientes de marca) — só invertendo a base de luminosidade.

> Definir todas as cores como **design tokens** (CSS variables / tema), com um único ponto de troca dark/white. Nada de cor hardcoded espalhada pelo código.

### 2.3 Tipografia
- Fonte sem serifa moderna e geométrica (sugestão: **Inter**, **Plus Jakarta Sans** ou **Satoshi**). Uma família só, com pesos variados.
- Valores monetários com bom destaque (peso semibold/bold, tamanho maior), labels em peso leve e cor secundária.
- Hierarquia clara: número grande do saldo → label pequeno acima → infos auxiliares menores.

### 2.4 Ícones e imagens (sem emoji)
- **Biblioteca de ícones** vetorial consistente (ex: Lucide / Phosphor) para navegação, ações, categorias.
- **Logos de banco:** no cadastro de conta, exibir/escolher o logo do banco (Nubank, Itaú, Bradesco, Mercado Pago, etc.). Manter um conjunto de logos/ícones de instituições; permitir cor/ícone custom quando não houver logo.
- **Bandeiras de cartão:** Visa, Mastercard, Elo, Amex, Hipercard — detectadas/exibidas no cadastro do cartão.
- **Logos de assinaturas:** Netflix, Spotify, Amazon Prime, Disney+, academia, etc., para o módulo de assinaturas (com fallback genérico + cor custom).
- Categorias representadas por **ícones** (não emojis), com cor de fundo por categoria.

### 2.5 Componentes-chave de UI a detalhar no Stitch
- **Card de cartão de crédito realista** (estilo cartão físico, glassmorphism): mostra bandeira, últimos 4 dígitos, nome do titular, validade, limite usado/disponível. **No cadastro do cartão, o card embaixo se atualiza em tempo real conforme o usuário digita** — bandeira detectada pelo número, número formatado, nome, validade (igual à referência enviada).
- **Card de saldo total** no topo da home, com **saldo projetado logo abaixo** (ver §4.1).
- **Bottom navigation bar** (mobile-first): poucas abas, ícones limpos, aba central de **lançamento rápido** (botão destacado).
- **Calendário financeiro** mensal com marcadores de entradas/saídas por dia.
- **Gráficos** (donut de gastos por categoria, barras de evolução mensal entrada x saída) com estética alinhada ao tema escuro/vidro.
- **Modais e bottom sheets** de lançamento, com fluxo curto.
- Telas de **onboarding/login/cadastro** bonitas, com a identidade de vidro/gradiente.

---

## 3. Navegação e estrutura de telas

Mobile-first, bottom-tab. Sugestão de abas:

1. **Início (Dashboard):** saldo total + projetado, resumo do mês, contas, próximos vencimentos, atalhos.
2. **Transações:** lista filtrável (por conta, cartão, categoria, período, status), busca.
3. **Lançar (+):** botão central destacado → bottom sheet de lançamento rápido.
4. **Calendário:** visão mensal do fluxo financeiro.
5. **Mais / Menu:** acesso a Cartões, Assinaturas, Investimentos, Orçamento, Metas, Dívidas, Relatórios, Gestão Familiar, Configurações.

Topo do app deve permitir alternar entre **modo Individual** e **modo Gestão Familiar** (ver §6).

---

## 4. Conceitos centrais

### 4.1 Contas / Carteiras (separar valores por conta) + Rendimento
- Cadastro de **múltiplas contas/carteiras**: nome, tipo (corrente, poupança, conta digital, carteira física, etc.), **logo do banco**, cor, saldo inicial.
- Cada conta tem **saldo independente**; saldo total = soma das contas. Visualizar e filtrar por conta individual.
- **Transferências entre contas** (sai de uma, entra em outra, sem alterar o patrimônio total).
- Cada transação (receita/despesa) é vinculada a uma conta.
- **Rendimento automático da conta:** ao cadastrar a conta, opção de marcar que ela **rende** (ex: Mercado Pago rende sobre o saldo até determinado limite). Configurar: taxa (ex: % do CDI ou % a.a./a.m.), e **teto de saldo que rende** (ex: rende só até R$ 10.000). O app **atualiza o saldo automaticamente conforme o rendimento** ao longo do tempo (job/cálculo diário). Mostrar quanto a conta já rendeu.

### 4.2 Cartões de Crédito e Parcelamento
- Cadastro de **múltiplos cartões**: nome/apelido, **bandeira** (detectada pelo número), últimos dígitos, limite, **dia de fechamento** da fatura, **dia de vencimento**, conta de pagamento padrão.
- **Card visual em tempo real** durante o cadastro (ver §2.5).
- Acompanhamento de **limite usado vs. disponível**.
- **Compras parceladas:** lançar uma compra (ex: R$ 1.200 em 12x) gera automaticamente as 12 parcelas, distribuídas nos meses corretos respeitando o fechamento.
- **Faturas mensais:** agrupamento de compras/parcelas por mês de competência. Pagamento da fatura debita de uma conta. Status (aberta/fechada/paga).
- Alertas de fechamento e vencimento.

### 4.3 Calendário Financeiro
- Visão **mensal**: cada dia mostra marcadores de entradas/saídas previstas (vencimentos, parcelas, recorrências, receitas, cobranças de assinatura).
- Tocar no dia abre os lançamentos daquele dia.
- Ajuda a visualizar o fluxo de caixa do mês. Navegação fluida entre meses.

### 4.4 Saldo projetado
- Logo **abaixo do saldo total** na home: **saldo projetado** do fim do mês (ou período), considerando o que ainda vai entrar e sair — recorrências, parcelas, faturas, assinaturas e vencimentos previstos.
- Responde de forma rápida "quanto vai sobrar". Diferenciar visualmente saldo atual (realizado) de projetado (previsto).

### 4.5 Assinaturas (Subscriptions)
- **Área dedicada para cadastrar assinaturas recorrentes** (Netflix, Spotify, Prime, Disney+, academia, software, etc.).
- Cada assinatura: nome, **logo** (com fallback), valor, ciclo (mensal/anual/etc.), dia de cobrança, conta/cartão de débito, categoria.
- Visão consolidada: **total gasto em assinaturas por mês/ano**, próximas cobranças, e impacto no orçamento.
- Cada cobrança gera lançamento automático (e entra no calendário e no saldo projetado).
- Alertas antes da cobrança.

### 4.6 Investimentos / Rendimentos (módulo separado)
- Seção **separada** para cadastrar investimentos: **CDB, ações, fundos imobiliários (FIIs), Tesouro, cripto, poupança, etc.**
- Cada investimento: tipo, nome/ticker, valor aplicado, data, e — quando aplicável — rentabilidade configurada (ex: % CDI, taxa fixa) para projeção/atualização de valor.
- Visão de **patrimônio investido** consolidado, separado do saldo em conta, com distribuição por tipo (gráfico).
- Diferenciar claramente: **saldo em conta** (líquido, gastável) vs. **patrimônio investido**. Patrimônio total = contas + investimentos.
- (Atualização automática de cotações de mercado fica para roadmap futuro — no primeiro momento, valor/rentabilidade informados/projetados.)

---

## 5. Funcionalidades principais (núcleo)

### Transações
- Receitas e despesas, vínculo obrigatório a conta (ou cartão, no crédito).
- **Categorias e subcategorias** com **ícones** e cores, personalizáveis.
- **Recorrência flexível:** semanal, quinzenal, mensal, bimestral, trimestral, semestral, anual (espelhar o Despezzas).
- Status pago/recebido ou pendente.
- Observação/nota.
- **Lançamento rápido:** fluxo curtíssimo a partir do botão central (valor → categoria → conta → salvar). Requisito de UX — registrar gasto tem que levar segundos.
- Edição em massa de transações recorrentes (espelhar o budgi: editar/excluir vários campos de uma recorrência de uma vez).

### Orçamento (Budget)
- Orçamento **mensal por categoria**. Acompanhamento visual gasto x limite. Alerta ao aproximar/estourar.

### Metas financeiras
- Criar metas de economia (ex: "Juntar R$ 5.000 para viagem") e acompanhar progresso.

### Dívidas
- Registrar e acompanhar dívidas/compromissos (inspirado nas referências de "debt management").

### Dashboard / Home
- Saldo total + **saldo projetado** abaixo.
- Resumo do mês: receitas, despesas, balanço.
- Saldo por conta. Gastos por categoria (gráfico donut). Próximos vencimentos.
- Idealmente **customizável** (usuário escolhe widgets de destaque — espelhar o Fast Budget/Despezzas).

### Relatórios e Gráficos
- Gastos por categoria, por conta, por cartão, por período.
- Evolução mensal (entradas x saídas). Filtros por data, conta, categoria, cartão.

### Lembretes / Notificações
- Vencimentos de contas e faturas, parcelas, orçamento estourado, cobranças de assinatura. (Canal conforme §1.)

---

## 6. Gestão Familiar (círculo/grupo)

- O app tem a camada **Individual** (finanças só do usuário) e a camada **Gestão Familiar**.
- Um usuário pode **criar um círculo familiar** e **convidar membros** (convite por e-mail via Resend, com aceite).
- Na **Gestão Familiar**, o app faz o **cruzamento/consolidação** dos dados dos membros do círculo: soma todas as receitas, soma todas as despesas, consolida saldos, mostra cartões, faturas, assinaturas e investimentos do grupo, balanço familiar etc.
- Visões: total da família, contribuição/gasto por membro, despesas compartilhadas vs. individuais.
- **Privacidade e permissões:** definir o que cada membro compartilha com o círculo e papéis (ex: administrador do círculo vs. membro). Membro deve poder manter itens privados. Detalhar regras de permissão no planejamento.
- Alternância clara no topo do app entre "minhas finanças" e "finanças da família".

---

## 7. Roadmap futuro (não na v1)

- **Open Finance** (importação automática de transações) — arquitetura preparada, mas **fora do primeiro momento**.
- Categorização automática de transações.
- Atualização automática de cotações de investimentos (ações, FIIs, cripto, câmbio).
- Tags além de categorias (demanda recorrente nas avaliações do Despezzas).
- Exportação de dados (Excel, PDF, CSV).
- Multi-moeda / câmbio.
- Modelo freemium (básico grátis + premium).

---

## 8. Entidades de dados sugeridas (ponto de partida — refine você)

- **User** — usuário (auth, perfil, preferências de tema, idioma).
- **Account** — conta/carteira (nome, tipo, banco/logo, cor, saldo inicial, rende?, taxa de rendimento, teto de rendimento).
- **CreditCard** — cartão (apelido, bandeira, últimos dígitos, limite, dia fechamento, dia vencimento, conta de pagamento).
- **Category** / **Subcategory** — categoria (nome, ícone, cor, tipo receita/despesa).
- **Transaction** — lançamento (valor, data, tipo, conta OU cartão, categoria, status, recorrência, observação, dono).
- **Installment** — parcela (transação-pai, número/total, mês de competência, valor).
- **Invoice / Bill** — fatura mensal de cartão (cartão, mês, total, status).
- **RecurringRule** — regra de recorrência (frequência, próxima ocorrência).
- **Subscription** — assinatura (nome, logo, valor, ciclo, dia de cobrança, conta/cartão, categoria).
- **Investment** — investimento (tipo: CDB/ação/FII/Tesouro/cripto/etc., nome/ticker, valor aplicado, data, rentabilidade).
- **Budget** — orçamento (categoria, mês, limite).
- **Goal** — meta (nome, valor alvo, valor atual, prazo).
- **Debt** — dívida (descrição, valor, credor, status).
- **Transfer** — transferência entre contas (origem, destino, valor, data).
- **FamilyCircle** — círculo familiar (nome, dono).
- **CircleMember** — vínculo usuário↔círculo (papel, permissões, o que compartilha).
- **Notification** — notificação (usuário, tipo, payload, canal, status).
- **YieldEntry** — registro de rendimento aplicado a uma conta (data, valor) — para auditoria do saldo que rende.

> Valores monetários sempre em **centavos (inteiro)** para evitar erro de ponto flutuante. Localização **pt-BR**, moeda **BRL**, datas no formato brasileiro.

---

## 9. Requisitos não-funcionais

- **Mobile-first** de verdade (layout desenhado para o celular primeiro; bottom-tab; gestos; bottom sheets).
- **PWA-ready** + empacotamento **Capacitor (.apk)** apontando para a API no servidor.
- **Multi-usuário** com autenticação segura, Turnstile no cadastro.
- **Dark como tema padrão**, White disponível, detecção automática por dispositivo + escolha manual.
- **Sem emojis** — ícones e logos/imagens.
- Tudo em **Docker Compose** no servidor, dados persistidos em volumes.
- HTTPS obrigatório no domínio.
- Segredos (Resend, Turnstile secret, JWT, DB) só em variáveis de ambiente; `.env.example` documentado; nada sensível no Git.
- Acessibilidade básica (contraste, tamanho de toque) e performance (carregamento rápido, animações leves).

---

## 10. Tarefas para você (Claude Code)

1. Definir e justificar a stack final (framework React, backend, banco, ORM, fila se necessário).
2. Montar a estrutura do projeto e o `docker-compose.yml` completo (frontend, API, Postgres, proxy/TLS, workers de rendimento/notificação).
3. Modelar o banco de dados (schema completo) a partir das entidades da §8.
4. **Gerar o design de TODAS as telas no Google Stitch (MCP) antes de qualquer frontend** — respeitando o design system da §2 (dark glassmorphism, paleta roxo/azul, sem emoji, cards de vidro, card de cartão em tempo real).
5. Definir a estratégia de notificações (Web Push + Capacitor) e de autenticação (incluindo Turnstile e Resend).
6. Propor **roadmap em fases**: MVP primeiro (auth + contas + transações + cartões/parcelas + calendário + saldo projetado), depois assinaturas, investimentos, orçamento/metas/dívidas, e por fim gestão familiar.
7. Gerar o `CLAUDE.md` de especificação do projeto.
8. Após cada etapa concluída, **push para o GitHub** (perguntar o nome do repositório se ainda não existir).

---

## 11. Referências de produto e design

- **Despezzas** (despezzas.com.br): orçamento mensal personalizado; gestão de cartões em um só lugar com monitoramento de limites e lembretes automáticos; controle de dívidas; gráficos e relatórios; recorrências flexíveis (semanal a semestral); transações parceladas; transferências; (Open Finance é premium, fora da v1).
- **budgi** (budgi.it): categorização e relatórios em tempo real; divisão de valor total em parcelas; edição/exclusão em massa de transações recorrentes; visualização de cartão/conta. (Open Finance fora da v1.)
- **Referências visuais enviadas (imagens):**
  - Dashboard financeiro com cards de cartão em destaque, sidebar limpa, tabelas de transações.
  - "Financial UI Kit — Glassmorphism": superfícies de vidro, fundo escuro azul/roxo, ícone dourado central, seções de charts e componentes — **a assinatura visual do projeto**.
  - App de "Debt Management": fundo escuro, valor grande em destaque, accent contrastante, layout mobile limpo.
  - Tela "use card for payment": fundo azul/roxo em gradiente, **card de crédito em glassmorphism** com valor, número mascarado, titular, validade e bandeira Visa — **modelo do card de cartão em tempo real no cadastro**.