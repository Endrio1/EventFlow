#!/usr/bin/env node
/**
 * Script para corrigir índices de todas as coleções
 * Remove índices antigos com aliases e recria índices corretos
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixCollectionIndexes(collectionName, indexesToCreate) {
  const db = mongoose.connection.db;
  const collection = db.collection(collectionName);

  console.log(`\n========== ${collectionName.toUpperCase()} ==========`);
  console.log('Listando índices existentes...');
  const indexes = await collection.indexes();
  console.log('Índices atuais:', indexes.map(i => i.name).join(', '));

  // Dropar todos os índices exceto o _id
  console.log('\nRemovendo índices antigos...');
  for (const index of indexes) {
    if (index.name !== '_id_') {
      console.log(`  - Removendo: ${index.name}`);
      try {
        await collection.dropIndex(index.name);
      } catch (err) {
        console.log(`    Aviso: ${err.message}`);
      }
    }
  }

  // Criar índices corretos
  if (indexesToCreate && indexesToCreate.length > 0) {
    console.log('\nCriando índices corretos...');
    for (const idx of indexesToCreate) {
      console.log(`  - Criando: ${idx.name || JSON.stringify(idx.spec)}`);
      await collection.createIndex(idx.spec, idx.options || {});
    }
  }

  // Listar índices finais
  const newIndexes = await collection.indexes();
  console.log('\n✓ Índices após correção:', newIndexes.map(i => i.name).join(', '));
}

async function fixAllIndexes() {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Conectado ao MongoDB\n');

    // Corrigir inscrições (Enrollment)
    await fixCollectionIndexes('inscricoes', [
      {
        spec: { usuario_id: 1, evento_id: 1 },
        options: { unique: true, name: 'usuario_id_1_evento_id_1' }
      }
    ]);

    // Corrigir feedbacks (Feedback)
    await fixCollectionIndexes('avaliacoes', [
      {
        spec: { evento_id: 1, usuario_id: 1 },
        options: { unique: true, name: 'unique_usuario_por_evento' }
      }
    ]);

    // Corrigir usuários (User) - apenas garantir índice de email
    await fixCollectionIndexes('usuarios', [
      {
        spec: { email: 1 },
        options: { unique: true, name: 'email_1' }
      }
    ]);

    // Eventos não têm índices únicos além do _id, mas vamos limpar
    await fixCollectionIndexes('eventos', []);

    console.log('\n========================================');
    console.log('✓ Todos os índices foram corrigidos!');
    console.log('========================================\n');

    await mongoose.connection.close();
    console.log('✓ Conexão fechada');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Erro ao corrigir índices:', error);
    process.exit(1);
  }
}

fixAllIndexes();
