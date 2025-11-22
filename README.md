# 🎉 EventFlow - Sistema de Gerenciamento de Eventos

EventFlow é uma plataforma completa para gerenciamento de eventos que permite organizadores criarem e gerenciarem eventos, enquanto usuários podem facilmente descobrir e se inscrever em eventos de seu interesse.

![EventFlow](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4.18-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue)

## ✨ Funcionalidades

### Para Usuários
- 🔐 **Autenticação segura** com JWT
- � **Recuperação de senha** via email com links temporários
- �🔍 **Busca e filtros** avançados de eventos
- ✅ **Inscrição fácil** em eventos
- 📋 **Acompanhamento** de inscrições
- 📱 **Interface responsiva** mobile-first

### Para Organizadores
- ➕ **Criar e editar** eventos facilmente
- 🖼️ **Upload de imagens** dos eventos
- 👥 **Gerenciar participantes** e lista de inscritos
- 📊 **Painel administrativo** com estatísticas
- 🎯 **Controle de capacidade** automático
- 🔒 **Controle de vendas** (abrir/fechar inscrições)
- ⭐ **Visualizar avaliações** dos participantes

### Para Administradores
- 👨‍💼 **Painel de administração** completo
- 🔍 **Busca e filtros** de usuários e eventos
- 📊 **Estatísticas detalhadas** do sistema
- 👥 **Gerenciamento de usuários** (visualizar, editar, excluir)
- 🎫 **Gerenciamento de eventos** (aprovação, exclusão)
- 🔑 **Enviar links de redefinição de senha** para usuários
- 📧 **Gerenciamento de inscrições** e cancelamentos

### Sistema de Avaliações
- ⭐ **Avaliar eventos** (notas de 1 a 5)
- 💬 **Comentários** sobre a experiência
- 📝 **Editar e excluir** suas próprias avaliações
- 🔒 **Uma avaliação por usuário** por evento

### Sistema de Recuperação de Senha
- 📧 **Recuperação via email** com validação de identidade
- 🔐 **Links temporários** com expiração de 1 hora
- 🔒 **Tokens SHA256** hasheados no banco de dados
- ♻️ **Tokens de uso único** (invalidados após reset)
- 👨‍💼 **Administradores podem enviar** links de reset para usuários
- ✅ **Email de confirmação** após alteração de senha

### Recursos Técnicos
- 🛡️ **API RESTful** completa
- 🔒 **Autenticação JWT** segura
- � **Sistema de emails** com Nodemailer (suporte a Gmail, Outlook, SendGrid, Mailtrap)
- �📸 **Upload de imagens** com Multer
- 🗄️ **PostgreSQL com Sequelize ORM**
- 🎨 **Design moderno** com gradientes e glassmorphism
- 🎯 **Filtros e busca** em tempo real
- ⚡ **Performance otimizada**
- 📱 **Interface responsiva** mobile-first
- 🔐 **Criptografia SHA256** para tokens de reset

## 🚀 Começando

### Pré-requisitos

- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/Endrio1/EventFlow.git
cd EventFlow
```

2. **Instale as dependências**
```bash
npm install
```

3. **Instale os módulos necessários para PostgreSQL**
```bash
npm install dotenv pg pg-hstore
```
> **Nota:** Estes pacotes são essenciais para:
> - `dotenv` - Carregar variáveis de ambiente do arquivo `.env`
> - `pg` - Driver PostgreSQL para Node.js
> - `pg-hstore` - Serialização/deserialização de dados hstore do PostgreSQL

4. **Configure o banco de dados**

Crie um banco de dados PostgreSQL:
```sql
CREATE DATABASE eventflow;
```

Copie o script de inicialização para a query do banco dentro da aplicação PgAdmin 
ou
Execute o script de inicialização do banco de dados:
```bash
psql -U seu_usuario -d eventflow -f scripts/init_db.sql
```

5. **Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz do projeto:
```bash
touch .env
```

Edite o arquivo `.env` com suas configurações:
```env
PORT=3000
NODE_ENV=development

# Opção 1: URL completa do banco (recomendado)
DATABASE_URL=postgresql://usuario:senha@localhost:5432/eventflow

# Opção 2: Configuração individual
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eventflow
DB_USER=seu_usuario
DB_PASSWORD=sua_senha

JWT_SECRET=seu_secret_super_secreto_aqui
JWT_EXPIRES_IN=7d

# Configuração de Email (obrigatório para recuperação de senha)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app
SMTP_FROM=EventFlow <noreply@eventflow.com>
BASE_URL=http://localhost:3000

MAX_FILE_SIZE=5242880
UPLOAD_PATH=./public/uploads/events
```

> **⚠️ Importante:** Para usar o sistema de recuperação de senha, você precisa configurar um servidor SMTP.
> 
> - **Gmail**: Gere uma [Senha de App](https://myaccount.google.com/apppasswords)
> - **Mailtrap**: Use para testes em desenvolvimento
> - **SendGrid/Outlook**: Configure conforme documentação
>
> 📖 Veja o guia completo em [CONFIGURAR_EMAIL.md](CONFIGURAR_EMAIL.md)

6. **Inicie o servidor**
```bash
# Desenvolvimento (com hot-reload)
npm run dev

# Produção
npm start
```

6. **Acesse a aplicação**
- Frontend: http://localhost:3000
- API: http://localhost:3000/api

## 📁 Estrutura do Projeto

```
EventFlow/
├── src/
│   ├── config/
│   │   ├── database.js           # Configuração do Sequelize + PostgreSQL
│   │   └── multer.js             # Configuração de upload
│   ├── controllers/
│   │   ├── authController.js     # Autenticação, registro e recuperação de senha
│   │   ├── eventController.js    # CRUD de eventos
│   │   ├── enrollmentController.js # Gerenciamento de inscrições
│   │   └── feedbackController.js  # Sistema de avaliações
│   ├── middlewares/
│   │   ├── auth.js               # Autenticação JWT
│   │   └── errorHandler.js       # Tratamento de erros
│   ├── models/
│   │   ├── User.js               # Modelo de usuários (com campos de reset)
│   │   ├── Event.js              # Modelo de eventos
│   │   ├── Enrollment.js         # Modelo de inscrições
│   │   ├── Feedback.js           # Modelo de avaliações
│   │   └── index.js              # Associações entre modelos
│   ├── routes/
│   │   ├── authRoutes.js         # Rotas de autenticação e recuperação
│   │   ├── adminRoutes.js        # Rotas administrativas
│   │   ├── eventRoutes.js
│   │   ├── enrollmentRoutes.js
│   │   ├── feedbackRoutes.js     # Rotas de avaliações
│   │   └── index.js
│   ├── services/
│   │   └── emailService.js       # Serviço de envio de emails
│   └── server.js                 # Servidor Express
├── scripts/
│   └── init_db.sql               # Script de inicialização do banco
├── public/
│   ├── css/
│   │   ├── style.css             # Estilos principais (gradientes, glassmorphism)
│   │   └── dashboard.css         # Estilos do dashboard
│   ├── js/
│   │   ├── api.js                # Comunicação com API
│   │   ├── auth.js               # Autenticação frontend
│   │   ├── events.js             # Gerenciamento de eventos
│   │   ├── main.js               # Script principal
│   │   ├── dashboard.js          # Painel administrativo
│   │   ├── open-events.js        # Página de eventos abertos
│   │   └── utils.js              # Funções utilitárias
│   ├── uploads/
│   │   └── events/               # Imagens dos eventos
│   ├── index.html                # Página principal
│   ├── dashboard.html            # Painel do organizador
│   ├── admin.html                # Painel administrativo
│   ├── open-events.html          # Lista de eventos abertos
│   ├── forgot-password.html      # Solicitar recuperação de senha
│   └── reset-password.html       # Redefinir senha com token
├── .env
├── .env.example                  # Template de configuração
├── .gitignore
├── package.json
├── LICENSE
├── README.md
├── API_DOCUMENTATION.md          # Documentação completa da API
├── ADMIN_PANEL.md                # Guia do painel administrativo
├── CONFIGURAR_EMAIL.md           # Guia de configuração SMTP (5 min)
└── RECUPERACAO_SENHA.md          # Documentação do sistema de recuperação
```

## 🎨 Design System

### Paleta de Cores

**Gradiente Principal (Hero Section)**
- Roxo: `#667eea`
- Violeta: `#764ba2`
- Rosa: `#f093fb`
- Gradiente: `linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)`

**Cores de Interface**
- **Fundo Principal**: `#f0f4f8` (Azulado claro)
- **Texto Principal**: `#0F172A` (Preto suave)
- **Texto Secundário**: `#64748B` (Cinza azulado)
- **Destaques**: `#F97316` (Laranja)
- **Sucesso**: `#22C55E` (Verde)
- **Erro**: `#EF4444` (Vermelho)
- **Cards**: `#FFFFFF` (Branco)

## 🔑 Tipos de Usuário

### User (Participante)
- Visualizar eventos
- Inscrever-se em eventos
- Gerenciar suas inscrições
- Recuperar senha via email

### Organizer (Organizador)
- Todas as funcionalidades de Usuário
- Criar e gerenciar eventos
- Ver lista de participantes
- Acessar painel administrativo

### Admin (Administrador)
- Todas as funcionalidades de Organizador
- Gerenciar todos os usuários
- Gerenciar todos os eventos
- Enviar links de redefinição de senha
- Visualizar estatísticas do sistema
- Acesso completo ao painel administrativo

📖 **Para mais detalhes sobre o painel admin**, veja [ADMIN_PANEL.md](ADMIN_PANEL.md)


## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js 18+** – Ambiente de execução JavaScript
- **Express.js 4.18** – Framework web minimalista e robusto
- **PostgreSQL 14+** – Banco de dados relacional com suporte a JSON e queries avançadas
- **Sequelize ORM** – Mapeamento objeto-relacional para Node.js
- **pg / pg-hstore** – Driver PostgreSQL para Node.js
- **bcryptjs** – Criptografia segura de senhas (hash + salt)
- **JWT (jsonwebtoken)** – Autenticação stateless via tokens
- **Nodemailer** – Envio de emails transacionais (recuperação de senha)
- **Crypto (Node.js)** – Geração de tokens seguros com SHA256
- **Multer** – Middleware para upload de arquivos multimídia

### Frontend
- **HTML5** – Estrutura semântica das páginas
- **CSS3** – Estilização moderna com:
  - CSS Custom Properties (variáveis)
  - Flexbox e CSS Grid
  - Gradientes e Glassmorphism
  - Media Queries (responsividade)
- **JavaScript (ES6+)** – Programação modular com:
  - Fetch API para requisições
  - Async/Await
  - Event Delegation
  - Debouncing de inputs

### DevOps
- **Git** – Controle de versão
- **npm** – Gerenciador de pacotes


## 🔒 Segurança

- ✅ Senhas criptografadas com bcrypt (10 rounds)
- ✅ Tokens JWT com expiração configurável
- ✅ Tokens de reset SHA256 hasheados
- ✅ Tokens de uso único (invalidados após uso)
- ✅ Expiração de tokens de reset (1 hora)
- ✅ Validação de dados de entrada
- ✅ Proteção contra SQL Injection (Sequelize)
- ✅ Anti-enumeração de emails (não revela se email existe)
- ✅ CORS configurado
- ✅ Upload de arquivos validado
- ✅ Middleware de autenticação JWT
- ✅ Proteção de rotas administrativas

## 🧪 Testes

```bash
# Executar testes (quando implementados)
npm test
```

## � Configuração de Email

O EventFlow utiliza **Nodemailer** para envio de emails transacionais (recuperação de senha).

### Provedores Suportados
- ✅ **Gmail** - Recomendado para produção
- ✅ **Outlook/Hotmail** - Alternativa confiável
- ✅ **SendGrid** - Para alto volume de emails
- ✅ **Mailtrap** - Ideal para testes em desenvolvimento
- ✅ **AWS SES** - Para infraestrutura AWS

### Configuração Rápida (5 minutos)

1. **Edite o arquivo `.env`** com suas credenciais SMTP
2. **Para Gmail**, gere uma [Senha de App](https://myaccount.google.com/apppasswords)
3. **Reinicie o servidor** para carregar as configurações

📖 **Guia completo**: [CONFIGURAR_EMAIL.md](CONFIGURAR_EMAIL.md)  
🔧 **Troubleshooting**: [RECUPERACAO_SENHA.md](RECUPERACAO_SENHA.md)

## �📱 Responsividade

O EventFlow foi desenvolvido seguindo o conceito **mobile-first**, garantindo uma experiência perfeita em:
- 📱 Smartphones
- 💻 Tablets
- 🖥️ Desktops

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Desenvolvido por Endrio

## 📞 Suporte

Se você tiver alguma dúvida ou problema, por favor:
- Abra uma [issue](https://github.com/Endrio1/EventFlow/issues)
- Entre em contato: eventflow.company@gmail.com

## 🚀 Roadmap

### ✅ Concluído
- [x] Sistema de autenticação completo (JWT + bcrypt)
- [x] **Sistema de recuperação de senha via email**
- [x] **Envio de emails transacionais com Nodemailer**
- [x] **Painel administrativo completo**
- [x] **Gerenciamento de usuários (admin)**
- [x] **Administradores podem enviar links de reset**
- [x] CRUD de eventos com upload de imagens
- [x] Inscrições com validação de vagas e datas
- [x] Sistema de avaliações (feedbacks) com estrelas e comentários
- [x] Design system moderno com gradientes e glassmorphism
- [x] Busca e filtros por categoria na página de eventos abertos
- [x] Dashboard do organizador com menu dropdown

### 🚧 Em Desenvolvimento
- [ ] Rate limiting para endpoints de email
- [ ] Auditoria de ações administrativas
- [ ] Exportação de listas de participantes (CSV/PDF)

### 📅 Planejado
- [ ] Notificações por email para novos eventos
- [ ] Sistema de templates de email customizáveis
- [ ] Integração com APIs de pagamento (Stripe/Mercado Pago)
- [ ] Autenticação de dois fatores (2FA)


---

⭐ Se este projeto foi útil para você, considere dar uma estrela no GitHub!
EventFlow é um sistema de gerenciamento de eventos desenvolvido para o controle eficiente de informações.
