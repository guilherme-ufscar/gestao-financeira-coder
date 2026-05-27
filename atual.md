# Cofrin - Status Atual do Projeto

## Data: 26/05/2026

## O que está pronto

### Backend (server/)
- Auth completo: registro, login, refresh token, reset senha, logout
- Endpoint biometrico: POST /auth/refresh-biometric
- CRUD: contas, transacoes, cartoes, assinaturas, investimentos
- Orcamento, metas, dividas
- Categorias padrao ao registrar
- Familia (rotas completas: circulos, convites, aceitar/rejeitar, summary)
- Notificacoes push (rotas)
- CORS aberto (origin: true) para app nativo funcionar
- Prisma ORM com 18 modelos
- Deploy via Docker (container api)

### Frontend Web (web/)
- React + Vite + Tailwind + Zustand
- Tema dark/light com glassmorphism
- PWA com service worker
- Paginas implementadas:
  - Login, Registro, Recuperar Senha
  - **Onboarding** (6 slides com cards animados, swipe, antes do login)
  - **Dashboard redesenhado** (6 secoes: saldo com grid, contas scroll horizontal, cartoes scroll horizontal, gastos por categoria com donut chart, proximos vencimentos em cards, acesso rapido grid 2x2)
  - **Transacoes** (agrupadas por data, busca, chips filtro, resumo receitas/despesas)
  - **Lancamento Rapido** (fluxo em 4 steps com Framer Motion: valor > categoria > conta/cartao > detalhes)
  - Calendario
  - Contas, Cartoes (visual glassmorphism), Assinaturas, Investimentos
  - Orcamento/Metas/Dividas
  - **Relatorios** (graficos barras evolucao mensal, donut categorias, filtro periodo)
  - **Gestao Familiar** (criar circulo, convidar, aceitar/rejeitar, resumo financeiro)
  - **Configuracoes** (perfil, tema auto/dark/light, alterar senha, biometria toggle, logout)
  - **Menu Mais** (organizado em secoes com icones coloridos)
- Login biometrico (digital) no app nativo
- CSS: classes glass-card-gradient, card-glow, chip/chip-active, section-header, animacoes fadeInUp/slideInRight

### App Android (Capacitor)
- APK gerado: D:\coder\gestao-financeira\Cofrin.apk (8MB)
- Package: com.codermaster.cofrin
- Icone customizado
- Conecta direto no IP da VPS (http://66.94.105.155:10206/api)
- Biometria: capacitor-native-biometric
- Plugins: StatusBar, Keyboard, Haptics, App

### Infraestrutura
- Docker Compose: db (Postgres 16), api, worker, web (Nginx), proxy (Nginx)
- Porta 10206 (HTTP via Cloudflare) e 10207 (HTTPS direto)
- Certificado Cloudflare Origin em /www/server/panel/vhost/cert/
- VPS: 66.94.105.155
- Dominio: gestaofinanceira.codermaster.com.br
- GitHub: https://github.com/guilherme-ufscar/gestao-financeira-coder

### Worker (worker/)
- Cron jobs: rendimento de contas, transacoes recorrentes, notificacoes push
- Deploy via Docker (container worker)

## O que falta / proximos passos

### Funcionalidades pendentes
- [ ] Notificacoes push (VAPID keys, subscription no frontend)
- [ ] Importacao de extratos (CSV/OFX)
- [ ] Exportacao de dados (PDF/Excel)

### Melhorias tecnicas
- [ ] Migrations do Prisma (atualmente usa db push)
- [ ] Testes automatizados
- [ ] CI/CD (GitHub Actions)
- [ ] Rate limiting configurado
- [ ] APK release assinado (keystore)
- [ ] Publicacao na Play Store

### Configuracoes pendentes na VPS
- [ ] VAPID keys (npx web-push generate-vapid-keys)
- [ ] RESEND_API_KEY para emails funcionarem
- [ ] TURNSTILE_SECRET_KEY para captcha no registro

## Comandos uteis

### Desenvolvimento local
```bash
npm run dev:web      # Frontend em localhost:5173
npm run dev:server   # API em localhost:3000
npm run dev:worker   # Worker com cron jobs
```

### Teste no celular via USB (live reload)
```powershell
# 1. Configurar capacitor.config.ts com server.url apontando pro IP local
# 2. Sync + build + instalar:
cd D:\coder\gestao-financeira\web
npx cap sync android
$env:JAVA_HOME = "D:\programas\jdk21\jdk-21.0.5+11"
$env:ANDROID_HOME = "D:\programas\android-sdk"
$env:ANDROID_SDK_ROOT = "D:\programas\android-sdk"
$env:GRADLE_USER_HOME = "D:\programas\.gradle"
cd android
.\gradlew.bat assembleDebug --no-daemon
# Instalar no celular:
D:\programas\android-sdk\platform-tools\adb.exe install -r app\build\outputs\apk\debug\app-debug.apk
D:\programas\android-sdk\platform-tools\adb.exe shell am start -n com.codermaster.cofrin/.MainActivity
```

### Deploy na VPS
```bash
cd /www/wwwroot/gestaocoder
git pull
docker compose up -d --build
docker compose exec api npx prisma db push  # se mudar schema
```

### Gerar APK final
```bash
cd web
npx vite build
npx cap sync android
cd android
.\gradlew.bat assembleDebug --no-daemon
# APK em: android/app/build/outputs/apk/debug/app-debug.apk
```

### Env vars necessarias para Gradle/APK
```powershell
$env:JAVA_HOME = "D:\programas\jdk21\jdk-21.0.5+11"
$env:ANDROID_HOME = "D:\programas\android-sdk"
$env:ANDROID_SDK_ROOT = "D:\programas\android-sdk"
$env:GRADLE_USER_HOME = "D:\programas\.gradle"
```