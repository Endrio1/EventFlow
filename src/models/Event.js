const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'titulo',
    validate: {
      notEmpty: { msg: 'Título é obrigatório' },
      len: { args: [5, 200], msg: 'Título deve ter entre 5 e 200 caracteres' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'descricao',
    validate: {
      notEmpty: { msg: 'Descrição é obrigatória' }
    }
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'categoria',
    validate: {
      notEmpty: { msg: 'Categoria é obrigatória' }
    }
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'imagem'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'local',
    validate: {
      notEmpty: { msg: 'Local é obrigatório' }
    }
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'data',
    validate: {
      isDate: { msg: 'Data inválida' },
      isAfterNow(value) {
        if (new Date(value) < new Date()) {
          throw new Error('A data do evento deve ser futura');
        }
      }
    }
  },
  time: {
    type: DataTypes.STRING(5),
    allowNull: false,
    field: 'horario',
    validate: {
      notEmpty: { msg: 'Horário é obrigatório' },
      is: { args: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, msg: 'Formato de horário inválido (HH:MM)' }
    }
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'capacidade',
    validate: {
      min: { args: [1], msg: 'Capacidade mínima é 1' },
      isInt: { msg: 'Capacidade deve ser um número inteiro' }
    }
  },
  current_enrollments: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'inscricoes_atuais',
    validate: {
      min: { args: [0], msg: 'Número de inscrições não pode ser negativo' }
    }
  },
  sales_closed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'vendas_fechadas'
  },
  status: {
    type: DataTypes.ENUM('active', 'cancelled', 'completed'),
    defaultValue: 'active',
    allowNull: false
  },
  organizer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'organizador_id',
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  endereco_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'endereco_id',
    references: {
      model: 'enderecos',
      key: 'id'
    }
  }
}, {
  tableName: 'eventos'
});

module.exports = Event;
