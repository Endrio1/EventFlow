const { Enrollment, Event, User } = require('../models');

class EnrollmentController {
  // Inscrever-se em um evento
  async enroll(req, res, next) {
    try {
      const { eventId } = req.params;
      const userId = req.userId;

      // Verificar evento e condições, fazer incremento atômico se possível
      // Verificar se já está inscrito
        const existing = await Enrollment.findOne({ usuario_id: userId, evento_id: eventId });
      if (existing) {
        return res.status(400).json({ success: false, message: existing.status === 'cancelled' ? 'Você cancelou sua inscrição anteriormente. Contate o organizador.' : 'Você já está inscrito neste evento' });
      }

      // Tentar incrementar contador de inscrições de forma condicional
      const now = new Date();
      const event = await Event.findOneAndUpdate(
          { _id: eventId, status: 'active', vendas_encerradas: false, data: { $gt: now }, $expr: { $lt: ['$inscricoes_atuais', '$capacidade'] } },
          { $inc: { inscricoes_atuais: 1 } },
        { new: true }
      );

      if (!event) {
        return res.status(400).json({ success: false, message: 'Evento não disponível para inscrição ou capacidade atingida' });
      }

      // Criar inscrição
      let enrollment;
      try {
          enrollment = new Enrollment({ usuario_id: userId, evento_id: eventId, status: 'confirmed' });
        await enrollment.save();
      } catch (err) {
        // Se falha por duplicidade, reverter incremento
        if (err.code === 11000) {
            await Event.findByIdAndUpdate(eventId, { $inc: { inscricoes_atuais: -1 } });
          return res.status(400).json({ success: false, message: 'Você já está inscrito neste evento' });
        }
        // Reverter incremento e repassar erro
          await Event.findByIdAndUpdate(eventId, { $inc: { inscricoes_atuais: -1 } });
        throw err;
      }

      return res.status(201).json({ success: true, message: 'Inscrição realizada com sucesso', data: enrollment });
    } catch (error) {
      next(error);
    }
  }

  // Cancelar inscrição
  async cancel(req, res, next) {
    try {
      const { eventId } = req.params;
      const userId = req.userId;

      // Buscar inscrição
        const enrollment = await Enrollment.findOne({ usuario_id: userId, evento_id: eventId });
      if (!enrollment) return res.status(404).json({ success: false, message: 'Inscrição não encontrada' });

      if (enrollment.status === 'cancelled') return res.status(400).json({ success: false, message: 'Esta inscrição já foi cancelada' });

      // Atualizar status da inscrição
      enrollment.status = 'cancelled';
      await enrollment.save();

      // Atualizar contador de inscrições de forma segura
        await Event.findByIdAndUpdate(eventId, { $inc: { inscricoes_atuais: -1 } });

      return res.json({ success: true, message: 'Inscrição cancelada com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  // Listar inscrições do usuário
  async myEnrollments(req, res, next) {
    try {
      const userId = req.userId;
        const enrollments = await Enrollment.find({ usuario_id: userId }).sort({ data_inscricao: -1 }).populate({ path: 'evento_id', populate: { path: 'organizador_id', select: 'nome email' } });
      return res.json({ success: true, data: enrollments });
    } catch (error) {
      next(error);
    }
  }

  // Listar participantes de um evento (apenas organizador)
  async eventParticipants(req, res, next) {
    try {
      const { eventId } = req.params;
      // Verificar se evento existe e se usuário é o organizador
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ success: false, message: 'Evento não encontrado' });

  if (event.organizador_id.toString() !== req.userId && req.userRole !== 'admin') return res.status(403).json({ success: false, message: 'Você não tem permissão para ver os participantes deste evento' });

      // Buscar participantes
        const enrollments = await Enrollment.find({ evento_id: eventId }).populate('usuario_id', 'nome email').sort({ data_inscricao: -1 });

  return res.json({ success: true, data: { event: { id: event._id, title: event.titulo, capacity: event.capacidade, current_enrollments: event.inscricoes_atuais }, enrollments } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EnrollmentController();
