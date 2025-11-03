const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  evento_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'evento_id',
    references: {
      model: 'eventos',
      key: 'id'
    }
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'usuario_id',
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  nota: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'nota',
    validate: {
      min: { args: [1], msg: 'Nota mínima é 1' },
      max: { args: [5], msg: 'Nota máxima é 5' }
    }
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'comentario'
  },
  criado_em: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'criado_em'
  }
}, {
  tableName: 'avaliacoes',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['evento_id', 'usuario_id'],
      name: 'unique_usuario_por_evento'
    }
  ]
});

module.exports = Feedback;
