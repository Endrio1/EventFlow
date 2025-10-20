const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'nome',
    validate: {
      notEmpty: { msg: 'Nome é obrigatório' },
      len: { args: [3, 100], msg: 'Nome deve ter entre 3 e 100 caracteres' }
    }
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: { msg: 'Este email já está cadastrado' },
    field: 'email',
    validate: {
      isEmail: { msg: 'Email inválido' },
      notEmpty: { msg: 'Email é obrigatório' }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'senha',
    validate: {
      notEmpty: { msg: 'Senha é obrigatória' },
      len: { args: [6, 255], msg: 'Senha deve ter no mínimo 6 caracteres' }
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'organizer', 'admin'),
    defaultValue: 'user',
    allowNull: false
    ,
    field: 'papel'
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
    ,
    field: 'avatar'
  }
}, {
  tableName: 'usuarios',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// Método para comparar senha
User.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Remover senha ao retornar JSON
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;
