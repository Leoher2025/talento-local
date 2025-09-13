// server.js - Punto de entrada principal del servidor
// Este archivo inicia el servidor Express y conecta la base de datos

require('dotenv').config();
const app = require('./src/app');
const { connectDatabase } = require('./src/config/database');
const logger = require('./src/utils/logger');

// Puerto del servidor (por defecto 5000)
const PORT = process.env.PORT || 5000;

// Función principal para iniciar el servidor
const startServer = async () => {
  try {
    // 1. Conectar a la base de datos
    await connectDatabase();
    logger.info('✅ Base de datos conectada exitosamente');

    // 2. Iniciar el servidor
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor corriendo en puerto ${PORT}`);
      logger.info(`📍 Ambiente: ${process.env.NODE_ENV}`);
      logger.info(`🔗 URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  logger.error('❌ Error no manejado:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('❌ Excepción no capturada:', err);
  process.exit(1);
});

// Iniciar el servidor
startServer();