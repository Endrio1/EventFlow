# 🛡️ Painel de Administração - EventFlow

## Visão Geral

O Painel de Administração permite que administradores gerenciem usuários, eventos e realizem ações administrativas avançadas no sistema EventFlow.

---

## 🚀 Acesso

**URL:** http://localhost:3000/admin.html

**Credenciais:** Apenas usuários com `role: "admin"`

---

## ✨ Funcionalidades

### 👥 Gerenciamento de Usuários

#### **1. Listar Usuários**
- Visualiza todos os usuários cadastrados
- Exibe: ID, Nome, Email, Tipo de conta (badge colorido)
- Badges:
  - 🟡 **Amarelo** - Administrador
  - 🔵 **Azul** - Organizador
  - 🟢 **Verde** - Participante

#### **2. Buscar Usuários**
- Busca por: ID, nome ou email
- Busca em tempo real (debounce de 300ms)
- Atualização automática dos resultados

#### **3. Ver Detalhes do Usuário**
Ao clicar no botão **"Ver"**, exibe:
- ID do usuário
- Nome completo
- Email
- Tipo de conta
- Data de cadastro

**✨ Nova funcionalidade:** Botão para enviar link de redefinição de senha

#### **4. Enviar Link de Redefinição de Senha** 🆕
- Botão: **"🔑 Enviar Link de Redefinição de Senha"**
- Permite que o admin envie email de recuperação para qualquer usuário
- Útil para:
  - Usuários que esqueceram a senha
  - Reset de senha por questões de segurança
  - Onboarding de novos usuários
- Confirmação antes de enviar
- Feedback visual de sucesso/erro

#### **5. Deletar Usuário**
- Botão vermelho "Deletar"
- Confirmação obrigatória
- Ação irreversível (exclui inscrições e dados relacionados)

---

### 🎉 Gerenciamento de Eventos

#### **1. Listar Eventos**
- Visualiza todos os eventos (ativos, cancelados, completos)
- Exibe: ID, Título, Local, Data, Capacidade, Status
- Status com badges coloridos

#### **2. Buscar Eventos**
- Busca por: Título, local, descrição
- Busca em tempo real (debounce de 300ms)
- Sem filtro de status (mostra todos)

#### **3. Ver Inscrições do Evento**
Ao clicar no botão **"Inscrições"**, exibe:
- Lista de participantes inscritos
- Nome e email de cada participante
- Status da inscrição (badge)
- Data de inscrição

#### **4. Deletar Evento**
- Botão vermelho "Deletar"
- Confirmação obrigatória
- Ação irreversível (exclui inscrições relacionadas)

---

## 🎨 Interface

### **Design Moderno**
- Gradiente roxo no header (#667eea → #764ba2 → #f093fb)
- Layout em grid (2 colunas)
- Cards com glassmorphism
- Tabelas responsivas
- Modal centralizado

### **Badges de Status**
- **Admin:** Fundo amarelo (#fbbf24)
- **Organizador:** Fundo azul (#3b82f6)
- **Participante:** Fundo verde (#22c55e)

### **Botões de Ação**
- **Ver:** Azul - Visualizar detalhes
- **Inscrições:** Verde - Ver participantes
- **Deletar:** Vermelho - Excluir registro

---

## 🔐 Segurança

### **Autenticação**
- Requer token JWT válido
- Token armazenado em `localStorage`
- Middleware backend: `authMiddleware` + `checkRole('admin')`

### **Autorização**
- Apenas usuários com `role: "admin"` podem acessar
- Rotas protegidas no backend (`/api/admin/*`)
- Redirecionamento automático se não autorizado

### **Proteções Implementadas**
- ✅ Confirmação antes de deletar
- ✅ Validação de role no backend
- ✅ Tokens com expiração (7 dias padrão)
- ✅ Sanitização de HTML (escape de caracteres especiais)
- ✅ Rate limiting recomendado (implementar em produção)

---

## 📡 Endpoints da API

### **Usuários**

```http
GET /api/admin/users?search=termo
```
Lista/busca usuários por ID, nome ou email

```http
GET /api/admin/users/:id
```
Busca usuário específico por ID

```http
DELETE /api/admin/users/:id
```
Deleta usuário (com proteção: admin não pode deletar a si mesmo)

### **Eventos**

```http
DELETE /api/admin/events/:id
```
Deleta evento

### **Inscrições**

```http
GET /api/enrollments/events/:eventId/participants
```
Lista participantes de um evento

### **Recuperação de Senha** 🆕

```http
POST /api/auth/forgot-password
```
Envia email de recuperação de senha
```json
{
  "email": "usuario@exemplo.com"
}
```

---

## 🧪 Como Usar

### **1. Criar Usuário Admin**

**Opção 1: Via API**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Principal",
    "email": "admin@eventflow.com",
    "password": "senha-segura-123",
    "role": "admin"
  }'
```

**Opção 2: Direto no Banco**
```sql
INSERT INTO usuarios (nome, email, senha, papel) 
VALUES ('Admin', 'admin@admin.com', '$2a$10$hashedpassword...', 'admin');
```

### **2. Fazer Login**

1. Acesse: http://localhost:3000
2. Clique em **"Entrar"**
3. Digite suas credenciais de admin
4. Após login, acesse: http://localhost:3000/admin.html

### **3. Gerenciar Usuários**

#### **Buscar Usuário**
1. Digite no campo de busca de usuários
2. Resultados aparecem em tempo real

#### **Ver Detalhes e Enviar Reset de Senha** 🆕
1. Clique no botão **"Ver"** do usuário
2. Modal mostra todas as informações
3. Para enviar reset de senha:
   - Clique em **"🔑 Enviar Link de Redefinição de Senha"**
   - Confirme o envio
   - Usuário receberá email com link válido por 1 hora
   - ✅ Confirmação de envio aparece na tela

#### **Deletar Usuário**
1. Clique no botão **"Deletar"** (vermelho)
2. Confirme a ação
3. Usuário e seus dados são removidos

### **4. Gerenciar Eventos**

#### **Ver Inscrições**
1. Clique no botão **"Inscrições"** do evento
2. Modal mostra lista de participantes
3. Veja nome, email, status e data

#### **Deletar Evento**
1. Clique no botão **"Deletar"** (vermelho)
2. Confirme a ação
3. Evento e inscrições são removidos

---

## 💡 Casos de Uso Comuns

### **Caso 1: Usuário Esqueceu a Senha**

**Antes:** Usuário ligava/enviava email pedindo ajuda

**Agora:**
1. Admin acessa painel
2. Busca o usuário pelo email
3. Clica em **"Ver"**
4. Clica em **"🔑 Enviar Link de Redefinição"**
5. Usuário recebe email e redefine sozinho

**Tempo:** ~30 segundos ⚡

---

### **Caso 2: Onboarding de Novo Usuário**

**Fluxo:**
1. Admin cria conta do usuário via API ou banco
2. Admin acessa painel e busca o novo usuário
3. Admin clica em "Ver" e envia link de redefinição
4. Novo usuário recebe email e define sua própria senha

**Benefício:** Seguro (admin não conhece a senha do usuário)

---

### **Caso 3: Auditoria de Usuários**

**Fluxo:**
1. Admin acessa painel
2. Visualiza lista completa de usuários
3. Filtra por tipo (badges coloridos ajudam)
4. Clica em "Ver" para verificar detalhes
5. Remove usuários inativos/suspeitos

---

### **Caso 4: Reset de Senha por Segurança**

**Quando usar:**
- Suspeita de conta comprometida
- Usuário reporta atividade estranha
- Política de renovação de senhas

**Fluxo:**
1. Admin envia link de reset
2. Senha antiga é invalidada após redefinição
3. Usuário é notificado por email

---

## 🐛 Troubleshooting

### **Não consigo acessar o painel**
- ✅ Verifique se está logado como admin
- ✅ Confirme que `role: "admin"` no banco
- ✅ Limpe o localStorage e faça login novamente

### **Email de reset não está sendo enviado**
- ✅ Verifique configurações SMTP no `.env`
- ✅ Veja logs do servidor para erros
- ✅ Teste com Mailtrap primeiro
- ✅ Consulte: `CONFIGURAR_EMAIL.md`

### **"Usuário não encontrado" ao clicar em Ver**
- ✅ Recarregue a página
- ✅ Verifique se servidor está rodando
- ✅ Confirme que colunas de reset existem no banco

### **Botão de enviar reset não aparece**
- ✅ Limpe o cache do navegador (Ctrl+Shift+R)
- ✅ Verifique se arquivo `admin.js` foi atualizado
- ✅ Confirme que está usando a versão mais recente

---

## 📊 Estatísticas

### **Ações Administrativas**

| Ação | Confirmação | Reversível | Impacto |
|------|-------------|------------|---------|
| Ver detalhes | Não | N/A | Nenhum |
| Buscar | Não | N/A | Nenhum |
| Enviar reset senha 🆕 | Sim | Não* | Baixo |
| Deletar usuário | Sim | Não | Alto |
| Deletar evento | Sim | Não | Alto |

*O link expira em 1 hora e pode ser enviado novamente

---

## 🔒 Melhores Práticas

### **Segurança**

1. ✅ Nunca compartilhe credenciais de admin
2. ✅ Use senhas fortes e únicas
3. ✅ Ative 2FA quando disponível (futuro)
4. ✅ Monitore logs de ações administrativas
5. ✅ Revogue acesso de admins inativos

### **Uso do Reset de Senha**

1. ✅ Sempre confirme a identidade do usuário
2. ✅ Documente motivo do reset (se política da empresa)
3. ✅ Notifique usuário antes de enviar (se possível)
4. ✅ Não envie múltiplos resets desnecessários
5. ✅ Use apenas quando usuário não consegue sozinho

### **Gestão de Usuários**

1. ✅ Remova usuários duplicados periodicamente
2. ✅ Audite tipos de conta (admin/organizer/user)
3. ✅ Verifique usuários sem atividade
4. ✅ Confirme eventos antes de deletar (inscrições ativas?)
5. ✅ Faça backup antes de deleções em massa

---

## 🎯 Roadmap (Futuras Melhorias)

- [ ] Log de ações administrativas
- [ ] Exportar lista de usuários (CSV/Excel)
- [ ] Editar informações do usuário
- [ ] Estatísticas e gráficos
- [ ] Filtros avançados (data de cadastro, tipo de conta)
- [ ] Ações em lote (deletar múltiplos)
- [ ] Sistema de permissões granulares
- [ ] Notificações em tempo real
- [ ] Histórico de resets de senha
- [ ] Bloqueio/desbloqueio de contas

---

## 📚 Documentação Relacionada

- **`RECUPERACAO_SENHA.md`** - Sistema de recuperação completo
- **`CONFIGURAR_EMAIL.md`** - Guia rápido de configuração SMTP
- **`API_DOCUMENTATION.md`** - Documentação das APIs
- **`.env.example`** - Template de configuração

---

## 🆘 Suporte

Problemas ou dúvidas?

1. Consulte a documentação específica
2. Verifique os logs do servidor
3. Teste em ambiente de desenvolvimento primeiro
4. Reporte bugs com detalhes (logs, screenshots)

---

**Desenvolvido para EventFlow** 🎉  
Sistema de Gerenciamento de Eventos
