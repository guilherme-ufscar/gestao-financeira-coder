# Cofrin - Status Atual do Projeto

## Data: 26/05/2026

## O que está pronto

### Backend (server/)
- Auth completo: registro, login, refresh token, reset senha, logout
- Endpoint biometrico: POST /auth/refresh-biometric
- CRUD: contas, transacoes, cartoes, assinaturas, investimentos
- Orcamento, metas, dividas
- Categorias padrao ao registrar
- Familia (rotas)
- Notificacoes push (rotas)
- CORS aberto (origin: true) para app nativo funcionar
- Prisma ORM com 18 modelos
- Deploy via Docker (container api)

### Frontend Web (web/)
- React + Vite + Tailwind + Zustand
- Tema dark/light com glassmorphism
- PWA com service worker
- Paginas: Login, Registro, Recuperar Senha, Dashboard, Transacoes, Lancamento Rapido, Calendario, Contas, Cartoes (visual glassmorphism), Assinaturas, Investimentos, Orcamento/Metas/Dividas, Menu Mais
- Login biometrico (digital) no app nativo

### App Android (Capacitor)
- APK gerado: D:\coder\gestao-financeira\Cofrin.apk (8.1MB)
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
- [ ] Relatorios com graficos (Recharts ja instalado)
- [ ] Circulo familiar (convites, permissoes, compartilhamento)
- [ ] Pagina de configuracoes (perfil, tema, notificacoes)
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

### Build
```bash
npm run build:web    # Build producao do frontend
```

### Deploy na VPS
```bash
cd /www/wwwroot/gestaocoder
git pull
docker compose up -d --build
docker compose exec api npx prisma db push  # se mudar schema
```

### Gerar APK
```bash
cd web
npx vite build
npx cap sync android
# No PowerShell com env vars configuradas:
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