const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authMiddleware, checkRole } = require('../middlewares/auth');

// Rotas públicas - listar atividades de um evento
router.get('/events/:eventId/activities', activityController.listByEvent);
router.get('/activities/:activityId', activityController.getById);

// Rotas protegidas - apenas organizador do evento ou admin
router.post('/events/:eventId/activities', authMiddleware, activityController.create);
router.put('/activities/:activityId', authMiddleware, activityController.update);
router.delete('/activities/:activityId', authMiddleware, activityController.delete);

module.exports = router;
