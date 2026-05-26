# Cofrin - Gestao Financeira Pessoal e Familiar

Aplicativo mobile-first de gestao financeira pessoal e familiar, com contas bancarias, cartoes de credito com parcelamento, calendario financeiro, assinaturas, investimentos, orcamento, metas, dividas e gestao familiar.

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Fastify + TypeScript + Prisma
- **Banco:** PostgreSQL 16
- **Worker:** Node.js + node-cron (rendimento, recorrencias, notificacoes)
- **Mobile:** Capacitor (APK Android)
- **Infra:** Docker Compose + Nginx (reverse proxy + TLS)

## Requisitos

- Docker e Docker Compose
- Node.js 20+ (para desenvolvimento local e geracao do APK)
- Certificado SSL (Let's Encrypt) configurado no servidor

## Deploy na VPS (Producao)

### 1. Clonar o repositorio

`ash
git clone https://github.com/guilherme-ufscar/gestao-financeira-coder.git
cd gestao-financeira-coder
`

### 2. Configurar variaveis de ambiente

`ash
cp .env.example .env
nano .env  # Preencher todos os valores reais
`

Variaveis obrigatorias:
- POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB - credenciais do banco
- DATABASE_URL - string de conexao (usar o host db do compose)
- JWT_SECRET, JWT_REFRESH_SECRET - segredos para tokens
- TURNSTILE_SECRET_KEY - secret key do Cloudflare Turnstile
- RESEND_API_KEY - chave da API Resend
- VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY - chaves VAPID para Web Push
- APP_URL - https://gestaofinanceira.codermaster.com.br

Para gerar chaves VAPID:
`ash
npx web-push generate-vapid-keys
`

### 3. Configurar SSL (Let's Encrypt)

`ash
sudo certbot certonly --standalone -d gestaofinanceira.codermaster.com.br
`

### 4. Build e deploy

`ash
docker compose build
docker compose up -d
`

A aplicacao estara disponivel em https://gestaofinanceira.codermaster.com.br (porta 10206).

### 5. Verificar

`ash
docker compose ps
docker compose logs -f api
`

## Geracao do APK Android

### Requisitos
- Node.js 20+
- Android SDK (Android Studio ou command-line tools)
- JDK 17+

### Passos

`ash
# Instalar dependencias
npm install

# Build do frontend
cd web
npm run build
cd ..

# Sincronizar com Capacitor
cd web
npx cap sync android
cd ..

# Os icones ja estao configurados em android/app/src/main/res/

# Gerar APK de debug
cd android
./gradlew assembleDebug

# O APK estara em: android/app/build/outputs/apk/debug/app-debug.apk

# Para release (requer keystore):
./gradlew assembleRelease
`

## Desenvolvimento Local

`ash
# Instalar dependencias
npm install

# Subir apenas o banco (precisa de Docker)
docker compose up db -d

# Rodar migrations
cd server
npx prisma migrate dev
cd ..

# Iniciar em modo dev (3 terminais)
npm run dev:server   # API em localhost:3000
npm run dev:web      # Frontend em localhost:5173
npm run dev:worker   # Worker de cron jobs
`

## Estrutura do Projeto

`
cofrin/
├── web/              # Frontend React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── styles/
│   └── Dockerfile
├── server/           # Backend Fastify
│   ├── src/
│   │   ├── modules/  # auth, accounts, transactions, cards, etc.
│   │   ├── lib/      # prisma, jwt, email
│   │   └── middleware/
│   ├── prisma/       # Schema e migrations
│   └── Dockerfile
├── worker/           # Cron jobs (rendimento, recorrencias, notificacoes)
│   ├── src/
│   │   └── jobs/
│   └── Dockerfile
├── nginx/            # Configs do reverse proxy
├── android-icone/    # Icones do app Android (prontos)
├── docker-compose.yml
├── .env.example
└── CLAUDE.md         # Especificacao tecnica
`

## Portas

- **10206** - Unica porta publica (HTTPS via Nginx)
- Todos os demais servicos (API, DB, Worker) comunicam-se apenas pela rede interna do Docker

## Licenca

Projeto privado.
