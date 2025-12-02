const { User } = require('../models');

class AdminController {
  // Listar usuários com busca e paginação (apenas admin)
  async listUsers(req, res, next) {
    try {
      const { q, page = 1, limit = 20 } = req.query;
      const filter = {};
      if (q) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ nome: rx }, { email: rx }];
      }
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const total = await User.countDocuments(filter);
      const users = await User.find(filter).select('-senha').skip(skip).limit(parseInt(limit)).sort({ nome: 1 });
      return res.json({ success: true, data: { users, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) } } });
    } catch (error) {
      next(error);
    }
  }

  // Deletar usuário (apenas admin)
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

      await User.deleteOne({ _id: id });
      return res.json({ success: true, message: 'Usuário deletado com sucesso' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
