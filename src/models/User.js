const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100,
    alias: 'name'
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  senha: {
    type: String,
    required: true,
    minlength: 6,
    alias: 'password'
  },
  papel: {
    type: String,
    enum: ['user', 'organizer', 'admin'],
    default: 'user',
    alias: 'role'
  },
  avatar: {
    type: String,
    default: null,
  }
}, {
  collection: 'usuarios',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  // Verificar tanto o campo persistido ('senha') quanto o alias ('password')
  if (!this.isModified('senha') && !this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    // Garantir que o hash seja salvo no campo persistido 'senha'
    const plain = this.senha || this.password;
    this.senha = await bcrypt.hash(plain, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Método para comparar senha
// Método para comparar senha
userSchema.methods.comparePassword = async function(password) {
  // Comparar com o campo persistido 'senha' ou com o alias 'password' caso exista
  const hash = this.senha || this.password;
  if (!hash) {
    // Nenhum hash disponível: tratar como senha inválida em vez de lançar erro
    return false;
  }
  return bcrypt.compare(password, hash);
};

// Remover senha do JSON retornado
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  // Remover campo de senha persistido
  delete obj.senha;
  // Também garantir remoção do alias caso apareça
  delete obj.password;
  return obj;
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
