const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authMiddleware } = require('../middlewares/auth');

// Rotas de feedback (PUT e DELETE exigem que seja o próprio usuário)
router.put('/:id', authMiddleware, feedbackController.update);
router.delete('/:id', authMiddleware, feedbackController.destroy);

module.exports = router;
