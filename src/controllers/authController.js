const jwt = require('jsonwebtoken');
const { User } = require('../models');

class AuthController {
  // Registro de novo usuário
  async register(req, res, next) {
    try {
      // Aceitar campos em português ou inglês para compatibilidade com frontend
      const nome = req.body.nome || req.body.name;
      const email = req.body.email;
      const senha = req.body.senha || req.body.password;
      const papel = req.body.papel || req.body.role;

      // Validações básicas
      if (!nome || !email || !senha) {
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

  // Criar novo usuário (usar campos persistidos em português)
  const user = new User({ nome, email, senha, papel: papel || 'user' });
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
      // Aceitar 'senha' ou 'password' enviados pelo cliente
      const email = req.body.email;
      const senha = req.body.senha || req.body.password;

      // Validações
      if (!email || !senha) {
        return res.status(400).json({
          success: false,
          message: 'Email e senha são obrigatórios'
        });
      }

      // Buscar usuário
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ success: false, message: 'Credenciais inválidas' });

      // Verificar senha (método comparePassword trata ausência de hash)
      const isPasswordValid = await user.comparePassword(senha);
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
      // Excluir o campo persistido de senha ('senha') ao retornar o perfil
      const user = await User.findById(req.userId).select('-senha');
      if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
      return res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  // Atualizar perfil
  async updateProfile(req, res, next) {
    try {
      // Aceitar 'nome' ou 'name'
      const nome = req.body.nome || req.body.name;
      const email = req.body.email;
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

      // Atualizar campos
      if (nome) user.nome = nome;
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
      // Aceitar tanto nomes em inglês quanto em português
      const currentPassword = req.body.currentPassword || req.body.currentSenha || req.body.senha;
      const newPassword = req.body.newPassword || req.body.novaSenha || req.body.password;

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

  // Atualizar senha (salvar no campo persistido 'senha' para consistência)
  user.senha = newPassword;
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
