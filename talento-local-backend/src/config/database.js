// - Configuración y conexión a PostgreSQL
// Usamos el módulo 'pg' para conectarnos a PostgreSQL

const { Pool } = require('pg');
const logger = require('../utils/logger');

// Configuración de la conexión
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'talento_local_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Edulabs2025.',
  
  // Configuración del pool de conexiones
  max: 20, // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000, // Tiempo de espera antes de cerrar conexión inactiva
  connectionTimeoutMillis: 2000, // Tiempo máximo para establecer conexión
};

// Crear el pool de conexiones
const pool = new Pool(dbConfig);

// Eventos del pool
pool.on('connect', () => {
  logger.info('📊 Nueva conexión establecida con PostgreSQL');
});

pool.on('error', (err) => {
  logger.error('❌ Error inesperado en el pool de PostgreSQL:', err);
  process.exit(-1);
});

// Función para conectar y verificar la base de datos
const connectDatabase = async () => {
  try {
    // Intentar una consulta simple para verificar la conexión
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info(`⏰ PostgreSQL conectado: ${result.rows[0].now}`);
    client.release();
    return true;
  } catch (error) {
    logger.error('❌ Error al conectar con PostgreSQL:', error.message);
    throw error;
  }
};

// Función helper para ejecutar queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log de queries en desarrollo
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Query ejecutado:', {
        text: text.substring(0, 100), // Primeros 100 caracteres
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }
    
    return result;
  } catch (error) {
    logger.error('Error en query:', error);
    throw error;
  }
};

// Función para obtener un cliente del pool (para transacciones)
const getClient = async () => {
  const client = await pool.connect();
  
  // Wrapper para el cliente con logging
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  // Timeout para liberar el cliente
  const timeout = setTimeout(() => {
    logger.error('Cliente no liberado después de 5 segundos');
  }, 5000);
  
  // Sobrescribir release para limpiar el timeout
  client.release = () => {
    clearTimeout(timeout);
    return release();
  };
  
  return client;
};

// Función para ejecutar transacciones
const transaction = async (callback) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Función para cerrar todas las conexiones (útil para tests)
const closeDatabase = async () => {
  await pool.end();
  logger.info('🔌 Conexiones a PostgreSQL cerradas');
};

module.exports = {
  pool,
  connectDatabase,
  query,
  getClient,
  transaction,
  closeDatabase
};