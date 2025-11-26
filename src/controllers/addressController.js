const crypto = require('crypto');
const { Endereco, Event } = require('../models');

class AddressController {
  constructor() {
    // Bind all methods to ensure 'this' context is preserved
    this.index = this.index.bind(this);
    this.show = this.show.bind(this);
    this.store = this.store.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
    this.findOrCreate = this.findOrCreate.bind(this);
    this.listAll = this.listAll.bind(this);
  }

  // GET /api/addresses - Listar todos os endereços do organizador
  async index(req, res, next) {
    try {
      // Buscar endereços utilizados nos eventos do organizador
      const events = await Event.findAll({
        where: { organizer_id: req.userId },
        include: [{
          model: Endereco,
          as: 'endereco',
          required: false
        }]
      });

      // Extrair endereços únicos
      const addressMap = new Map();
      events.forEach(event => {
        if (event.endereco) {
          addressMap.set(event.endereco.id, event.endereco);
        }
      });

      // Também buscar endereços órfãos criados pelo organizador (se houver campo criador)
      // Por enquanto, retornamos apenas os usados em eventos
      const addresses = Array.from(addressMap.values());

      return res.json({ success: true, data: addresses });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/addresses/:id - Obter endereço específico
  async show(req, res, next) {
    try {
      const { id } = req.params;
      const endereco = await Endereco.findByPk(id);

      if (!endereco) {
        return res.status(404).json({ success: false, message: 'Endereço não encontrado' });
      }

      return res.json({ success: true, data: endereco });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/addresses - Criar novo endereço
  async store(req, res, next) {
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
        longitude = null,
        nome = null // Nome amigável para identificar o endereço
      } = req.body;

      // Normalizar texto
      const joined = `${cep || ''} ${rua || ''} ${numero || ''} ${complemento || ''} ${bairro || ''} ${cidade || ''} ${estado || ''} ${pais || ''}`;
      const normalized_text = (joined || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '');
      const normalized_hash = crypto.createHash('sha256').update(normalized_text).digest('hex');

      // Verificar se já existe
      let endereco = await Endereco.findOne({ where: { normalized_hash } });
      if (endereco) {
        return res.json({ success: true, data: endereco, message: 'Endereço já existe' });
      }

      // Criar novo
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

      return res.status(201).json({ success: true, data: endereco, message: 'Endereço criado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/addresses/:id - Atualizar endereço
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const {
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        pais,
        latitude,
        longitude
      } = req.body;

      const endereco = await Endereco.findByPk(id);

      if (!endereco) {
        return res.status(404).json({ success: false, message: 'Endereço não encontrado' });
      }

      // Atualizar campos
      if (cep !== undefined) endereco.cep = cep;
      if (rua !== undefined) endereco.rua = rua;
      if (numero !== undefined) endereco.numero = numero;
      if (complemento !== undefined) endereco.complemento = complemento;
      if (bairro !== undefined) endereco.bairro = bairro;
      if (cidade !== undefined) endereco.cidade = cidade;
      if (estado !== undefined) endereco.estado = estado;
      if (pais !== undefined) endereco.pais = pais;
      if (latitude !== undefined) endereco.latitude = latitude;
      if (longitude !== undefined) endereco.longitude = longitude;

      // Recalcular hash
      const joined = `${endereco.cep || ''} ${endereco.rua || ''} ${endereco.numero || ''} ${endereco.complemento || ''} ${endereco.bairro || ''} ${endereco.cidade || ''} ${endereco.estado || ''} ${endereco.pais || ''}`;
      endereco.normalized_text = (joined || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '');
      endereco.normalized_hash = crypto.createHash('sha256').update(endereco.normalized_text).digest('hex');

      await endereco.save();

      return res.json({ success: true, data: endereco, message: 'Endereço atualizado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/addresses/:id - Deletar endereço
  async destroy(req, res, next) {
    try {
      const { id } = req.params;

      const endereco = await Endereco.findByPk(id);

      if (!endereco) {
        return res.status(404).json({ success: false, message: 'Endereço não encontrado' });
      }

      // Verificar se está sendo usado em algum evento
      const eventCount = await Event.count({ where: { endereco_id: id } });
      if (eventCount > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Este endereço está sendo usado em ${eventCount} evento(s). Remova a associação primeiro.` 
        });
      }

      await endereco.destroy();

      return res.json({ success: true, message: 'Endereço deletado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

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

  // GET /api/addresses/all - Listar todos os endereços cadastrados (para seleção)
  async listAll(req, res, next) {
    try {
      const addresses = await Endereco.findAll({
        order: [['cidade', 'ASC'], ['rua', 'ASC']]
      });

      return res.json({ success: true, data: addresses });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AddressController();
