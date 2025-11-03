const jwt = require('jsonwebtoken');
const { User } = require('../models');

class AuthController {
  // Registro de novo usuário
  async register(req, res, next) {
    try {
      const { name, email, password, role } = req.body;

      // Validações básicas
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nome, email e senha são obrigatórios'
        });
      }

      // Verificar se usuário já existe
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'Este email já está cadastrado' });
      }

      // Criar novo usuário
      const user = new User({ name, email, password, role: role || 'user' });
      await user.save();

      // Gerar token JWT (verificar se secret está configurado)
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ success: false, message: 'JWT_SECRET não está configurado no servidor' });
      }

      const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn });

      return res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: {
          user,
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validações
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email e senha são obrigatórios'
        });
      }

      // Buscar usuário
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ success: false, message: 'Credenciais inválidas' });

      // Verificar senha
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      // Gerar token
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ success: false, message: 'JWT_SECRET não está configurado no servidor' });
      }

      const expiresInLogin = process.env.JWT_EXPIRES_IN || '7d';
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: expiresInLogin });

      return res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user,
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obter perfil do usuário autenticado
  async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.userId).select('-password');
      if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
      return res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  // Atualizar perfil
  async updateProfile(req, res, next) {
    try {
      const { name, email } = req.body;
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

      // Atualizar campos
      if (name) user.name = name;
      if (email) user.email = email;

      await user.save();

      return res.json({ success: true, message: 'Perfil atualizado com sucesso', data: user });
    } catch (error) {
      next(error);
    }
  }

  // Alterar senha
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual e nova senha são obrigatórias'
        });
      }

      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

      // Verificar senha atual
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Senha atual incorreta'
        });
      }

      // Atualizar senha
      user.password = newPassword;
      await user.save();

      return res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
