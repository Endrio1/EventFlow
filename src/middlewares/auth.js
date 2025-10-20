const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token não fornecido' 
      });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      return res.status(401).json({ 
        success: false, 
        message: 'Erro no formato do token' 
      });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token mal formatado' 
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ 
          success: false, 
          message: 'Token inválido ou expirado' 
        });
      }

      req.userId = decoded.id;
      req.userRole = decoded.role;
      return next();
    });
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Erro na autenticação' 
    });
  }
};

const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não autenticado' 
      });
    }

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Permissões insuficientes.' 
      });
    }

    next();
  };
};

module.exports = { authMiddleware, checkRole };
