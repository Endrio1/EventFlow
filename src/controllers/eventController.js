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
        .populate('organizer_id', 'name email')
        .sort({ [sortBy]: order.toUpperCase() === 'ASC' ? 1 : -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit));

      // Normalize para frontend: fornecer `organizer` em vez de `organizer_id`
      const events = eventsFound.map(ev => {
        const obj = ev.toObject();
        obj.organizer = obj.organizer_id || null;
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
      const event = await Event.findById(id).populate('organizer_id', 'name email');
      if (!event) return res.status(404).json({ success: false, message: 'Evento não encontrado' });

      // Buscar participantes confirmados
      const participants = await Enrollment.find({ event_id: id, status: 'confirmed' }).populate('user_id', 'name email');

  const eventObj = event.toObject();
  // Normalizar nome do organizador para a propriedade `organizer` (compatibilidade frontend)
  eventObj.organizer = eventObj.organizer_id || null;
  eventObj.participants = participants.map(p => ({ status: p.status, enrollment_date: p.enrollment_date, user: p.user_id }));

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
        if (req.file) {
          console.log('[EVENT][STORE] file=', {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
          });
        } else {
          console.log('[EVENT][STORE] file= null');
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

      // Criar evento
      const event = new Event({
        title,
        description,
        category,
        location,
        date,
        time,
        capacity: parseInt(capacity),
        image: req.file ? `/uploads/events/${req.file.filename}` : null,
        organizer_id: req.userId
      });
      await event.save();

      return res.status(201).json({ success: true, message: 'Evento criado com sucesso', data: event });
    } catch (error) {
      // Remover arquivo se upload foi feito mas erro ocorreu
      if (req.file) {
        fs.unlinkSync(req.file.path);
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
        if (req.file) {
          console.log('[EVENT][UPDATE] file=', {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
          });
        } else {
          console.log('[EVENT][UPDATE] file= null');
        }
      }
      const { title, description, category, location, date, time, capacity, status } = req.body;

      const event = await Event.findById(id);
      if (!event) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({ success: false, message: 'Evento não encontrado' });
      }

      // Verificar se usuário é o organizador
      if (event.organizer_id.toString() !== req.userId && req.userRole !== 'admin') {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(403).json({ success: false, message: 'Você não tem permissão para editar este evento' });
      }

      // Atualizar campos
      if (title) event.title = title;
      if (description) event.description = description;
      if (category) event.category = category;
      if (location) event.location = location;
      if (date) event.date = date;
      if (time) event.time = time;
      if (capacity) event.capacity = parseInt(capacity);
      if (status) event.status = status;

      // Atualizar imagem se nova foi enviada
      if (req.file) {
        // Remover imagem antiga
        if (event.image) {
          const oldImagePath = path.join(__dirname, '../../public', event.image);
          if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
        }
        event.image = `/uploads/events/${req.file.filename}`;
      }

      await event.save();

      return res.json({ success: true, message: 'Evento atualizado com sucesso', data: event });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
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
      if (event.organizer_id.toString() !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Você não tem permissão para deletar este evento' });
      }

      // Remover imagem
      if (event.image) {
        const imagePath = path.join(__dirname, '../../public', event.image);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
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
      const events = await Event.find({ organizer_id: req.userId }).sort({ date: 1 });

      // Para cada evento, incluir participantes (opcional para economizar queries podemos omitir)
      const results = [];
      for (const ev of events) {
        const participants = await Enrollment.find({ event_id: ev._id }).populate('user_id', 'name email');
        const evObj = ev.toObject();
        evObj.organizer = evObj.organizer_id || null;
        evObj.participants = participants.map(p => ({ status: p.status, enrollment_date: p.enrollment_date, user: p.user_id }));
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
      if (event.organizer_id.toString() !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Você não tem permissão para esta ação' });
      }

      event.sales_closed = !!closed;
      await event.save();

      return res.json({ success: true, message: `Vendas ${event.sales_closed ? 'encerradas' : 'reabertas'} com sucesso`, data: event });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EventController();
