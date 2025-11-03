const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, minlength: 5, maxlength: 200 },
  description: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String, default: null },
  location: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  capacity: { type: Number, required: true, min: 1 },
  current_enrollments: { type: Number, default: 0, min: 0 },
  sales_closed: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'cancelled', 'completed'], default: 'active' },
  organizer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  collection: 'eventos',
  timestamps: true
});

module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);
