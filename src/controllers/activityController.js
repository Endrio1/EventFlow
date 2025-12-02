const { Activity, Event } = require('../models');
const mongoose = require('mongoose');

class ActivityController {
  // Listar atividades de um evento
  async listByEvent(req, res, next) {
    try {
      const { eventId } = req.params;
      
      const eventObjId = (mongoose.Types.ObjectId.isValid(eventId) && typeof eventId === 'string') 
        ? new mongoose.Types.ObjectId(eventId) 
        : eventId;

      const activities = await Activity.find({ evento_id: eventObjId })
        .sort({ ordem: 1, data_inicio: 1 });

      return res.json({ success: true, data: activities });
    } catch (error) {
      next(error);
    }
  }

  // Obter uma atividade por ID
  async getById(req, res, next) {
    try {
      const { activityId } = req.params;
      
      const activity = await Activity.findById(activityId);
      if (!activity) {
        return res.status(404).json({ success: false, message: 'Atividade não encontrada' });
      }

      return res.json({ success: true, data: activity });
    } catch (error) {
      next(error);
    }
  }

  // Criar nova atividade
  async create(req, res, next) {
    try {
      const { eventId } = req.params;
      const userId = req.userId;

      const eventObjId = (mongoose.Types.ObjectId.isValid(eventId) && typeof eventId === 'string') 
        ? new mongoose.Types.ObjectId(eventId) 
        : eventId;

      // Verificar se o evento existe e pertence ao usuário
      const event = await Event.findById(eventObjId);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Evento não encontrado' });
      }

      if (event.organizador_id.toString() !== userId && req.userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Você não tem permissão para adicionar atividades a este evento' });
      }

      // Extrair dados do corpo (aceita pt ou en)
      const {
        titulo, title,
        descricao, description,
        palestrante, speaker,
        local, location,
        data_inicio, start_date,
        data_fim, end_date,
        tipo, type,
        vagas, capacity,
        ordem, order
      } = req.body;

      const activity = new Activity({
        evento_id: eventObjId,
        titulo: titulo || title,
        descricao: descricao || description || '',
        palestrante: palestrante || speaker || '',
        local: local || location || '',
        data_inicio: data_inicio || start_date,
        data_fim: data_fim || end_date,
        tipo: tipo || type || 'palestra',
        vagas: vagas || capacity || 0,
        ordem: ordem || order || 0
      });

      await activity.save();

      return res.status(201).json({ 
        success: true, 
        message: 'Atividade criada com sucesso', 
        data: activity 
      });
    } catch (error) {
      next(error);
    }
  }

  // Atualizar atividade
  async update(req, res, next) {
    try {
      const { activityId } = req.params;
      const userId = req.userId;

      const activity = await Activity.findById(activityId);
      if (!activity) {
        return res.status(404).json({ success: false, message: 'Atividade não encontrada' });
      }

      // Verificar permissão
      const event = await Event.findById(activity.evento_id);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Evento não encontrado' });
      }

      if (event.organizador_id.toString() !== userId && req.userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Você não tem permissão para editar esta atividade' });
      }

      // Extrair dados do corpo (aceita pt ou en)
      const {
        titulo, title,
        descricao, description,
        palestrante, speaker,
        local, location,
        data_inicio, start_date,
        data_fim, end_date,
        tipo, type,
        vagas, capacity,
        ordem, order
      } = req.body;

      // Atualizar campos
      if (titulo || title) activity.titulo = titulo || title;
      if (descricao !== undefined || description !== undefined) activity.descricao = descricao || description || '';
      if (palestrante !== undefined || speaker !== undefined) activity.palestrante = palestrante || speaker || '';
      if (local !== undefined || location !== undefined) activity.local = local || location || '';
      if (data_inicio || start_date) activity.data_inicio = data_inicio || start_date;
      if (data_fim || end_date) activity.data_fim = data_fim || end_date;
      if (tipo || type) activity.tipo = tipo || type;
      if (vagas !== undefined || capacity !== undefined) activity.vagas = vagas || capacity || 0;
      if (ordem !== undefined || order !== undefined) activity.ordem = ordem || order || 0;

      await activity.save();

      return res.json({ 
        success: true, 
        message: 'Atividade atualizada com sucesso', 
        data: activity 
      });
    } catch (error) {
      next(error);
    }
  }

  // Deletar atividade
  async delete(req, res, next) {
    try {
      const { activityId } = req.params;
      const userId = req.userId;

      const activity = await Activity.findById(activityId);
      if (!activity) {
        return res.status(404).json({ success: false, message: 'Atividade não encontrada' });
      }

      // Verificar permissão
      const event = await Event.findById(activity.evento_id);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Evento não encontrado' });
      }

      if (event.organizador_id.toString() !== userId && req.userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Você não tem permissão para deletar esta atividade' });
      }

      await Activity.findByIdAndDelete(activityId);

      return res.json({ success: true, message: 'Atividade deletada com sucesso' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ActivityController();
