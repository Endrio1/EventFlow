const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const eventRoutes = require('./eventRoutes');
const enrollmentRoutes = require('./enrollmentRoutes');

// Health check
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EventFlow API está rodando!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      events: '/api/events',
      enrollments: '/api/enrollments'
    }
  });
});

// Rotas da API
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/enrollments', enrollmentRoutes);

module.exports = router;
