const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Endereco = sequelize.define('Endereco', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cep: { type: DataTypes.STRING(20), allowNull: true, field: 'cep' },
  rua: { type: DataTypes.STRING(255), allowNull: true, field: 'rua' },
  numero: { type: DataTypes.STRING(50), allowNull: true, field: 'numero' },
  complemento: { type: DataTypes.STRING(255), allowNull: true, field: 'complemento' },
  bairro: { type: DataTypes.STRING(255), allowNull: true, field: 'bairro' },
  cidade: { type: DataTypes.STRING(100), allowNull: true, field: 'cidade' },
  estado: { type: DataTypes.STRING(100), allowNull: true, field: 'estado' },
  pais: { type: DataTypes.STRING(100), allowNull: true, field: 'pais', defaultValue: 'BR' },
  latitude: { type: DataTypes.DECIMAL(9,6), allowNull: true, field: 'latitude' },
  longitude: { type: DataTypes.DECIMAL(9,6), allowNull: true, field: 'longitude' },
  normalized_text: { type: DataTypes.TEXT, allowNull: true, field: 'normalized_text' },
  normalized_hash: { type: DataTypes.STRING(64), allowNull: true, field: 'normalized_hash' },
  criado_em: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'criado_em' }
}, {
  tableName: 'enderecos',
  timestamps: false
});

module.exports = Endereco;
