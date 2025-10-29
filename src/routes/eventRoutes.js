const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authMiddleware, checkRole } = require('../middlewares/auth');
const upload = require('../config/multer');

// Rotas públicas
router.get('/', eventController.index);
router.get('/:id', eventController.show);

// Rotas protegidas (requer autenticação)
router.post('/', 
  authMiddleware, 
  checkRole('organizer', 'admin'),
  upload.single('image'),
  eventController.store
);

router.put('/:id', 
  authMiddleware,
  checkRole('organizer', 'admin'),
  upload.single('image'),
  eventController.update
);

router.delete('/:id', 
  authMiddleware,
  checkRole('organizer', 'admin'),
  eventController.destroy
);

router.get('/organizer/my-events', 
  authMiddleware,
  checkRole('organizer', 'admin'),
  eventController.myEvents
);

// Rota para fechar/abrir vendas (organizador do evento ou admin)
router.patch('/:id/sales',
  authMiddleware,
  eventController.setSalesClosed
);

module.exports = router;
