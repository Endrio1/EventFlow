const { Feedback, Event, User, Enrollment } = require('../models');

class FeedbackController {
  // Criar feedback para um evento
  async create(req, res, next) {
    try {
      const { id: eventoId } = req.params;
      const { nota, comentario } = req.body;

      // Validar evento
      const event = await Event.findById(eventoId);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Evento não encontrado' });
      }

      // Validar nota
      const rating = parseInt(nota, 10);
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Nota inválida (1-5)' });
      }

      // Verificar se usuário participou (tem inscrição confirmada ou 'attended')
  const participation = await Enrollment.findOne({ usuario_id: req.userId, evento_id: eventoId, status: { $in: ['confirmed', 'attended'] } });

      if (!participation) {
        return res.status(403).json({ success: false, message: 'Apenas participantes podem avaliar este evento' });
      }

      // Criar feedback (usuário autenticado)
      const feedback = new Feedback({ evento_id: eventoId, usuario_id: req.userId, nota: rating, comentario: comentario || null });
      await feedback.save();

      // Incluir user simples no retorno
  const result = await Feedback.findById(feedback._id).populate('usuario_id', 'nome email');

      return res.status(201).json({ success: true, message: 'Feedback enviado', data: result });
    } catch (error) {
      // Tratar erro de violação de constraint única (usuário já avaliou)
      if (error && error.code === 11000) {
        return res.status(409).json({ success: false, message: 'Você já avaliou este evento. Use a opção de editar para atualizar sua avaliação.' });
      }
      next(error);
    }
  }

  // Listar feedbacks de um evento
  async listByEvent(req, res, next) {
    try {
      const { id: eventoId } = req.params;

      // Paginação e ordenação
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '10', 10);
      const offset = (page - 1) * limit;
      const sortBy = req.query.sortBy === 'nota' ? 'nota' : 'criado_em';
      const order = (req.query.order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const event = await Event.findById(eventoId);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Evento não encontrado' });
      }

      const count = await Feedback.countDocuments({ evento_id: eventoId });
      const rows = await Feedback.find({ evento_id: eventoId })
        .populate('usuario_id', 'nome')
        .sort({ [sortBy]: order === 'ASC' ? 1 : -1 })
        .skip(offset)
        .limit(limit);

      return res.json({ success: true, data: { feedbacks: rows, pagination: { total: count, page, totalPages: Math.ceil(count / limit), limit } } });
    } catch (error) {
      next(error);
    }
  }

  // Atualizar feedback (somente do próprio usuário)
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { nota, comentario } = req.body;

      const feedback = await Feedback.findById(id);
      if (!feedback) return res.status(404).json({ success: false, message: 'Avaliação não encontrada' });

      // Verificar se é o dono do feedback
      if (feedback.usuario_id.toString() !== req.userId) return res.status(403).json({ success: false, message: 'Você não pode editar esta avaliação' });

      // Atualizar campos
      if (nota) {
        const rating = parseInt(nota, 10);
        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Nota inválida (1-5)' });
        feedback.nota = rating;
      }
      if (comentario !== undefined) feedback.comentario = comentario;

      await feedback.save();

  const result = await Feedback.findById(feedback._id).populate('usuario_id', 'nome');
      return res.json({ success: true, message: 'Avaliação atualizada', data: result });
    } catch (error) {
      next(error);
    }
  }

  // Deletar feedback (somente do próprio usuário)
  async destroy(req, res, next) {
    try {
      const { id } = req.params;
      const feedback = await Feedback.findById(id);
      if (!feedback) return res.status(404).json({ success: false, message: 'Avaliação não encontrada' });

      // Verificar se é o dono do feedback
      if (feedback.usuario_id.toString() !== req.userId) return res.status(403).json({ success: false, message: 'Você não pode deletar esta avaliação' });

      await Feedback.deleteOne({ _id: id });
      return res.json({ success: true, message: 'Avaliação removida com sucesso' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeedbackController();
