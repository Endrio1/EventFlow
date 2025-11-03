# 🎯 Solução: 1 Feedback por Usuário por Evento

## Problema
Como garantir que cada usuário possa deixar apenas 1 avaliação por evento?

## ✅ Solução Implementada

### 1. **Nível de Banco de Dados (CONSTRAINT UNIQUE)**
A melhor prática é garantir a unicidade no banco de dados usando uma constraint composta:

```sql
ALTER TABLE avaliacoes 
ADD CONSTRAINT unique_usuario_por_evento UNIQUE(evento_id, usuario_id);
```

**Vantagens:**
- ✅ Proteção absoluta contra duplicatas (mesmo em concorrência)
- ✅ Performance otimizada (índice único)
- ✅ Independe da implementação da aplicação
- ✅ Impede duplicatas mesmo que haja bugs no código

### 2. **Nível de Aplicação (Sequelize Model)**
Declaramos o índice único no model:

```javascript
{
  indexes: [
    {
      unique: true,
      fields: ['evento_id', 'usuario_id'],
      name: 'unique_usuario_por_evento'
    }
  ]
}
```

### 3. **Tratamento de Erro no Controller**
Capturamos a violação de constraint e retornamos mensagem amigável:

```javascript
catch (error) {
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ 
      success: false, 
      message: 'Você já avaliou este evento. Use a opção de editar para atualizar sua avaliação.' 
    });
  }
  next(error);
}
```

**HTTP 409 Conflict** é o status apropriado para violação de constraint única.

### 4. **UX no Frontend**
O frontend verifica se o usuário já avaliou e:
- **Se já avaliou:** Esconde o formulário de criar, mostra apenas botões de editar/excluir
- **Se não avaliou:** Mostra formulário completo para criar avaliação

```javascript
const userFeedback = currentUser ? feedbackList.find(f => f.usuario_id === currentUser.id) : null;

if (userFeedback) {
  form.style.display = 'none'; // Já avaliou
} else {
  form.style.display = 'block'; // Pode criar
}
```

## 📋 Como Aplicar

### Para tabelas novas:
Execute o script atualizado:
```bash
psql -U postgres -d eventflow -f scripts/add_feedback_table.sql
```

### Para tabelas existentes:
Execute a migration:
```bash
psql -U postgres -d eventflow -f scripts/add_unique_feedback_constraint.sql
```

### Se houver duplicatas existentes:
```sql
-- 1. Identificar duplicatas
SELECT evento_id, usuario_id, COUNT(*) 
FROM avaliacoes 
GROUP BY evento_id, usuario_id 
HAVING COUNT(*) > 1;

-- 2. Manter apenas a avaliação mais recente
DELETE FROM avaliacoes a
USING avaliacoes b
WHERE a.evento_id = b.evento_id 
  AND a.usuario_id = b.usuario_id 
  AND a.criado_em < b.criado_em;

-- 3. Agora aplicar a constraint
ALTER TABLE avaliacoes 
ADD CONSTRAINT unique_usuario_por_evento UNIQUE(evento_id, usuario_id);
```

## 🔍 Outras Abordagens (não recomendadas)

### ❌ Verificação apenas no backend
```javascript
const existing = await Feedback.findOne({ 
  where: { evento_id, usuario_id } 
});
if (existing) return res.status(409).json({...});
```
**Problemas:**
- Race condition em requisições simultâneas
- Mais lento (query extra)
- Não protege contra bugs

### ❌ Verificação apenas no frontend
```javascript
if (userAlreadyReviewed) {
  alert('Você já avaliou');
  return;
}
```
**Problemas:**
- Facilmente contornável (dev tools, API direta)
- Não protege a integridade dos dados
- Confia em estado do cliente

## ✨ Fluxo Completo

1. **Usuário tenta criar 2ª avaliação:**
   - Frontend detecta → Esconde formulário, mostra botão "Editar"
   
2. **Se burlar o frontend (API direta):**
   - Backend valida → Retorna erro 409
   
3. **Se ambos falharem (bug):**
   - Banco de dados rejeita → Constraint violation
   
4. **Usuário quer alterar avaliação:**
   - Clica em "Editar" → Formulário é populado
   - Submit chama `PUT /api/feedbacks/:id` em vez de `POST`

## 🎯 Resumo

✅ **Constraint no banco** = Camada final de proteção  
✅ **Validação no backend** = Mensagens amigáveis  
✅ **Verificação no frontend** = Melhor UX  

Essa combinação de 3 camadas garante:
- **Integridade de dados** (banco)
- **Segurança** (backend)
- **Experiência do usuário** (frontend)
