const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  status: { type: String, enum: ['confirmed', 'cancelled', 'attended'], default: 'confirmed' },
  enrollment_date: { type: Date, default: Date.now }
}, {
  collection: 'inscricoes',
  timestamps: false
});

enrollmentSchema.index({ user_id: 1, event_id: 1 }, { unique: true });

module.exports = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);
