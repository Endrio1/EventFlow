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
      const userExists = await User.findOne({ where: { email } });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'Este email já está cadastrado'
        });
      }

      // Criar novo usuário
      const user = await User.create({
        name,
        email,
        password,
        role: role || 'user'
      });

      // Gerar token JWT
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

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
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      // Verificar senha
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      // Gerar token
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

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
      const user = await User.findByPk(req.userId, {
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
  }

  // Atualizar perfil
  async updateProfile(req, res, next) {
    try {
      const { name, email } = req.body;
      const user = await User.findByPk(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Atualizar campos
      if (name) user.name = name;
      if (email) user.email = email;

      await user.save();

      return res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: user
      });
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

      const user = await User.findByPk(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

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
