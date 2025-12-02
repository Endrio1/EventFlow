const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const eventRoutes = require('./eventRoutes');
const enrollmentRoutes = require('./enrollmentRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const adminRoutes = require('./adminRoutes');
const activityRoutes = require('./activityRoutes');

// Health check
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EventFlow API está rodando!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      events: '/api/events',
      enrollments: '/api/enrollments',
      feedbacks: '/api/feedbacks',
      activities: '/api (activities under events)'
    }
  });
});

// Rotas da API
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/feedbacks', feedbackRoutes);
router.use('/admin', adminRoutes);
router.use('/', activityRoutes); // Atividades: /api/events/:eventId/activities e /api/activities/:id

module.exports = router;
