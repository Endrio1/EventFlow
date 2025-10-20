const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Enrollment = sequelize.define('Enrollment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'usuario_id',
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'evento_id',
    references: {
      model: 'eventos',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('confirmed', 'cancelled', 'attended'),
    defaultValue: 'confirmed',
    allowNull: false
  },
  enrollment_date: {
    type: DataTypes.DATE,
    field: 'data_inscricao',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'inscricoes',
  indexes: [
    {
      unique: true,
      fields: ['usuario_id', 'evento_id']
    }
  ]
});

module.exports = Enrollment;
