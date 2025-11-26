const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { authMiddleware } = require('../middlewares/auth');

// Rotas públicas
// Idempotent endpoint to find or create an address normalized by hash
router.post('/find-or-create', addressController.findOrCreate);

// Rotas protegidas (requer autenticação)
router.get('/', authMiddleware, addressController.index);           // Listar endereços do organizador
router.get('/all', authMiddleware, addressController.listAll);      // Listar todos os endereços
router.get('/:id', authMiddleware, addressController.show);         // Obter endereço específico
router.post('/', authMiddleware, addressController.store);          // Criar novo endereço
router.put('/:id', authMiddleware, addressController.update);       // Atualizar endereço
router.delete('/:id', authMiddleware, addressController.destroy);   // Deletar endereço

module.exports = router;
