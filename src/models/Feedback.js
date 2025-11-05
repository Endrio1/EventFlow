const mongoose = require('mongoose');


const feedbackSchema = new mongoose.Schema({
  evento_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, alias: 'event_id' },
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, alias: 'user_id' },
  nota: { type: Number, required: true, min: 1, max: 5, alias: 'rating' },
  comentario: { type: String, default: null, alias: 'comment' },
  criado_em: { type: Date, default: Date.now, alias: 'created_at' }
}, {
  collection: 'avaliacoes',
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

feedbackSchema.index({ evento_id: 1, usuario_id: 1 }, { unique: true, name: 'unique_usuario_por_evento' });

module.exports = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
