const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  const sequelize = require('./database');
  
  try {
    // Testa a conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida');
    
    // Importa os modelos
    const { User, Event, Enrollment, Endereco, Feedback } = require('../models');
    
    // Sincroniza os modelos (cria tabelas se não existirem)
    await sequelize.sync({ alter: false });
    console.log('✅ Tabelas sincronizadas');
    
    // Verifica se precisa criar usuário admin padrão
    const adminExists = await User.findOne({ where: { email: 'admin@eventflow.com' } });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await User.create({
        name: 'Administrador',
        email: 'admin@eventflow.com',
        password: hashedPassword,
        role: 'admin',
        cpf: '00000000000',
        phone: '00000000000'
      });
      console.log('✅ Usuário admin criado (admin@eventflow.com / admin123)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error.message);
    return false;
  }
}

module.exports = initializeDatabase;
