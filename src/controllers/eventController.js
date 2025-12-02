const { Event, User, Enrollment } = require('../models');
const fs = require('fs');
const path = require('path');

const buildRegex = (value) => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

class EventController {
  // Listar todos os eventos (com filtros)
  async index(req, res, next) {
    try {
      const { 
        category, 
        search, 
        name,
        status = 'active', 
        page = 1, 
        limit = 10,
        sortBy = 'date',
        order = 'ASC'
      } = req.query;

      const offset = (page - 1) * limit;
      const filter = {};

      if (status) filter.status = status;
      if (category) filter.category = buildRegex(category);

      if (name) {
        filter.title = buildRegex(name);
      } else if (search) {
        const rx = buildRegex(search);
        filter.$or = [
          { title: rx },
          { description: rx },
          { location: rx }
        ];
      }

      const count = await Event.countDocuments(filter);
      const eventsFound = await Event.find(filter)
        .populate('organizador_id', 'nome email')
        .sort({ [sortBy]: order.toUpperCase() === 'ASC' ? 1 : -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit));

      // Normalize para frontend: fornecer `organizer` em vez de `organizer_id`
      const events = eventsFound.map(ev => {
        const obj = ev.toObject();
        obj.organizer = obj.organizador_id || null;
        return obj;
      });

      return res.json({ success: true, data: { events, pagination: { total: count, page: parseInt(page), totalPages: Math.ceil(count / limit), limit: parseInt(limit) } } });
    } catch (error) {
      next(error);
    }
  }

  // Obter evento específico
  async show(req, res, next) {
    try {
      const { id } = req.params;
  const event = await Event.findById(id).populate('organizador_id', 'nome email');
      if (!event) return res.status(404).json({ success: false, message: 'Evento não encontrado' });

      // Buscar participantes confirmados
    const participants = await Enrollment.find({ evento_id: id, status: 'confirmed' }).populate('usuario_id', 'nome email');

    const eventObj = event.toObject();
    // Normalizar nome do organizador para a propriedade `organizer` (compatibilidade frontend)
    eventObj.organizer = eventObj.organizador_id || null;
    eventObj.participants = participants.map(p => ({ status: p.status, enrollment_date: p.data_inscricao, user: p.usuario_id }));

      return res.json({ success: true, data: eventObj });
    } catch (error) {
      next(error);
    }
  }

  // Criar novo evento
  async store(req, res, next) {
    try {
      // Debug: registrar informações da requisição em ambiente de desenvolvimento
      if (process.env.NODE_ENV !== 'production') {
        console.log('[EVENT][STORE] method=', req.method, 'path=', req.path);
        console.log('[EVENT][STORE] content-type=', req.headers['content-type']);
        console.log('[EVENT][STORE] userId=', req.userId, 'userRole=', req.userRole);
        try {
          console.log('[EVENT][STORE] body keys=', Object.keys(req.body || {}));
        } catch (e) {
          console.log('[EVENT][STORE] body=', req.body);
        }
        if (req.files && req.files.length > 0) {
          console.log('[EVENT][STORE] files count=', req.files.length);
          req.files.forEach((f, i) => console.log(`[EVENT][STORE] file[${i}]=`, f.filename));
        } else {
          console.log('[EVENT][STORE] files= []');
        }
      }

      const { title, description, category, location, date, time, capacity } = req.body;

      // Validações básicas
      if (!title || !description || !category || !location || !date || !time || !capacity) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos obrigatórios devem ser preenchidos'
        });
      }

      // Processar imagens (até 5)
      const images = req.files ? req.files.map(f => `/uploads/events/${f.filename}`) : [];

      // Criar evento
      const event = new Event({
        title,
        description,
        category,
        location,
        date,
        time,
        capacity: parseInt(capacity),
        images,
        organizador_id: req.userId
      });
      await event.save();

      return res.status(201).json({ success: true, message: 'Evento criado com sucesso', data: event });
    } catch (error) {
      // Remover arquivos se upload foi feito mas erro ocorreu
      if (req.files && req.files.length > 0) {
        req.files.forEach(f => {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });
      }
      next(error);
    }
  }

  // Atualizar evento
  async update(req, res, next) {
    try {
      const { id } = req.params;
      // Debug: registrar informações da requisição em ambiente de desenvolvimento
      if (process.env.NODE_ENV !== 'production') {
        console.log('[EVENT][UPDATE] method=', req.method, 'path=', req.path, 'id=', id);
        console.log('[EVENT][UPDATE] content-type=', req.headers['content-type']);
        console.log('[EVENT][UPDATE] userId=', req.userId, 'userRole=', req.userRole);
        try {
          console.log('[EVENT][UPDATE] body keys=', Object.keys(req.body || {}));
        } catch (e) {
          console.log('[EVENT][UPDATE] body=', req.body);
        }
        if (req.files && req.files.length > 0) {
          console.log('[EVENT][UPDATE] files count=', req.files.length);
          req.files.forEach((f, i) => console.log(`[EVENT][UPDATE] file[${i}]=`, f.filename));
        } else {
          console.log('[EVENT][UPDATE] files= []');
        }
      }
      const { title, description, category, location, date, time, capacity, status, removeImages } = req.body;

      const event = await Event.findById(id);
      if (!event) {
        if (req.files) req.files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
        return res.status(404).json({ success: false, message: 'Evento não encontrado' });
      }

      // Verificar se usuário é o organizador
      if (event.organizador_id.toString() !== req.userId && req.userRole !== 'admin') {
        if (req.files) req.files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
        return res.status(403).json({ success: false, message: 'Você não tem permissão para editar este evento' });
      }

      // Atualizar campos
      if (title) event.titulo = title;
      if (description) event.descricao = description;
      if (category) event.categoria = category;
      if (location) event.local = location;
      if (date) event.data = date;
      if (time) event.hora = time;
      if (capacity) event.capacidade = parseInt(capacity);
      if (status) event.status = status;

      // Processar remoção de imagens existentes
      let currentImages = [...(event.imagens || [])];
      if (removeImages) {
        const toRemove = Array.isArray(removeImages) ? removeImages : JSON.parse(removeImages || '[]');
        toRemove.forEach(imgPath => {
          const fullPath = path.join(__dirname, '../../public', imgPath);
          if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
          currentImages = currentImages.filter(img => img !== imgPath);
        });
      }

      // Adicionar novas imagens (respeitando limite de 5)
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(f => `/uploads/events/${f.filename}`);
        const totalImages = currentImages.length + newImages.length;
        
        if (totalImages > 5) {
          // Remover arquivos novos que excedem o limite
          req.files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
          return res.status(400).json({ 
            success: false, 
            message: `Limite de 5 imagens excedido. Você tem ${currentImages.length} imagens e tentou adicionar ${newImages.length}.` 
          });
        }
        
        currentImages = [...currentImages, ...newImages];
      }

      event.imagens = currentImages;
      await event.save();

      return res.json({ success: true, message: 'Evento atualizado com sucesso', data: event });
    } catch (error) {
      if (req.files) req.files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
      next(error);
    }
  }

  // Deletar evento
  async destroy(req, res, next) {
    try {
      const { id } = req.params;
      const event = await Event.findById(id);
      if (!event) return res.status(404).json({ success: false, message: 'Evento não encontrado' });

      // Verificar permissão
  if (event.organizador_id.toString() !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Você não tem permissão para deletar este evento' });
      }

      // Remover todas as imagens
      if (event.imagens && event.imagens.length > 0) {
        event.imagens.forEach(imgPath => {
          const fullPath = path.join(__dirname, '../../public', imgPath);
          if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        });
      }

      await Event.deleteOne({ _id: id });

      return res.json({ success: true, message: 'Evento deletado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  // Listar eventos do organizador
  async myEvents(req, res, next) {
    try {
  const events = await Event.find({ organizador_id: req.userId }).sort({ date: 1 });

      // Para cada evento, incluir participantes (opcional para economizar queries podemos omitir)
        const results = [];
        for (const ev of events) {
          const participants = await Enrollment.find({ evento_id: ev._id }).populate('usuario_id', 'nome email');
          const evObj = ev.toObject();
          evObj.organizer = evObj.organizador_id || null;
          evObj.participants = participants.map(p => ({ status: p.status, enrollment_date: p.data_inscricao, user: p.usuario_id }));
          results.push(evObj);
        }

      return res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  // Fechar ou abrir vendas de ingressos (apenas admin)
  async setSalesClosed(req, res, next) {
    try {
      const { id } = req.params;
      const { closed } = req.body;
      const event = await Event.findById(id);
      if (!event) return res.status(404).json({ success: false, message: 'Evento não encontrado' });

      // Apenas o organizador do evento ou admin podem alterar
      if (event.organizador_id.toString() !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Você não tem permissão para esta ação' });
      }
      event.vendas_encerradas = !!closed;
      await event.save();

      return res.json({ success: true, message: `Vendas ${event.sales_closed ? 'encerradas' : 'reabertas'} com sucesso`, data: event });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EventController();
