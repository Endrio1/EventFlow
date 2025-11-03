require('dotenv').config();
const mongoose = require('mongoose');

const connectMongo = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventflow';
  try {
    await mongoose.connect(uri, {
      // opções recomendadas
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Conexão com MongoDB estabelecida com sucesso.');
  } catch (err) {
    console.error('✗ Erro ao conectar ao MongoDB:', err);
    throw err;
  }
};

module.exports = connectMongo;
