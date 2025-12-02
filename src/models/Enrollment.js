const mongoose = require('mongoose');


const enrollmentSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  evento_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  status: { type: String, enum: ['confirmed', 'cancelled', 'attended'], default: 'confirmed' },
  data_inscricao: { type: Date, default: Date.now }
}, {
  collection: 'inscricoes',
  timestamps: false,
  toJSON: { virtuals: true, aliases: false },
  toObject: { virtuals: true, aliases: false }
});

// Adicionar aliases como virtuals para compatibilidade com frontend
enrollmentSchema.virtual('user_id').get(function() { return this.usuario_id; });
enrollmentSchema.virtual('event_id').get(function() { return this.evento_id; });
enrollmentSchema.virtual('enrollment_date').get(function() { return this.data_inscricao; });

// Índice único usando os nomes persistidos em português
enrollmentSchema.index({ usuario_id: 1, evento_id: 1 }, { unique: true });

module.exports = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);
