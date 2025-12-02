const { Enrollment, Event, User } = require('../models');

class EnrollmentController {
  // Inscrever-se em um evento
  async enroll(req, res, next) {
    try {
      const { eventId } = req.params;
      const userId = req.userId;

      // Verificar evento e condições, fazer incremento atômico se possível
      // Verificar se já está inscrito
  const mongoose = require('mongoose');
  const userObjId = (mongoose.Types.ObjectId.isValid(userId) && typeof userId === 'string') ? new mongoose.Types.ObjectId(userId) : userId;
  const eventObjId = (mongoose.Types.ObjectId.isValid(eventId) && typeof eventId === 'string') ? new mongoose.Types.ObjectId(eventId) : eventId;

      // DEBUG: Log temporário para investigar inscrições existentes
      console.log('[ENROLL DEBUG] ===== INICIO =====');
      console.log('[ENROLL DEBUG] userId (raw):', userId, 'type:', typeof userId);
      console.log('[ENROLL DEBUG] eventId (raw):', eventId, 'type:', typeof eventId);
      console.log('[ENROLL DEBUG] userObjId:', userObjId, 'type:', typeof userObjId, 'toString:', userObjId.toString());
      console.log('[ENROLL DEBUG] eventObjId:', eventObjId, 'type:', typeof eventObjId, 'toString:', eventObjId.toString());
      
      const existing = await Enrollment.findOne({ usuario_id: userObjId, evento_id: eventObjId });
      
      console.log('[ENROLL DEBUG] Query result - existing:', existing);
      console.log('[ENROLL DEBUG] existing is null?', existing === null);
      console.log('[ENROLL DEBUG] existing is undefined?', existing === undefined);
      
      if (existing) {
        console.log('[ENROLL DEBUG] Found existing enrollment:', {
          id: existing._id,
          status: existing.status,
          usuario_id: existing.usuario_id,
          evento_id: existing.evento_id
        });
        
        // Se inscrição existente e ativa, bloquear
        if (existing.status !== 'cancelled') {
          console.log('[ENROLL DEBUG] Bloqueando inscrição - status:', existing.status);
          return res.status(400).json({ success: false, message: 'Você já está inscrito neste evento' });
        }
        
        console.log('[ENROLL DEBUG] Enrollment was cancelled, allowing re-enrollment');
        // Se estava cancelada, tentaremos reativar (re-enroll)
        // Primeiro, tentar incrementar o contador do evento respeitando capacidade e datas
        const now = new Date();
        const eventForReenroll = await Event.findOneAndUpdate(
          { _id: eventObjId, status: 'active', vendas_encerradas: false, data: { $gt: now }, $expr: { $lt: ['$inscricoes_atuais', '$capacidade'] } },
          { $inc: { inscricoes_atuais: 1 } },
          { new: true }
        );

        if (!eventForReenroll) {
          return res.status(400).json({ success: false, message: 'Evento não disponível para inscrição ou capacidade atingida' });
        }

        existing.status = 'confirmed';
        existing.data_inscricao = new Date();
        await existing.save();

        return res.status(201).json({ success: true, message: 'Inscrição reativada com sucesso', data: existing });
      }

      console.log('[ENROLL DEBUG] No existing enrollment found, proceeding to create new one');
      
      // Verificar condições do evento primeiro para dar mensagens mais claras
      const now = new Date();
      const eventDoc = await Event.findById(eventObjId);
      
      console.log('[ENROLL DEBUG] Event doc:', eventDoc ? {
        id: eventDoc._id,
        status: eventDoc.status,
        vendas_encerradas: eventDoc.vendas_encerradas,
        data: eventDoc.data,
        inscricoes_atuais: eventDoc.inscricoes_atuais,
        capacidade: eventDoc.capacidade
      } : 'null');
      
      if (!eventDoc) {
        console.log('[ENROLL DEBUG] Event not found');
        return res.status(404).json({ success: false, message: 'Evento não encontrado' });
      }

      if (eventDoc.status !== 'active') {
        console.log('[ENROLL DEBUG] Event not active:', eventDoc.status);
        return res.status(400).json({ success: false, message: 'Evento não está ativo para inscrições' });
      }
      if (eventDoc.vendas_encerradas) {
        console.log('[ENROLL DEBUG] Sales closed');
        return res.status(400).json({ success: false, message: 'Vendas para este evento foram encerradas' });
      }
      if (eventDoc.data <= now) {
        console.log('[ENROLL DEBUG] Event date has passed');
        return res.status(400).json({ success: false, message: 'Inscrições encerradas (data do evento já passou)' });
      }
      if (eventDoc.inscricoes_atuais >= eventDoc.capacidade) {
        console.log('[ENROLL DEBUG] Capacity reached');
        return res.status(400).json({ success: false, message: 'Capacidade do evento já atingida' });
      }

      console.log('[ENROLL DEBUG] All validations passed, attempting to increment counter');
      
      // Tentar incrementar contador de inscrições de forma condicional (atomically)
      const event = await Event.findOneAndUpdate(
        { _id: eventObjId, $expr: { $lt: ['$inscricoes_atuais', '$capacidade'] } },
        { $inc: { inscricoes_atuais: 1 } },
        { new: true }
      );

      console.log('[ENROLL DEBUG] Increment result:', event ? 'success' : 'failed');

      if (!event) {
        console.log('[ENROLL DEBUG] Failed to increment (capacity race condition)');
        return res.status(400).json({ success: false, message: 'Evento não disponível para inscrição ou capacidade atingida' });
      }

      console.log('[ENROLL DEBUG] Creating enrollment document');
      
      // Criar inscrição
      let enrollment;
      try {
          enrollment = new Enrollment({ usuario_id: userObjId, evento_id: eventObjId, status: 'confirmed' });
          console.log('[ENROLL DEBUG] Enrollment object created, saving...');
        await enrollment.save();
        console.log('[ENROLL DEBUG] Enrollment saved successfully:', enrollment._id);
      } catch (err) {
        console.log('[ENROLL DEBUG] Error saving enrollment:', err.code, err.message);
        // Se falha por duplicidade, reverter incremento
        if (err.code === 11000) {
          console.log('[ENROLL DEBUG] Duplicate key error (11000), reverting increment');
            await Event.findByIdAndUpdate(eventObjId, { $inc: { inscricoes_atuais: -1 } });
          return res.status(400).json({ success: false, message: 'Você já está inscrito neste evento' });
        }
        // Reverter incremento e repassar erro
        console.log('[ENROLL DEBUG] Other error, reverting increment and throwing');
          await Event.findByIdAndUpdate(eventObjId, { $inc: { inscricoes_atuais: -1 } });
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
  const mongoose = require('mongoose');
  const userObjId = (mongoose.Types.ObjectId.isValid(userId) && typeof userId === 'string') ? new mongoose.Types.ObjectId(userId) : userId;
  const eventObjId = (mongoose.Types.ObjectId.isValid(eventId) && typeof eventId === 'string') ? new mongoose.Types.ObjectId(eventId) : eventId;

      // Buscar inscrição
        const enrollment = await Enrollment.findOne({ usuario_id: userObjId, evento_id: eventObjId });
      if (!enrollment) return res.status(404).json({ success: false, message: 'Inscrição não encontrada' });

      if (enrollment.status === 'cancelled') return res.status(400).json({ success: false, message: 'Esta inscrição já foi cancelada' });

      // Atualizar status da inscrição
      enrollment.status = 'cancelled';
      await enrollment.save();

      // Atualizar contador de inscrições de forma segura
  await Event.findByIdAndUpdate(eventObjId, { $inc: { inscricoes_atuais: -1 } });

      return res.json({ success: true, message: 'Inscrição cancelada com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  // Listar inscrições do usuário
  async myEnrollments(req, res, next) {
    try {
      const userId = req.userId;
  const mongoose = require('mongoose');
  const userObjId = (mongoose.Types.ObjectId.isValid(userId) && typeof userId === 'string') ? new mongoose.Types.ObjectId(userId) : userId;
        const enrollments = await Enrollment.find({ usuario_id: userObjId }).sort({ data_inscricao: -1 }).populate({ path: 'evento_id', populate: { path: 'organizador_id', select: 'nome email' } });
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

  // DEBUG: Endpoint temporário para debug de inscrições
  async debugEnrollments(req, res, next) {
    try {
      const userId = req.userId;
      const { eventId } = req.params;
      
      const mongoose = require('mongoose');
      const userObjId = (mongoose.Types.ObjectId.isValid(userId) && typeof userId === 'string') ? new mongoose.Types.ObjectId(userId) : userId;
      const eventObjId = eventId ? ((mongoose.Types.ObjectId.isValid(eventId) && typeof eventId === 'string') ? new mongoose.Types.ObjectId(eventId) : eventId) : null;
      
      const query = { usuario_id: userObjId };
      if (eventObjId) query.evento_id = eventObjId;
      
      const enrollments = await Enrollment.find(query).lean();
      
      return res.json({ 
        success: true, 
        data: { 
          userId, 
          userObjId: userObjId.toString(), 
          eventId: eventId || 'all',
          eventObjId: eventObjId ? eventObjId.toString() : null,
          count: enrollments.length,
          enrollments: enrollments.map(e => ({
            _id: e._id.toString(),
            usuario_id: e.usuario_id.toString(),
            evento_id: e.evento_id.toString(),
            status: e.status,
            data_inscricao: e.data_inscricao
          }))
        } 
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EnrollmentController();
