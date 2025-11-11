# ⚠️ CONFIGURAÇÃO NECESSÁRIA - Recuperação de Senha

## 🚨 ERRO 500: Configurações de Email Não Encontradas

Se você recebeu o erro **500 (Internal Server Error)** ao tentar recuperar senha, é porque as configurações SMTP não estão definidas no arquivo `.env`.

---

## ✅ Solução Rápida (5 minutos)

### Opção 1: Gmail (Recomendado para Testes)

1. **Abra o arquivo `.env` na raiz do projeto**

2. **Certifique-se de que tem estas linhas:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=seu-email@gmail.com
   SMTP_PASS=sua-senha-de-app
   SMTP_FROM=seu-email@gmail.com
   BASE_URL=http://localhost:3000
   ```

3. **Obtenha uma senha de app do Gmail:**
   - Acesse: https://myaccount.google.com/security
   - Ative **"Verificação em duas etapas"** (se ainda não tiver)
   - Acesse: https://myaccount.google.com/apppasswords
   - Clique em **"Selecionar app"** → Escolha **"E-mail"** ou **"Outro"**
   - Clique em **"Selecionar dispositivo"** → Escolha **"Outro"** e digite **"EventFlow"**
   - Clique em **"Gerar"**
   - **Copie a senha de 16 caracteres** (sem espaços)

4. **Cole no arquivo `.env`:**
   ```env
   SMTP_USER=seu-email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx  # Cole aqui (remova os espaços)
   SMTP_FROM=seu-email@gmail.com
   ```

5. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```

---

### Opção 2: Mailtrap (Apenas para Testes - Emails NÃO são enviados)

Ideal se você quer apenas testar a funcionalidade sem configurar email real.

1. **Crie conta gratuita em:** https://mailtrap.io

2. **Acesse "Email Testing" → "Inboxes"**

3. **Copie as credenciais SMTP** e configure no `.env`:
   ```env
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=seu-username-mailtrap
   SMTP_PASS=sua-senha-mailtrap
   SMTP_FROM=noreply@eventflow.com
   BASE_URL=http://localhost:3000
   ```

4. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```

5. **Teste:** Os emails aparecerão no inbox do Mailtrap (não no seu email real)

---

### Opção 3: Outlook/Hotmail

1. **Configure no arquivo `.env`:**
   ```env
   SMTP_HOST=smtp-mail.outlook.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=seu-email@outlook.com
   SMTP_PASS=sua-senha
   SMTP_FROM=seu-email@outlook.com
   BASE_URL=http://localhost:3000
   ```

2. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```

---

## 🧪 Testando

1. **Acesse:** http://localhost:3000
2. **Clique em "Entrar"** → **"Esqueceu sua senha?"**
3. **Digite um email cadastrado** (ex: admin@admin.com)
4. **Clique em "Enviar Instruções"**
5. **Verifique seu email** (ou Mailtrap)

---

## 🐛 Erros Comuns

### "Invalid login" (Gmail)
- ❌ Você está usando sua senha normal do Gmail
- ✅ Use a **senha de app** de 16 caracteres

### "Verification in two steps is OFF"
- ❌ Verificação em 2 etapas não está ativa
- ✅ Ative em https://myaccount.google.com/security

### "Connection timeout"
- ❌ SMTP_HOST ou SMTP_PORT incorretos
- ✅ Verifique se copiou corretamente

### Ainda não funciona?
1. Verifique se salvou o arquivo `.env`
2. **Reinicie o servidor** (Ctrl+C e `npm run dev`)
3. Veja os logs do terminal para mensagens de erro

---

## 📄 Documentação Completa

Para mais detalhes, consulte: **`RECUPERACAO_SENHA.md`**

---

## ⚡ Checklist Rápido

- [ ] Arquivo `.env` existe na raiz do projeto
- [ ] Variáveis SMTP_* estão configuradas
- [ ] Se Gmail: Senha de app foi gerada
- [ ] Se Gmail: Verificação em 2 etapas está ativa
- [ ] Servidor foi reiniciado após editar `.env`
- [ ] Testou com um usuário cadastrado

---

**Após configurar, a recuperação de senha funcionará perfeitamente!** 🎉
