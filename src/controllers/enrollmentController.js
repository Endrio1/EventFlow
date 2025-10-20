const { Enrollment, Event, User } = require('../models');
const sequelize = require('../config/database');

class EnrollmentController {
  // Inscrever-se em um evento
  async enroll(req, res, next) {
    const transaction = await sequelize.transaction();

    try {
      const { eventId } = req.params;
      const userId = req.userId;

      // Buscar evento
      const event = await Event.findByPk(eventId, { transaction });

      if (!event) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Evento não encontrado'
        });
      }

      // Verificar status do evento
      if (event.status !== 'active') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Este evento não está mais disponível para inscrições'
        });
      }

      // Verificar data do evento
      if (new Date(event.date) < new Date()) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Não é possível se inscrever em eventos passados'
        });
      }

      // Verificar se já está inscrito
      const existingEnrollment = await Enrollment.findOne({
        where: { user_id: userId, event_id: eventId },
        transaction
      });

      if (existingEnrollment) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: existingEnrollment.status === 'cancelled' 
            ? 'Você cancelou sua inscrição anteriormente. Contate o organizador.'
            : 'Você já está inscrito neste evento'
        });
      }

      // Verificar capacidade
      if (event.current_enrollments >= event.capacity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Este evento já atingiu a capacidade máxima'
        });
      }

      // Criar inscrição
      const enrollment = await Enrollment.create({
        user_id: userId,
        event_id: eventId,
        status: 'confirmed'
      }, { transaction });

      // Atualizar contador de inscrições
      event.current_enrollments += 1;
      await event.save({ transaction });

      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: 'Inscrição realizada com sucesso',
        data: enrollment
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Cancelar inscrição
  async cancel(req, res, next) {
    const transaction = await sequelize.transaction();

    try {
      const { eventId } = req.params;
      const userId = req.userId;

      // Buscar inscrição
      const enrollment = await Enrollment.findOne({
        where: { user_id: userId, event_id: eventId },
        transaction
      });

      if (!enrollment) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Inscrição não encontrada'
        });
      }

      if (enrollment.status === 'cancelled') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Esta inscrição já foi cancelada'
        });
      }

      // Buscar evento
      const event = await Event.findByPk(eventId, { transaction });

      // Atualizar status da inscrição
      enrollment.status = 'cancelled';
      await enrollment.save({ transaction });

      // Atualizar contador de inscrições
      if (event && event.current_enrollments > 0) {
        event.current_enrollments -= 1;
        await event.save({ transaction });
      }

      await transaction.commit();

      return res.json({
        success: true,
        message: 'Inscrição cancelada com sucesso'
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Listar inscrições do usuário
  async myEnrollments(req, res, next) {
    try {
      const userId = req.userId;

      const enrollments = await Enrollment.findAll({
        where: { user_id: userId },
        include: [{
          model: Event,
          as: 'event',
          include: [{
            model: User,
            as: 'organizer',
            attributes: ['id', 'name', 'email']
          }]
        }],
        order: [['enrollment_date', 'DESC']]
      });

      return res.json({
        success: true,
        data: enrollments
      });
    } catch (error) {
      next(error);
    }
  }

  // Listar participantes de um evento (apenas organizador)
  async eventParticipants(req, res, next) {
    try {
      const { eventId } = req.params;

      // Verificar se evento existe e se usuário é o organizador
      const event = await Event.findByPk(eventId);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento não encontrado'
        });
      }

      if (event.organizer_id !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Você não tem permissão para ver os participantes deste evento'
        });
      }

      // Buscar participantes
      const enrollments = await Enrollment.findAll({
        where: { event_id: eventId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }],
        order: [['enrollment_date', 'DESC']]
      });

      return res.json({
        success: true,
        data: {
          event: {
            id: event.id,
            title: event.title,
            capacity: event.capacity,
            current_enrollments: event.current_enrollments
          },
          enrollments
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EnrollmentController();
