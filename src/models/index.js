const sequelize = require('../config/database');
const User = require('./User');
const Event = require('./Event');
const Enrollment = require('./Enrollment');
const Feedback = require('./Feedback');
const Endereco = require('./Endereco');

// Definir associações
User.hasMany(Event, {
  foreignKey: 'organizer_id',
  as: 'organized_events'
});

Event.belongsTo(User, {
  foreignKey: 'organizer_id',
  as: 'organizer'
});

// Usuário pode ter um endereço (nullable)
User.belongsTo(Endereco, { foreignKey: 'endereco_id', as: 'endereco' });
Endereco.hasMany(User, { foreignKey: 'endereco_id', as: 'users' });

// Evento pode ter um endereço (nullable)
Event.belongsTo(Endereco, { foreignKey: 'endereco_id', as: 'endereco' });
Endereco.hasMany(Event, { foreignKey: 'endereco_id', as: 'events' });

User.belongsToMany(Event, {
  through: Enrollment,
  foreignKey: 'user_id',
  otherKey: 'event_id',
  as: 'enrolled_events'
});

Event.belongsToMany(User, {
  through: Enrollment,
  foreignKey: 'event_id',
  otherKey: 'user_id',
  as: 'participants'
});

Enrollment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Enrollment.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// Feedback associations
Feedback.belongsTo(User, { foreignKey: 'usuario_id', as: 'user' });
Feedback.belongsTo(Event, { foreignKey: 'evento_id', as: 'event' });
Event.hasMany(Feedback, { foreignKey: 'evento_id', as: 'feedbacks' });

// Sincronizar modelos com o banco de dados
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Conexão com banco de dados estabelecida com sucesso.');
    
    await sequelize.sync({ alter: true });
    console.log('✓ Modelos sincronizados com o banco de dados.');
  } catch (error) {
    console.error('✗ Erro ao conectar com o banco de dados:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Event,
  Enrollment,
  Feedback,
  Endereco,
  syncDatabase
};
