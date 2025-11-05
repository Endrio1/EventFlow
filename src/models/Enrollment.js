const mongoose = require('mongoose');


const enrollmentSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, alias: 'user_id' },
  evento_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, alias: 'event_id' },
  status: { type: String, enum: ['confirmed', 'cancelled', 'attended'], default: 'confirmed' },
  data_inscricao: { type: Date, default: Date.now, alias: 'enrollment_date' }
}, {
  collection: 'inscricoes',
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índice único usando os nomes persistidos em português
enrollmentSchema.index({ usuario_id: 1, evento_id: 1 }, { unique: true });

module.exports = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);
