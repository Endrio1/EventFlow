const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { authMiddleware, checkRole } = require('../middlewares/auth');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Inscrever-se em evento
router.post('/events/:eventId/enroll', enrollmentController.enroll);

// Cancelar inscrição
router.delete('/events/:eventId/cancel', enrollmentController.cancel);

// Listar minhas inscrições
router.get('/my-enrollments', enrollmentController.myEnrollments);

// Ver participantes de um evento (apenas organizadores)
router.get('/events/:eventId/participants', 
  checkRole('organizer', 'admin'),
  enrollmentController.eventParticipants
);

// Marcar inscrição como reembolsada (organizador/admin)
router.patch('/:enrollmentId/refund', 
  checkRole('organizer', 'admin'),
  enrollmentController.markRefunded
);

module.exports = router;
