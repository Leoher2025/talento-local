// src/utils/notificationHelpers.js
// Funciones auxiliares para enviar notificaciones en eventos específicos

const NotificationService = require('../services/notification.service');

class NotificationHelpers {

  // Notificación cuando aceptan una aplicación
  static async notifyApplicationAccepted(application, job) {
    try {
      await NotificationService.sendNotification(application.worker_id, {
        title: 'Aplicación Aceptada',
        body: `Tu aplicación para "${job.title}" ha sido aceptada`,
        data: {
          jobId: job.id,
          applicationId: application.id,
          screen: 'JobDetail'
        },
        type: 'application_accepted',
        relatedId: application.id,
        relatedType: 'application'
      });
    } catch (error) {
      console.error('Error enviando notificación de aplicación aceptada:', error);
    }
  }

  // Notificación cuando rechazan una aplicación
  static async notifyApplicationRejected(application, job) {
    try {
      await NotificationService.sendNotification(application.worker_id, {
        title: 'Aplicación Rechazada',
        body: `Tu aplicación para "${job.title}" ha sido rechazada`,
        data: {
          jobId: job.id,
          applicationId: application.id
        },
        type: 'application_rejected',
        relatedId: application.id,
        relatedType: 'application'
      });
    } catch (error) {
      console.error('Error enviando notificación de aplicación rechazada:', error);
    }
  }

  // Notificación de nuevo mensaje
  static async notifyNewMessage(recipientId, senderName, message, conversationId) {
    try {
      await NotificationService.sendNotification(recipientId, {
        title: `Nuevo mensaje de ${senderName}`,
        body: message.length > 50 ? message.substring(0, 50) + '...' : message,
        data: {
          conversationId,
          screen: 'ChatScreen'
        },
        type: 'new_message',
        relatedId: conversationId,
        relatedType: 'conversation'
      });
    } catch (error) {
      console.error('Error enviando notificación de mensaje:', error);
    }
  }

  // Notificación de cambio de estado de trabajo
  static async notifyJobStatusChange(userId, job, newStatus) {
    try {
      const statusMessages = {
        'in_progress': `El trabajo "${job.title}" ha iniciado`,
        'completed': `El trabajo "${job.title}" ha sido completado`,
        'cancelled': `El trabajo "${job.title}" ha sido cancelado`
      };

      await NotificationService.sendNotification(userId, {
        title: 'Estado del Trabajo Actualizado',
        body: statusMessages[newStatus] || `Estado del trabajo actualizado`,
        data: {
          jobId: job.id,
          newStatus,
          screen: 'JobDetail'
        },
        type: 'job_status_change',
        relatedId: job.id,
        relatedType: 'job'
      });
    } catch (error) {
      console.error('Error enviando notificación de estado:', error);
    }
  }

  // Notificación de nueva review recibida
  static async notifyNewReview(userId, reviewerName, rating, jobTitle) {
    try {
      await NotificationService.sendNotification(userId, {
        title: 'Nueva Calificación Recibida',
        body: `${reviewerName} te ha calificado con ${rating} estrellas por "${jobTitle}"`,
        data: {
          screen: 'Profile'
        },
        type: 'new_review',
        relatedType: 'review'
      });
    } catch (error) {
      console.error('Error enviando notificación de review:', error);
    }
  }

  // Notificación de nueva aplicación (para clientes)
  static async notifyNewApplication(clientId, workerName, jobTitle, jobId) {
    try {
      await NotificationService.sendNotification(clientId, {
        title: 'Nueva Aplicación',
        body: `${workerName} ha aplicado a tu trabajo "${jobTitle}"`,
        data: {
          jobId,
          screen: 'ManageApplications'
        },
        type: 'new_application',
        relatedId: jobId,
        relatedType: 'job'
      });
    } catch (error) {
      console.error('Error enviando notificación de nueva aplicación:', error);
    }
  }
}

module.exports = NotificationHelpers;