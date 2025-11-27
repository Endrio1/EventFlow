# 🎉 EventFlow - Sistema de Gerenciamento de Eventos

<div align="center">

### 🌐 **[Acesse o Sistema](https://eventflow-production-f2f4.up.railway.app/)**

![EventFlow](https://img.shields.io/badge/Status-Online-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4.18-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue)

</div>

Plataforma completa para criar, gerenciar e participar de eventos. Organizadores podem criar eventos com upload de imagens, gerenciar participantes e controlar inscrições. Usuários podem descobrir eventos, se inscrever e avaliar suas experiências.

## ✨ Principais Funcionalidades

- 🔐 **Autenticação JWT** com recuperação de senha via email
- 📅 **CRUD de Eventos** com upload de imagens e controle de vagas
- 👥 **Gerenciamento de Participantes** e inscrições
- ⭐ **Sistema de Avaliações** com notas e comentários
- 👨‍💼 **Painel Administrativo** completo
- 📱 **Interface Responsiva** mobile-first

## 🚀 Começando

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Endrio1/EventFlow.git
cd EventFlow

# Instale as dependências
npm install

# Configure o banco de dados
psql -U seu_usuario -d eventflow -f scripts/init_db.sql

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Inicie o servidor
npm run dev
```

### Variáveis de Ambiente

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/eventflow
JWT_SECRET=sua_chave_secreta
JWT_EXPIRES_IN=7d

# Para recuperação de senha (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app
BASE_URL=http://localhost:3000
```

## 📁 Estrutura do Projeto

```
EventFlow/
├── src/
│   ├── config/        # Configurações (banco, upload)
│   ├── controllers/   # Lógica de negócio
│   ├── middlewares/   # Autenticação e validação
│   ├── models/        # Modelos Sequelize
│   ├── routes/        # Rotas da API
│   ├── services/      # Serviços (email)
│   └── server.js      # Servidor Express
├── public/
│   ├── css/           # Estilos
│   ├── js/            # Scripts frontend
│   └── *.html         # Páginas
└── scripts/
    └── init_db.sql    # Inicialização do banco
```

## 🔑 Tipos de Usuário

| Papel | Permissões |
|-------|------------|
| **Participante** | Visualizar eventos, inscrever-se, avaliar |
| **Organizador** | + Criar eventos, gerenciar participantes |
| **Admin** | + Gerenciar usuários, estatísticas do sistema |

## 🛠️ Tecnologias

**Backend:** Node.js, Express, PostgreSQL, Sequelize, JWT, Nodemailer, Multer

**Frontend:** HTML5, CSS3 (Glassmorphism), JavaScript ES6+

## 🔒 Segurança

- Senhas criptografadas com bcrypt
- Tokens JWT com expiração
- Proteção contra SQL Injection
- Validação de uploads
- CORS configurado

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

Desenvolvido por **Endrio**

📧 Contato: eventflow.company@gmail.com

---

⭐ Se este projeto foi útil, considere dar uma estrela no GitHub!
