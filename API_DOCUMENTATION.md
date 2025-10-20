# 📚 Documentação da API - EventFlow

## Base URL
```
http://localhost:3000/api
```

## Autenticação

A maioria dos endpoints requer autenticação via JWT. Inclua o token no header:
```
Authorization: Bearer {seu_token_jwt}
```

---
```json
{
  "name": "string (obrigatório)",
  "email": "string (obrigatório, único)",
  "password": "string (obrigatório, mínimo 6 caracteres)",
  "role": "string (opcional: 'user' | 'organizer', padrão: 'user')"
}
```

**Resposta (201):**
```json
{
  "success": true,
  "message": "Usuário registrado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "name": "João Silva",
      "email": "joao@example.com",
      "role": "organizer",
      "avatar": null,
      "createdAt": "2025-01-01T00:00:00.000Z",
        "inscrições_atuais": 25,
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/login
Fazer login

**Body:**
```json
{
  "email": "string (obrigatório)",
  "password": "string (obrigatório)"
}
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "name": "João Silva",
      "email": "joao@example.com",
      "role": "organizer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### GET /auth/profile
Obter perfil do usuário autenticado

**Headers:** `Authorization: Bearer {token}`
    "inscrições_atuais": 25,
**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "organizer",
    "avatar": null,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### PUT /auth/profile
Atualizar perfil

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "name": "string (opcional)",
  "email": "string (opcional)"
}
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Perfil atualizado com sucesso",
  "data": {
    "id": 1,
    "name": "João Silva Atualizado",
    "email": "joao.novo@example.com",
    "role": "organizer"
  }
}
```

### PUT /auth/change-password
Alterar senha

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "currentPassword": "string (obrigatório)",
  "newPassword": "string (obrigatório, mínimo 6 caracteres)"
}
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Senha alterada com sucesso"
}
```

---

## 🎉 Eventos

### GET /events
Listar eventos (público)

      "inscrições_atuais": 25
- `page` (number, padrão: 1) - Página atual
- `limit` (number, padrão: 10) - Itens por página
- `category` (string) - Filtrar por categoria
- `search` (string) - Buscar no título/descrição/local
- `status` (string, padrão: 'active') - 'active' | 'cancelled' | 'completed'
- `sortBy` (string, padrão: 'date') - Campo para ordenação
- `order` (string, padrão: 'ASC') - 'ASC' | 'DESC'

**Exemplo:**
```
GET /events?page=1&limit=10&category=tecnologia&search=workshop&status=active
```

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 1,
        "title": "Workshop de Node.js",
        "description": "Aprenda Node.js do zero",
        "category": "tecnologia",
        "image": "/uploads/events/event-123456.jpg",
        "location": "São Paulo, SP",
        "date": "2025-12-01T00:00:00.000Z",
        "time": "19:00",
        "capacity": 50,
        "current_enrollments": 25,
        "status": "active",
        "organizer_id": 1,
        "organizer": {
          "id": 1,
          "name": "João Silva",
          "email": "joao@example.com"
        },
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "totalPages": 10,
      "limit": 10
    }
  }
}
```

### GET /events/:id
Obter evento específico (público)

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Workshop de Node.js",
    "description": "Aprenda Node.js do zero",
    "category": "tecnologia",
    "image": "/uploads/events/event-123456.jpg",
    "location": "São Paulo, SP",
    "date": "2025-12-01T00:00:00.000Z",
    "time": "19:00",
    "capacity": 50,
    "current_enrollments": 25,
    "status": "active",
    "organizer_id": 1,
    "organizer": {
      "id": 1,
      "name": "João Silva",
      "email": "joao@example.com"
    },
    "participants": [
      {
        "id": 2,
        "name": "Maria Santos",
        "email": "maria@example.com",
        "Enrollment": {
          "status": "confirmed",
          "enrollment_date": "2025-01-01T00:00:00.000Z"
        }
      }
    ]
  }
}
```

### POST /events
Criar evento (apenas organizadores e admins)

**Headers:** 
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Body (FormData):**
- `title` (string, obrigatório) - Título do evento
- `description` (string, obrigatório) - Descrição
- `category` (string, obrigatório) - Categoria
- `location` (string, obrigatório) - Local
- `date` (string, obrigatório) - Data (YYYY-MM-DD)
- `time` (string, obrigatório) - Horário (HH:MM)
- `capacity` (number, obrigatório) - Capacidade
- `image` (file, opcional) - Imagem (JPG, PNG, WebP, máx 5MB)

**Resposta (201):**
```json
{
  "success": true,
  "message": "Evento criado com sucesso",
  "data": {
    "id": 1,
    "title": "Workshop de Node.js",
    "description": "Aprenda Node.js do zero",
    "category": "tecnologia",
    "image": "/uploads/events/event-123456.jpg",
    "location": "São Paulo, SP",
    "date": "2025-12-01T00:00:00.000Z",
    "time": "19:00",
    "capacity": 50,
    "current_enrollments": 0,
    "status": "active",
    "organizer_id": 1
  }
}
```

### PUT /events/:id
Atualizar evento (apenas organizador do evento ou admin)

**Headers:** 
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Body (FormData):** Mesmos campos do POST (todos opcionais)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Evento atualizado com sucesso",
  "data": {
    "id": 1,
    "title": "Workshop de Node.js - Avançado",
    "description": "Aprenda Node.js avançado",
    ...
  }
}
```

### DELETE /events/:id
Deletar evento (apenas organizador do evento ou admin)

**Headers:** `Authorization: Bearer {token}`

**Resposta (200):**
```json
{
  "success": true,
  "message": "Evento deletado com sucesso"
}
```

### GET /events/organizer/my-events
Listar eventos criados pelo organizador

**Headers:** `Authorization: Bearer {token}`

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Workshop de Node.js",
      "description": "Aprenda Node.js do zero",
      "category": "tecnologia",
      "participants": [
        {
          "id": 2,
          "name": "Maria Santos",
          "email": "maria@example.com",
          "Enrollment": {
            "status": "confirmed",
            "enrollment_date": "2025-01-01T00:00:00.000Z"
          }
        }
      ]
    }
  ]
}
```

---

## 📝 Inscrições

### POST /enrollments/events/:eventId/enroll
Inscrever-se em um evento

**Headers:** `Authorization: Bearer {token}`

**Resposta (201):**
```json
{
  "success": true,
  "message": "Inscrição realizada com sucesso",
  "data": {
    "id": 1,
    "user_id": 2,
    "event_id": 1,
    "status": "confirmed",
    "enrollment_date": "2025-01-01T00:00:00.000Z"
  }
}
```

**Erros possíveis:**
- 400 - Evento não está mais disponível
- 400 - Já está inscrito
- 400 - Capacidade máxima atingida
- 404 - Evento não encontrado

### DELETE /enrollments/events/:eventId/cancel
Cancelar inscrição

**Headers:** `Authorization: Bearer {token}`

**Resposta (200):**
```json
{
  "success": true,
  "message": "Inscrição cancelada com sucesso"
}
```

### GET /enrollments/my-enrollments
Listar inscrições do usuário

**Headers:** `Authorization: Bearer {token}`

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "event_id": 1,
      "status": "confirmed",
      "enrollment_date": "2025-01-01T00:00:00.000Z",
      "event": {
        "id": 1,
        "title": "Workshop de Node.js",
        "description": "Aprenda Node.js do zero",
        "category": "tecnologia",
        "date": "2025-12-01T00:00:00.000Z",
        "time": "19:00",
        "location": "São Paulo, SP",
        "organizer": {
          "id": 1,
          "name": "João Silva",
          "email": "joao@example.com"
        }
      }
    }
  ]
}
```

### GET /enrollments/events/:eventId/participants
Listar participantes do evento (apenas organizador do evento ou admin)

**Headers:** `Authorization: Bearer {token}`

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": 1,
      "title": "Workshop de Node.js",
      "capacity": 50,
      "current_enrollments": 25
    },
    "enrollments": [
      {
        "id": 1,
        "user_id": 2,
        "event_id": 1,
        "status": "confirmed",
        "enrollment_date": "2025-01-01T00:00:00.000Z",
        "user": {
          "id": 2,
          "name": "Maria Santos",
          "email": "maria@example.com"
        }
      }
    ]
  }
}
```

---

## ⚠️ Códigos de Erro

- **200** - Sucesso
- **201** - Criado com sucesso
- **400** - Requisição inválida
- **401** - Não autenticado
- **403** - Sem permissão
- **404** - Não encontrado
- **500** - Erro interno do servidor

## 📋 Formato de Erro

```json
{
  "success": false,
  "message": "Mensagem de erro",
  "errors": ["Detalhes do erro"] // opcional
}
```

## 💡 Dicas

1. **Paginação**: Use sempre `page` e `limit` para listar eventos
2. **Filtros**: Combine múltiplos filtros para busca precisa
3. **Token**: Armazene o token de forma segura no cliente
4. **Upload**: Limite de 5MB para imagens
5. **Datas**: Use formato ISO para datas (YYYY-MM-DD)
6. **Horários**: Use formato 24h (HH:MM)

## 🔧 Rate Limiting

Atualmente não há rate limiting implementado, mas é recomendado:
- Máximo 100 requisições por minuto por IP
- Máximo 1000 requisições por hora por usuário

## 📞 Suporte

Para dúvidas sobre a API:
- Email: api@eventflow.com
- GitHub Issues: https://github.com/Endrio1/EventFlow/issues
