# 🎉 EventFlow - Sistema de Gerenciamento de Eventos

EventFlow é uma plataforma completa para gerenciamento de eventos que permite organizadores criarem e gerenciarem eventos, enquanto usuários podem facilmente descobrir e se inscrever em eventos de seu interesse.

![EventFlow](https://img.shields.io/badge/Status-Completo-success)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4.18-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)

## ✨ Funcionalidades

### Para Usuários
- 🔐 **Autenticação segura** com JWT
- 🔍 **Busca e filtros** avançados de eventos
- ✅ **Inscrição fácil** em eventos
- 📋 **Acompanhamento** de inscrições
- 📱 **Interface responsiva** mobile-first

### Para Organizadores
- ➕ **Criar e editar** eventos facilmente
- 🖼️ **Upload de imagens** dos eventos
- 👥 **Gerenciar participantes** e lista de inscritos
- 📊 **Painel administrativo** com estatísticas
- 🎯 **Controle de capacidade** automático

### Recursos Técnicos
- 🛡️ **API RESTful** completa
- 🔒 **Autenticação JWT** segura
- 📸 **Upload de imagens** com Multer
- 🗄️ **MySQL com Sequelize ORM**
- 🎨 **Design moderno** com CSS customizado
- ⚡ **Performance otimizada**

## 🚀 Começando

### Pré-requisitos

- Node.js 18+ 
- MySQL 8.0+
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

3. **Configure o banco de dados**

Crie um banco de dados MySQL:
```sql
CREATE DATABASE eventflow;
```

4. **Configure as variáveis de ambiente**

Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=eventflow
DB_USER=root
DB_PASSWORD=sua_senha

JWT_SECRET=seu_secret_super_secreto_aqui
JWT_EXPIRES_IN=7d

MAX_FILE_SIZE=5242880
UPLOAD_PATH=./public/uploads/events
```

5. **Inicie o servidor**
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
│   │   ├── database.js      # Configuração do Sequelize
│   │   └── multer.js         # Configuração de upload
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── eventController.js
│   │   └── enrollmentController.js
│   ├── middlewares/
│   │   ├── auth.js           # Autenticação JWT
│   │   └── errorHandler.js  # Tratamento de erros
│   ├── models/
│   │   ├── User.js
│   │   ├── Event.js
│   │   ├── Enrollment.js
│   │   └── index.js          # Associações
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── enrollmentRoutes.js
│   │   └── index.js
│   └── server.js             # Servidor Express
├── public/
│   ├── css/
│   │   ├── style.css
│   │   └── dashboard.css
│   ├── js/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── events.js
│   │   ├── main.js
│   │   └── dashboard.js
│   ├── index.html
│   └── dashboard.html
├── .env.example
├── .gitignore
├── package.json
├── LICENSE
└── README.md
```

## 🎨 Paleta de Cores

- **Primária (Azul petróleo)**: `#1E40AF`
- **Secundária (Cinza azulado)**: `#64748B`
- **Fundo (Branco gelo)**: `#F1F5F9`
- **Texto principal (Preto suave)**: `#0F172A`
- **Destaques (Laranja suave)**: `#F97316`
- **Sucesso (Verde suave)**: `#22C55E`
- **Erro/Alerta (Vermelho coral)**: `#EF4444`

## 📡 API Endpoints

### Autenticação
```
POST   /api/auth/register      # Registrar usuário
POST   /api/auth/login         # Fazer login
GET    /api/auth/profile       # Obter perfil (autenticado)
PUT    /api/auth/profile       # Atualizar perfil (autenticado)
PUT    /api/auth/change-password  # Alterar senha (autenticado)
```

### Eventos
```
GET    /api/events             # Listar eventos (público)
GET    /api/events/:id         # Obter evento específico (público)
POST   /api/events             # Criar evento (organizador)
PUT    /api/events/:id         # Atualizar evento (organizador)
DELETE /api/events/:id         # Deletar evento (organizador)
GET    /api/events/organizer/my-events  # Meus eventos (organizador)
```

### Inscrições
```
POST   /api/enrollments/events/:eventId/enroll       # Inscrever-se
DELETE /api/enrollments/events/:eventId/cancel       # Cancelar inscrição
GET    /api/enrollments/my-enrollments               # Minhas inscrições
GET    /api/enrollments/events/:eventId/participants # Ver participantes (organizador)
```

## 🔑 Tipos de Usuário

### User (Participante)
- Visualizar eventos
- Inscrever-se em eventos
- Gerenciar suas inscrições

### Organizer (Organizador)
- Todas as funcionalidades de User
- Criar e gerenciar eventos
- Ver lista de participantes
- Acessar painel administrativo

### Admin (Administrador)
- Todas as funcionalidades de Organizer
- Gerenciar todos os eventos
- Acesso completo ao sistema

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Sequelize** - ORM para MySQL
- **MySQL** - Banco de dados relacional
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Multer** - Upload de arquivos
- **express-validator** - Validação de dados

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilização
- **JavaScript (Vanilla)** - Interatividade
- **Fetch API** - Comunicação com backend

## 📝 Exemplos de Uso

### Registrar um usuário
```javascript
POST /api/auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "role": "organizer"
}
```

### Criar um evento
```javascript
POST /api/events
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "title": "Workshop de Node.js",
  "description": "Aprenda Node.js do zero",
  "category": "tecnologia",
  "location": "São Paulo, SP",
  "date": "2025-12-01",
  "time": "19:00",
  "capacity": 50,
  "image": [arquivo]
}
```

### Inscrever-se em um evento
```javascript
POST /api/enrollments/events/1/enroll
Authorization: Bearer {token}
```

## 🔒 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Tokens JWT com expiração
- ✅ Validação de dados de entrada
- ✅ Proteção contra SQL Injection (Sequelize)
- ✅ CORS configurado
- ✅ Upload de arquivos validado

## 🧪 Testes

```bash
# Executar testes (quando implementados)
npm test
```

## 📱 Responsividade

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

Desenvolvido com ❤️ por Endrio

## 📞 Suporte

Se você tiver alguma dúvida ou problema, por favor:
- Abra uma [issue](https://github.com/Endrio1/EventFlow/issues)
- Entre em contato: contato@eventflow.com

## 🎯 Roadmap Futuro

- [ ] Sistema de notificações por email
- [ ] Integração com calendário
- [ ] Sistema de avaliações de eventos
- [ ] Chat entre participantes
- [ ] Geração de certificados
- [ ] Integração com pagamentos
- [ ] App mobile nativo
- [ ] Sistema de recomendações

---

⭐ Se este projeto foi útil para você, considere dar uma estrela no GitHub!
EventFlow é um sistema de gerenciamento de eventos desenvolvido para o controle eficiente de informações.
