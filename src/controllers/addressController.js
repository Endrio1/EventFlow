const crypto = require('crypto');
const { Endereco } = require('../models');

class AddressController {
  // POST /api/addresses/find-or-create
  async findOrCreate(req, res, next) {
    try {
      const {
        cep = null,
        rua = null,
        numero = null,
        complemento = null,
        bairro = null,
        cidade = null,
        estado = null,
        pais = 'BR',
        latitude = null,
        longitude = null
      } = req.body;

      // Normalizar texto conforme a migration: juntar campos, lower, remover não alfanuméricos
      const joined = `${cep || ''} ${rua || ''} ${numero || ''} ${complemento || ''} ${bairro || ''} ${cidade || ''} ${estado || ''} ${pais || ''}`;
      const normalized_text = (joined || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '');
      const normalized_hash = crypto.createHash('sha256').update(normalized_text).digest('hex');

      // Tentar encontrar pelo hash
      let endereco = await Endereco.findOne({ where: { normalized_hash } });
      if (endereco) {
        return res.json({ success: true, data: endereco });
      }

      // Se não existir, criar (idempotente devido ao índice único em normalized_hash)
      // Use try/catch para lidar com condição de corrida (duplicate key)
      try {
        endereco = await Endereco.create({
          cep,
          rua,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          pais,
          latitude,
          longitude,
          normalized_text,
          normalized_hash
        });
        return res.status(201).json({ success: true, data: endereco });
      } catch (err) {
        // Possível corrida: outro processo criou o mesmo endereço. Buscar novamente.
        const existing = await Endereco.findOne({ where: { normalized_hash } });
        if (existing) return res.json({ success: true, data: existing });
        throw err;
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AddressController();
