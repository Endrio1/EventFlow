# Guia de Configuração - Recuperação de Senha

## 📧 Sistema de Recuperação de Senha

O EventFlow agora possui um sistema completo de recuperação de senha via email. Este guia explica como configurar e testar essa funcionalidade.

---

## 🚀 Configuração Inicial

### 1. Atualizar o Banco de Dados

Execute a migration para adicionar as colunas necessárias:

```bash
psql -U postgres -d eventflow -f scripts/init_db.sql
```

Ou manualmente no banco de dados:

```sql
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP WITH TIME ZONE;
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure as credenciais SMTP.

---

## 📮 Opções de Configuração de Email

### Opção 1: Gmail (Recomendado para Desenvolvimento)

**Passo a passo:**

1. Acesse sua conta Google
2. Vá em **Segurança** → https://myaccount.google.com/security
3. Ative a **Verificação em duas etapas**
4. Vá em **Senhas de app** → https://myaccount.google.com/apppasswords
5. Crie uma nova senha de app para "Mail"
6. Copie a senha gerada (16 caracteres sem espaços)

**Configuração no .env:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # Senha de app (remova os espaços)
SMTP_FROM=seu-email@gmail.com
BASE_URL=http://localhost:3000
```

### Opção 2: Mailtrap (Apenas para Testes)

Ideal para testar emails sem enviar de verdade.

1. Crie conta em https://mailtrap.io
2. Acesse "Email Testing" → "Inboxes"
3. Copie as credenciais SMTP

**Configuração no .env:**

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=seu-username-mailtrap
SMTP_PASS=sua-senha-mailtrap
SMTP_FROM=noreply@eventflow.com
BASE_URL=http://localhost:3000
```

### Opção 3: Outlook/Hotmail

**Configuração no .env:**

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@outlook.com
SMTP_PASS=sua-senha
SMTP_FROM=seu-email@outlook.com
BASE_URL=http://localhost:3000
```

### Opção 4: SendGrid (Produção)

Para ambientes de produção, recomendamos usar um serviço profissional.

1. Crie conta em https://sendgrid.com
2. Gere uma API Key
3. Configure o SMTP Relay

**Configuração no .env:**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxx  # Sua API Key
SMTP_FROM=noreply@eventflow.com
BASE_URL=https://seudominio.com
```

---

## 🔄 Fluxo de Recuperação de Senha

### 1. Solicitar Recuperação

**Método 1: Pelo próprio usuário**

**URL:** `POST /api/auth/forgot-password`

**Body:**
```json
{
  "email": "usuario@exemplo.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Instruções para redefinir sua senha foram enviadas para seu email"
}
```

**Método 2: Pelo administrador (Painel Admin)**

1. Acesse o **Painel Admin**: http://localhost:3000/admin.html
2. Faça login como administrador
3. Na lista de usuários, clique no botão **"Ver"** do usuário desejado
4. No modal de detalhes, clique em **"🔑 Enviar Link de Redefinição de Senha"**
5. Confirme o envio
6. O usuário receberá o email automaticamente

> **Nota:** Esta funcionalidade permite que administradores auxiliem usuários que esqueceram suas senhas ou precisam redefini-las por questões de segurança.

### 2. Receber Email

O usuário receberá um email com:
- Link de redefinição: `http://localhost:3000/reset-password.html?token=XXXXX`
- Token válido por **1 hora**
- Instruções de segurança

### 3. Redefinir Senha

**URL:** `POST /api/auth/reset-password`

**Body:**
```json
{
  "token": "token-recebido-no-email",
  "newPassword": "nova-senha-segura"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Senha redefinida com sucesso! Você já pode fazer login com sua nova senha"
}
```

---

## 🧪 Testando a Funcionalidade

### Teste Manual

1. **Inicie o servidor:**
   ```bash
   npm run dev
   ```

2. **Acesse a página de login:**
   ```
   http://localhost:3000
   ```

3. **Clique em "Entrar"** e depois em **"Esqueceu sua senha?"**

4. **Digite um email cadastrado** e clique em "Enviar Instruções"

5. **Verifique seu email** (ou inbox do Mailtrap se estiver testando)

6. **Clique no link** ou acesse manualmente:
   ```
   http://localhost:3000/reset-password.html?token=TOKEN_RECEBIDO
   ```

7. **Digite a nova senha** (mínimo 6 caracteres) e confirme

8. **Faça login** com a nova senha

### Teste via cURL

**1. Solicitar recuperação:**

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "seu-email@exemplo.com"}'
```

**2. Redefinir senha (use o token recebido por email):**

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "token-recebido-por-email",
    "newPassword": "nova-senha-123"
  }'
```

---

## 🔒 Segurança

### Medidas Implementadas

1. **Token único e aleatório:** Gerado com `crypto.randomBytes(32)`
2. **Hash SHA256:** Token armazenado como hash no banco
3. **Expiração:** Links válidos por apenas 1 hora
4. **Resposta genérica:** Sistema não revela se email existe (anti-enumeration)
5. **Token de uso único:** Invalidado após uso
6. **HTTPS obrigatório em produção:** Configure SSL/TLS
7. **Rate limiting:** Considere adicionar limite de requisições

### Recomendações

- ✅ Use HTTPS em produção
- ✅ Configure rate limiting (ex: express-rate-limit)
- ✅ Monitore tentativas de recuperação
- ✅ Use serviço SMTP profissional em produção
- ✅ Configure SPF, DKIM e DMARC no domínio
- ✅ Implemente log de atividades suspeitas

---

## 🐛 Troubleshooting

### Email não está sendo enviado

**Erro: "Invalid login"**
- ✅ Verifique se SMTP_USER e SMTP_PASS estão corretos
- ✅ Se usar Gmail, certifique-se de usar senha de app
- ✅ Verifique se a verificação em duas etapas está ativa

**Erro: "Connection timeout"**
- ✅ Verifique o SMTP_HOST e SMTP_PORT
- ✅ Teste sua conexão com internet
- ✅ Verifique se firewall não está bloqueando

**Email cai no spam**
- ✅ Configure SPF, DKIM e DMARC
- ✅ Use serviço profissional (SendGrid, AWS SES)
- ✅ Use domínio verificado

### Token inválido ou expirado

- ✅ Verifique se link foi usado em até 1 hora
- ✅ Certifique-se de copiar o token completo
- ✅ Token só pode ser usado uma vez
- ✅ Solicite nova recuperação se expirou

### Não recebo o email

- ✅ Verifique pasta de spam
- ✅ Confirme que email está cadastrado no sistema
- ✅ Verifique logs do servidor para erros
- ✅ Teste com Mailtrap para debug

---

## 📁 Arquivos Relacionados

### Backend
- `src/models/User.js` - Modelo com campos de reset
- `src/controllers/authController.js` - Métodos forgotPassword e resetPassword
- `src/services/emailService.js` - Serviço de envio de email
- `src/routes/authRoutes.js` - Rotas públicas

### Frontend
- `public/forgot-password.html` - Página de solicitação
- `public/reset-password.html` - Página de redefinição
- `public/js/auth.js` - Modal de login com link

### Database
- `scripts/init_db.sql` - Migration com novas colunas

---

## 📊 Estrutura do Email

O email enviado possui:

- ✅ Design responsivo e profissional
- ✅ Gradiente roxo (identidade EventFlow)
- ✅ Botão de ação destacado
- ✅ Link alternativo (se botão não funcionar)
- ✅ Informações de segurança
- ✅ Avisos sobre validade do link
- ✅ Versão texto plano (fallback)

---

## 🎯 Próximos Passos (Opcional)

Melhorias que podem ser implementadas:

- [ ] Rate limiting nas rotas de recuperação
- [ ] Captcha no formulário de recuperação
- [ ] Notificação de mudança de senha por email
- [ ] Log de tentativas de recuperação
- [ ] Dashboard admin para visualizar tentativas
- [ ] Blacklist de IPs suspeitos
- [ ] Autenticação de dois fatores (2FA)

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do servidor (`console.log`)
2. Teste com Mailtrap primeiro
3. Confirme que variáveis de ambiente estão corretas
4. Verifique se migration foi aplicada no banco

---

**Desenvolvido para EventFlow** 🎉
Sistema de Gerenciamento de Eventos
