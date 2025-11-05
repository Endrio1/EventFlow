const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  titulo: { type: String, required: true, minlength: 5, maxlength: 200, alias: 'title' },
  descricao: { type: String, required: true, alias: 'description' },
  categoria: { type: String, required: true, alias: 'category' },
  imagem: { type: String, default: null, alias: 'image' },
  local: { type: String, required: true, alias: 'location' },
  data: { type: Date, required: true, alias: 'date' },
  hora: { type: String, required: true, alias: 'time' },
  capacidade: { type: Number, required: true, min: 1, alias: 'capacity' },
  inscricoes_atuais: { type: Number, default: 0, min: 0, alias: 'current_enrollments' },
  vendas_encerradas: { type: Boolean, default: false, alias: 'sales_closed' },
  status: { type: String, enum: ['active', 'cancelled', 'completed'], default: 'active' },
  organizador_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, alias: 'organizer_id' }
}, {
  collection: 'eventos',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);
