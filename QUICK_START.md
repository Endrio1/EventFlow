# 🚀 Guia de Instalação Rápida - EventFlow

## Passo a Passo para Começar

### 1️⃣ Instalar Dependências
```bash
npm install
```

### 2️⃣ Configurar Banco de Dados

**Opção A: Criar manualmente**
```sql
CREATE DATABASE eventflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Opção B: Usar MySQL Workbench ou phpMyAdmin**
- Crie um novo banco de dados chamado `eventflow`

### 3️⃣ Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar o arquivo .env com suas configurações
# Mínimo necessário:
# - DB_PASSWORD (senha do MySQL)
# - JWT_SECRET (qualquer string secreta longa)
```

### 4️⃣ Iniciar o Servidor

**Modo Desenvolvimento (com hot-reload):**
```bash
npm run dev
```

**Modo Produção:**
```bash
npm start
```

### 5️⃣ Acessar a Aplicação

Abra seu navegador em:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api

---

## ✅ Checklist de Verificação

Antes de iniciar, certifique-se de ter:

- [ ] Node.js 18+ instalado
- [ ] MySQL 8.0+ instalado e rodando
- [ ] Arquivo `.env` configurado
- [ ] Banco de dados `eventflow` criado
- [ ] Porta 3000 disponível

---

## 🎯 Primeiro Uso

### Criar Conta de Organizador

1. Acesse http://localhost:3000
2. Clique em "Cadastrar"
3. Preencha os dados
4. **IMPORTANTE**: Selecione "Organizador" como tipo de conta
5. Faça login

### Criar Primeiro Evento

1. Após login, clique em "Criar Evento" no menu
2. Ou acesse diretamente o painel: http://localhost:3000/dashboard.html
3. Preencha os dados do evento
4. Faça upload de uma imagem (opcional)
5. Clique em "Salvar Evento"

### Testar Inscrição

1. Abra o site em modo anônimo ou outro navegador
2. Crie uma conta como "Participante"
3. Navegue pelos eventos
4. Clique em "Inscrever-se" em um evento

---

## 🐛 Resolução de Problemas Comuns

### Erro: "Cannot connect to database"
**Solução:**
1. Verifique se o MySQL está rodando
2. Confirme as credenciais no arquivo `.env`
3. Certifique-se de que o banco `eventflow` existe

```bash
# Testar conexão MySQL
mysql -u root -p
# Depois digite: SHOW DATABASES;
```

### Erro: "Port 3000 already in use"
**Solução:**
1. Altere a porta no arquivo `.env`:
```env
PORT=3001
```

2. Ou finalize o processo na porta 3000:
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

### Erro: "JWT_SECRET is not defined"
**Solução:**
Certifique-se de ter o arquivo `.env` na raiz do projeto com:
```env
JWT_SECRET=seu_secret_super_secreto_aqui_mude_em_producao
```

### Erro ao fazer upload de imagem
**Solução:**
1. Verifique se o diretório existe:
```bash
mkdir -p public/uploads/events
```

2. Verifique permissões (Linux/Mac):
```bash
chmod 755 public/uploads/events
```

### Tabelas não são criadas automaticamente
**Solução:**
As tabelas são criadas automaticamente na primeira execução. Se não foram:

1. Delete o banco e recrie:
```sql
DROP DATABASE IF EXISTS eventflow;
CREATE DATABASE eventflow;
```

2. Reinicie o servidor:
```bash
npm run dev
```

---

## 📊 Dados de Teste (Opcional)

Você pode usar estes dados para testar:

### Usuário Organizador
- Email: `organizador@test.com`
- Senha: `123456`
- Tipo: Organizador

### Usuário Participante
- Email: `participante@test.com`
- Senha: `123456`
- Tipo: Participante

**Nota:** Você precisará criar estes usuários manualmente através da interface.

---

## 🔄 Reiniciar do Zero

Se precisar recomeçar do início:

```bash
# 1. Parar o servidor (Ctrl+C)

# 2. Deletar banco de dados
mysql -u root -p
DROP DATABASE eventflow;
CREATE DATABASE eventflow;
exit

# 3. Deletar uploads (opcional)
rm -rf public/uploads/events/*

# 4. Reiniciar servidor
npm run dev
```

---

## 📱 Testar Responsividade

Para testar o design mobile-first:

1. Abra o DevTools (F12)
2. Clique no ícone de dispositivo móvel
3. Teste em diferentes resoluções:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - Desktop (1920px)

---

## 🎨 Personalizar Cores

Para alterar as cores, edite o arquivo `public/css/style.css`:

```css
:root {
  --primary-color: #1E40AF;     /* Azul petróleo */
  --secondary-color: #64748B;    /* Cinza azulado */
  --background-color: #F1F5F9;   /* Branco gelo */
  --text-color: #0F172A;         /* Preto suave */
  --accent-color: #F97316;       /* Laranja suave */
  --success-color: #22C55E;      /* Verde suave */
  --error-color: #EF4444;        /* Vermelho coral */
}
```

---

## 📞 Precisa de Ajuda?

- 📖 Documentação completa: [README.md](README.md)
- 🔌 Documentação da API: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- 🐛 Reportar bugs: [GitHub Issues](https://github.com/Endrio1/EventFlow/issues)

---

## ✨ Pronto!

Agora você tem um sistema completo de gerenciamento de eventos funcionando! 🎉

Próximos passos recomendados:
1. ✅ Criar sua conta de organizador
2. ✅ Criar seu primeiro evento
3. ✅ Testar a inscrição como participante
4. ✅ Explorar o painel administrativo
5. ✅ Testar em dispositivos móveis

**Divirta-se usando o EventFlow!** 🚀
