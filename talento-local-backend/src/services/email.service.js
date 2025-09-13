// - Servicio de envío de emails
// Por ahora es un placeholder, después implementaremos con SendGrid o Nodemailer

const logger = require('../utils/logger');
const TokenService = require('./token.service');

class EmailService {
  // ============================
  // ENVIAR EMAIL DE VERIFICACIÓN
  // ============================
  static async sendVerificationEmail(email, userId) {
    try {
      // Generar token de verificación
      const token = await TokenService.generateVerificationToken(userId, 'email');
      
      // URL de verificación
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
      
      // Plantilla del email
      const emailContent = {
        to: email,
        subject: 'Verifica tu cuenta en Talento Local',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f4f4f4; }
              .button { 
                display: inline-block; 
                padding: 12px 30px; 
                background: #4F46E5; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
              }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>¡Bienvenido a Talento Local!</h1>
              </div>
              <div class="content">
                <h2>Verifica tu dirección de email</h2>
                <p>Gracias por registrarte en Talento Local. Para completar tu registro y comenzar a usar nuestra plataforma, por favor verifica tu dirección de email.</p>
                <center>
                  <a href="${verificationUrl}" class="button">Verificar Email</a>
                </center>
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="word-break: break-all;">${verificationUrl}</p>
                <p><strong>Este enlace expirará en 24 horas.</strong></p>
                <p>Si no creaste una cuenta en Talento Local, puedes ignorar este mensaje.</p>
              </div>
              <div class="footer">
                <p>© 2024 Talento Local - Conectando talento con oportunidades</p>
                <p>Este es un mensaje automático, por favor no respondas a este email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };
      
      // TODO: Implementar envío real con SendGrid o Nodemailer
      // Por ahora solo logueamos
      logger.info(`📧 Email de verificación "enviado" a ${email}`);
      logger.debug(`URL de verificación: ${verificationUrl}`);
      
      // En desarrollo, mostrar el link en consola
      if (process.env.NODE_ENV === 'development') {
        console.log('\n====================================');
        console.log('📧 EMAIL DE VERIFICACIÓN');
        console.log('====================================');
        console.log(`Para: ${email}`);
        console.log(`Link: ${verificationUrl}`);
        console.log('====================================\n');
      }
      
      return true;
    } catch (error) {
      logger.error('Error enviando email de verificación:', error);
      throw error;
    }
  }
  
  // ============================
  // ENVIAR EMAIL DE RESTABLECIMIENTO
  // ============================
  static async sendPasswordResetEmail(email, userId) {
    try {
      // Generar token de restablecimiento
      const token = await TokenService.generateVerificationToken(userId, 'password_reset');
      
      // URL de restablecimiento
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
      
      // Plantilla del email
      const emailContent = {
        to: email,
        subject: 'Restablecer contraseña - Talento Local',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f4f4f4; }
              .button { 
                display: inline-block; 
                padding: 12px 30px; 
                background: #EF4444; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
              }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
              .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 10px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Restablecer Contraseña</h1>
              </div>
              <div class="content">
                <h2>Solicitud de restablecimiento de contraseña</h2>
                <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Talento Local.</p>
                <center>
                  <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                </center>
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="word-break: break-all;">${resetUrl}</p>
                <div class="warning">
                  <strong>⚠️ Importante:</strong> Este enlace expirará en 2 horas por seguridad.
                </div>
                <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este mensaje. Tu contraseña no será cambiada.</p>
                <p>Por seguridad, te recomendamos:</p>
                <ul>
                  <li>No compartir este enlace con nadie</li>
                  <li>Usar una contraseña única y segura</li>
                  <li>Activar la verificación en dos pasos cuando esté disponible</li>
                </ul>
              </div>
              <div class="footer">
                <p>© 2024 Talento Local - Conectando talento con oportunidades</p>
                <p>Este es un mensaje automático, por favor no respondas a este email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };
      
      // TODO: Implementar envío real
      logger.info(`📧 Email de restablecimiento "enviado" a ${email}`);
      
      // En desarrollo, mostrar el link
      if (process.env.NODE_ENV === 'development') {
        console.log('\n====================================');
        console.log('🔐 EMAIL DE RESTABLECIMIENTO');
        console.log('====================================');
        console.log(`Para: ${email}`);
        console.log(`Link: ${resetUrl}`);
        console.log('====================================\n');
      }
      
      return true;
    } catch (error) {
      logger.error('Error enviando email de restablecimiento:', error);
      throw error;
    }
  }
  
  // ============================
  // ENVIAR EMAIL DE BIENVENIDA
  // ============================
  static async sendWelcomeEmail(email, firstName) {
    try {
      const emailContent = {
        to: email,
        subject: '¡Bienvenido a Talento Local!',
        html: `
          <h2>¡Hola ${firstName}!</h2>
          <p>Tu cuenta ha sido verificada exitosamente.</p>
          <p>Ahora puedes comenzar a:</p>
          <ul>
            <li>Buscar trabajadores calificados en tu área</li>
            <li>Publicar trabajos que necesites</li>
            <li>Construir tu red de contactos confiables</li>
          </ul>
          <p>¡Gracias por unirte a nuestra comunidad!</p>
        `
      };
      
      logger.info(`📧 Email de bienvenida "enviado" a ${email}`);
      return true;
    } catch (error) {
      logger.error('Error enviando email de bienvenida:', error);
      throw error;
    }
  }
}

module.exports = EmailService;