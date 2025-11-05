# 🎉 EventFlow — Migração para MongoDB

Este repositório contém o EventFlow, um sistema de gerenciamento de eventos. O projeto foi migrado de um banco relacional (MySQL + Sequelize) para MongoDB usando Mongoose. Este README descreve as mudanças, como configurar a aplicação com MongoDB e notas importantes sobre a migração.

## O que mudou

- Banco de dados: MySQL → MongoDB (via Mongoose).
- Modelos agora são Schemas Mongoose em `src/models/*.js` (ex.: `User`, `Event`, `Enrollment`, `Feedback`).
- Arquivo de conexão: `src/config/mongo.js` (lê `MONGODB_URI` do `.env`).
- Relações entre entidades são tratadas por referências ObjectId (`ref`) em vez de chaves estrangeiras SQL.
- Índices e unicidade configurados nos schemas (ex.: índice único em `Enrollment` para `user_id` + `event_id`).
- Removido código/arquivos específicos do Sequelize (se presentes) e substituídos por operações Mongoose.

## Por que migramos para MongoDB

- Mais flexibilidade no esquema dos documentos (ideal para campos opcionais e iterações rápidas).
- Menor complexidade para armazenar coleções com relacionamentos simples via referências.
- Desenvolvimento mais ágil para o protótipo e para features que não exigem joins complexos.

## Estrutura de dados (resumo)

- `User` (`collection: usuarios`) — campos principais: name, email (unique), password (hash), role, avatar.
- `Event` (`collection: eventos`) — title, description, category, image, location, date, time, capacity, current_enrollments, organizer_id (ObjectId ref `User`).
- `Enrollment` (`collection: inscricoes`) — user_id (ref `User`), event_id (ref `Event`), status, enrollment_date. Índice único em { user_id, event_id }.
- `Feedback` (`collection: avaliacoes`) — evento_id (ref `Event`), usuario_id (ref `User`), nota, comentario. Índice único em { evento_id, usuario_id }.

Os schemas estão em `src/models` e são exportados via `src/models/index.js`.

## Configuração rápida

1. Instale as dependências

```bash
npm install
```

2. Variáveis de ambiente

Crie um arquivo `.env` na raiz com (exemplo):

```env
# URL de conexão para MongoDB
MONGODB_URI=mongodb://localhost:27017/eventflow

# JWT - obrigatório
JWT_SECRET=seu_secret_aqui

PORT=3000
NODE_ENV=development
```

3. Inicie o servidor

```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

O servidor faz a conexão com o MongoDB chamando `src/config/mongo.js` antes de iniciar (veja `src/server.js`).

## Migração de dados (orientações)

Se você precisa migrar dados de um banco MySQL existente para o MongoDB:

1. Exporte os dados do MySQL (CSV/JSON) por tabela.
2. Transforme os registros para o formato esperado pelos schemas Mongoose:
	- Converta ids relacionais para ObjectId (ou gere novos ObjectId e atualize referências).
	- Ajuste nomes de campos se necessário (ex.: `organizer_id` como ObjectId).
3. Use `mongoimport` ou scripts Node.js com Mongoose para inserir os documentos nas coleções.

Exemplo com `mongoimport` (CSV → JSON convertido):

```bash
# Exemplo: importar evento.json para a collection 'eventos'
mongoimport --uri "$MONGODB_URI" --collection eventos --file evento.json --jsonArray
```

Observação: para relacionamentos, normalmente é mais seguro usar um script Node.js que leia dados, crie documentos e mantenha as referências ObjectId corretamente.

## Observações técnicas importantes

- Índices: os schemas já definem índices essenciais (p.ex. unicidade em inscrições/avaliacoes). Certifique-se de reconstruir índices ao importar dados.
- Transações: se precisar de operações transacionais entre múltiplas coleções, utilize sessões do Mongoose com replica set (MongoDB precisa estar em replica set para suportar transações distribuídas).
- Validação: a maior parte da validação de dados passou a ser realizada pelos Schemas do Mongoose. Continue validando entradas na camada de rota/controlador.
- Segurança: mantenha o `JWT_SECRET` seguro e não commitá-lo no repositório.

## Dependências principais (relacionadas ao DB)

- `mongoose` — client ODM para MongoDB
- `dotenv` — carregamento de variáveis de ambiente

Ver `package.json` para a lista completa de dependências.

## Como testar localmente

1. Inicie um MongoDB local (ex.: `mongod --dbpath ./data` ou use Docker):

```bash
# Com Docker
docker run --name eventflow-mongo -p 27017:27017 -d mongo:7
```

2. Defina `MONGODB_URI` para apontar para o banco local (padrão: `mongodb://localhost:27017/eventflow`).
3. Rode `npm run dev` e acesse a API e o frontend.

## Compatibilidade e notas finais

- Se você mantiver backups do banco SQL antigo, guarde-os até validar que todos os dados foram migrados corretamente.
- Algumas consultas complexas baseadas em JOINs podem precisar ser reescritas usando agregações do MongoDB ou modelos denormalizados.
- Os endpoints da API e a interface do front-end foram adaptados para funcionar com os schemas Mongoose; verifique controladores em `src/controllers` caso precise ajustar comportamento específico.

---

Se quiser que eu inclua um exemplo de script Node.js para migrar dados (ex.: migrar usuários e manter referências), posso criar um script de exemplo e instruções passo a passo.

---

© Endrio — EventFlow

