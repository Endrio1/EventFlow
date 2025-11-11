const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middlewares/auth');
const { User, Event } = require('../models');
const { Op } = require('sequelize');

// Todas as rotas requerem autenticação e role admin
router.use(authMiddleware);
router.use(checkRole('admin'));

// Listar usuários com busca
router.get('/users', async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (search) {
      // Se search for um número, buscar por ID também
      const searchNum = parseInt(search);
      if (!isNaN(searchNum)) {
        where[Op.or] = [
          { id: searchNum },
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      } else {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['id', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Buscar usuário específico por ID
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Deletar usuário
router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Não permitir que admin delete a si mesmo
    if (user.id === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'Você não pode deletar sua própria conta'
      });
    }

    await user.destroy();

    return res.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

// Deletar evento (admin pode deletar qualquer evento)
router.delete('/events/:id', async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento não encontrado'
      });
    }

    await event.destroy();

    return res.json({
      success: true,
      message: 'Evento deletado com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
