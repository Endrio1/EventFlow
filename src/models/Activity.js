const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  evento_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  titulo: { type: String, required: true, minlength: 3, maxlength: 200 },
  descricao: { type: String, default: '' },
  palestrante: { type: String, default: '' },
  local: { type: String, default: '' },
  data_inicio: { type: Date, required: true },
  data_fim: { type: Date, required: true },
  tipo: { 
    type: String, 
    enum: ['palestra', 'workshop', 'mesa_redonda', 'minicurso', 'apresentacao', 'intervalo', 'outro'],
    default: 'palestra'
  },
  vagas: { type: Number, default: 0 }, // 0 = sem limite (usa capacidade do evento)
  ordem: { type: Number, default: 0 }, // ordem de exibição
  inscricoes_atividade: { type: Number, default: 0 }
}, {
  collection: 'atividades',
  timestamps: true,
  toJSON: { virtuals: true, aliases: false },
  toObject: { virtuals: true, aliases: false }
});

// Virtuals para compatibilidade com frontend (inglês)
activitySchema.virtual('event_id').get(function() { return this.evento_id; });
activitySchema.virtual('title').get(function() { return this.titulo; });
activitySchema.virtual('description').get(function() { return this.descricao; });
activitySchema.virtual('speaker').get(function() { return this.palestrante; });
activitySchema.virtual('location').get(function() { return this.local; });
activitySchema.virtual('start_date').get(function() { return this.data_inicio; });
activitySchema.virtual('end_date').get(function() { return this.data_fim; });
activitySchema.virtual('type').get(function() { return this.tipo; });
activitySchema.virtual('capacity').get(function() { return this.vagas; });
activitySchema.virtual('order').get(function() { return this.ordem; });
activitySchema.virtual('activity_enrollments').get(function() { return this.inscricoes_atividade; });

// Índice para buscar atividades de um evento ordenadas por data/ordem
activitySchema.index({ evento_id: 1, ordem: 1, data_inicio: 1 });

module.exports = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
