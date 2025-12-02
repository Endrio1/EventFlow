const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, checkRole } = require('../middlewares/auth');

// Todas as rotas exigem autenticação e papel admin
router.use(authMiddleware);
router.use(checkRole('admin'));

// Listar usuários (busca/paginação)
router.get('/users', adminController.listUsers);

// Deletar usuário
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
