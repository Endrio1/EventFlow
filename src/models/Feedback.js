const mongoose = require('mongoose');


const feedbackSchema = new mongoose.Schema({
  evento_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nota: { type: Number, required: true, min: 1, max: 5 },
  comentario: { type: String, default: null },
  criado_em: { type: Date, default: Date.now }
}, {
  collection: 'avaliacoes',
  timestamps: false,
  toJSON: { virtuals: true, aliases: false },
  toObject: { virtuals: true, aliases: false }
});

// Virtuals para compatibilidade com frontend
feedbackSchema.virtual('event_id').get(function() { return this.evento_id; });
feedbackSchema.virtual('user_id').get(function() { return this.usuario_id; });
feedbackSchema.virtual('rating').get(function() { return this.nota; });
feedbackSchema.virtual('comment').get(function() { return this.comentario; });
feedbackSchema.virtual('created_at').get(function() { return this.criado_em; });

feedbackSchema.index({ evento_id: 1, usuario_id: 1 }, { unique: true, name: 'unique_usuario_por_evento' });

module.exports = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
