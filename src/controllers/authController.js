const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { sendPasswordResetEmail, sendPasswordChangedEmail } = require('../services/emailService');

// Helpers: normalizar e validar CPF/CNPJ
const onlyDigits = (v = '') => (v || '').toString().replace(/\D/g, '');

function isValidCPF(cpf) {
  cpf = onlyDigits(cpf);
  if (!cpf || cpf.length !== 11) return false;
  // rejeita CPFs com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calc = (t) => {
    let sum = 0;
    for (let i = 0; i < t; i++) sum += parseInt(cpf.charAt(i)) * (t + 1 - i);
    const r = 11 - (sum % 11);
    return r > 9 ? 0 : r;
  };

  const d1 = calc(9);
  const d2 = calc(10);
  return d1 === parseInt(cpf.charAt(9)) && d2 === parseInt(cpf.charAt(10));
}

function isValidCNPJ(cnpj) {
  cnpj = onlyDigits(cnpj);
  if (!cnpj || cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calc = (pos) => {
    let result = 0;
    let weights = pos === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
    for (let i = 0; i < weights.length; i++) {
      result += parseInt(cnpj.charAt(i)) * weights[i];
    }
    const r = result % 11;
    return r < 2 ? 0 : 11 - r;
  };

  const d1 = calc(12);
  const d2 = calc(13);
  return d1 === parseInt(cnpj.charAt(12)) && d2 === parseInt(cnpj.charAt(13));
}

class AuthController {
  // Registro de novo usuário
  async register(req, res, next) {
    try {
      const { name, email, password, role, telefone, cpf_cnpj } = req.body;

      // Normalizar telefone e cpf/cnpj (apenas dígitos)
      const normalizedTelefone = telefone ? onlyDigits(telefone) : null;
      const normalizedCpfCnpj = cpf_cnpj ? onlyDigits(cpf_cnpj) : null;

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

      // Regras por papel:
      // - participante ('user'): deve informar CPF válido (11 dígitos) e telefone
      // - organizer: deve informar telefone e CPF ou CNPJ válidos
      if (role === 'user') {
        if (!normalizedTelefone || !normalizedCpfCnpj) {
          return res.status(400).json({ success: false, message: 'Participantes devem informar telefone e CPF' });
        }
        if (normalizedCpfCnpj.length !== 11 || !isValidCPF(normalizedCpfCnpj)) {
          return res.status(400).json({ success: false, message: 'CPF inválido para participante' });
        }
      }

      if (role === 'organizer') {
        if (!normalizedTelefone || !normalizedCpfCnpj) {
          return res.status(400).json({ success: false, message: 'Organizadores devem informar telefone e CPF/CNPJ' });
        }
        // aceitar CPF (11) ou CNPJ (14)
        if (normalizedCpfCnpj.length === 11) {
          if (!isValidCPF(normalizedCpfCnpj)) {
            return res.status(400).json({ success: false, message: 'CPF inválido' });
          }
        } else if (normalizedCpfCnpj.length === 14) {
          if (!isValidCNPJ(normalizedCpfCnpj)) {
            return res.status(400).json({ success: false, message: 'CNPJ inválido' });
          }
        } else {
          return res.status(400).json({ success: false, message: 'CPF/CNPJ inválido' });
        }
      }

      // Criar novo usuário (usar valores normalizados)
      const user = await User.create({
        name,
        email,
        password,
        role: role || 'user',
        telefone: normalizedTelefone || null,
        cpfCnpj: normalizedCpfCnpj || null
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

  // Solicitar recuperação de senha (esqueci minha senha)
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email é obrigatório'
        });
      }

      // Buscar usuário
      const user = await User.findOne({ where: { email } });
      
      // Por segurança, sempre retorna sucesso (mesmo se email não existir)
      // Isso evita que atacantes descubram quais emails estão cadastrados
      if (!user) {
        return res.json({
          success: true,
          message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha'
        });
      }

      // Gerar token único e aleatório
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Hash do token para salvar no banco (mais seguro)
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Salvar token e data de expiração (1 hora)
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora
      await user.save();

      // Enviar email com link de recuperação
      try {
        await sendPasswordResetEmail(user.email, resetToken, user.name);
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
        // Limpar token se o email falhar
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();
        
        return res.status(500).json({
          success: false,
          message: 'Erro ao enviar email de recuperação. Tente novamente mais tarde.'
        });
      }

      return res.json({
        success: true,
        message: 'Instruções para redefinir sua senha foram enviadas para seu email'
      });
    } catch (error) {
      next(error);
    }
  }

  // Redefinir senha com token
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token e nova senha são obrigatórios'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'A senha deve ter no mínimo 6 caracteres'
        });
      }

      // Hash do token recebido para comparar com o banco
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Buscar usuário com token válido e não expirado
      const user = await User.findOne({
        where: {
          resetPasswordToken: hashedToken,
        }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Token inválido ou expirado'
        });
      }

      // Verificar se o token expirou
      if (user.resetPasswordExpires < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Token expirado. Solicite uma nova recuperação de senha'
        });
      }

      // Atualizar senha
      user.password = newPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      // Enviar email de confirmação (não bloqueia se falhar)
      try {
        await sendPasswordChangedEmail(user.email, user.name);
      } catch (emailError) {
        console.error('Erro ao enviar email de confirmação:', emailError);
      }

      return res.json({
        success: true,
        message: 'Senha redefinida com sucesso! Você já pode fazer login com sua nova senha'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
