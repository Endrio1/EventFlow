#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import model directly to avoid index resolution issues
const User = require('../src/models/User');

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('ERRO: defina MONGODB_URI no arquivo .env antes de executar este script.');
    process.exit(1);
  }

  const email = process.argv[2];
  const password = process.argv[3] || 'ChangeMe123!';

  if (!email) {
    console.error('Uso: node scripts/createAdmin.js <email> [password]');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    let user = await User.findOne({ email });
    if (!user) {
      const hash = await bcrypt.hash(password, 10);
      user = new User({ nome: 'Admin', email, senha: hash, papel: 'admin' });
      await user.save();
      console.log(`Usuário admin criado: ${user._id} (${email})`);
    } else {
      user.papel = 'admin';
      // opcional: atualizar senha
      // user.senha = await bcrypt.hash(password, 10);
      await user.save();
      console.log(`Usuário existente promovido a admin: ${user._id} (${email})`);
    }
  } catch (err) {
    console.error('Erro ao criar/promover admin:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
