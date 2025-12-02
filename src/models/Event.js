const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  titulo: { type: String, required: true, minlength: 5, maxlength: 200 },
  descricao: { type: String, required: true },
  categoria: { type: String, required: true },
  imagens: { type: [String], default: [], validate: [arr => arr.length <= 5, 'Máximo de 5 imagens permitidas'] },
  local: { type: String, required: true },
  data: { type: Date, required: true },
  hora: { type: String, required: true },
  capacidade: { type: Number, required: true, min: 1 },
  inscricoes_atuais: { type: Number, default: 0, min: 0 },
  vendas_encerradas: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'cancelled', 'completed'], default: 'active' },
  organizador_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  collection: 'eventos',
  timestamps: true,
  toJSON: { virtuals: true, aliases: false },
  toObject: { virtuals: true, aliases: false }
});

// Virtuals para compatibilidade com frontend
eventSchema.virtual('title').get(function() { return this.titulo; });
eventSchema.virtual('description').get(function() { return this.descricao; });
eventSchema.virtual('category').get(function() { return this.categoria; });
eventSchema.virtual('images').get(function() { return this.imagens; });
// Compatibilidade: retorna a primeira imagem ou null
eventSchema.virtual('image').get(function() { return this.imagens && this.imagens.length > 0 ? this.imagens[0] : null; });
eventSchema.virtual('location').get(function() { return this.local; });
eventSchema.virtual('date').get(function() { return this.data; });
eventSchema.virtual('time').get(function() { return this.hora; });
eventSchema.virtual('capacity').get(function() { return this.capacidade; });
eventSchema.virtual('current_enrollments').get(function() { return this.inscricoes_atuais; });
eventSchema.virtual('sales_closed').get(function() { return this.vendas_encerradas; });
eventSchema.virtual('organizer_id').get(function() { return this.organizador_id; });

module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);
