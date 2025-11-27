require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { syncDatabase } = require('./models');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const initializeDatabase = require('./config/initDatabase');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API
app.use('/api', routes);

// Rota para servir o frontend
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Inicializar servidor
const startServer = async () => {
  try {
    // Inicializa o banco de dados (cria tabelas e admin se necessário)
    const dbReady = await initializeDatabase();
    
    if (!dbReady) {
      console.warn('⚠️ Servidor iniciando com problemas no banco de dados');
    }
    
    // Sincronizar banco de dados
    await syncDatabase();
    
    // Iniciar servidor
    app.listen(PORT, HOST, () => {
      console.log(`\n🚀 Servidor EventFlow rodando em http://${HOST}:${PORT}`);
      console.log(`📍 API: http://localhost:${PORT}/api`);
      console.log(`🌐 Frontend: http://localhost:${PORT}`);
      console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
