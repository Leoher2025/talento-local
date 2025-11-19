// Configuración principal de Express
// Aquí configuramos middlewares, rutas y manejo de errores

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

// Importar rutas
const routes = require('./routes');
// Importar el middleware de errores correctamente
const { errorHandler } = require('./middlewares/error.middleware');
const notificationRoutes = require('./routes/notification.routes');
const workerRoutes = require('./routes/worker.routes');
const galleryRoutes = require('./routes/gallery.routes');
const verificationRoutes = require('./routes/verification.routes');
const locationRoutes = require('./routes/location.routes');

// Crear aplicación Express
const app = express();

// ============================
// MIDDLEWARES DE SEGURIDAD
// ============================

// Helmet - Añade headers de seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Lo configuraremos más adelante
  crossOriginEmbedderPolicy: false
}));

// CORS - Permitir peticiones desde el frontend
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true, // Permitir cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================
// MIDDLEWARES DE UTILIDAD
// ============================

// Morgan - Logger de peticiones HTTP
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Formato detallado en desarrollo
} else {
  app.use(morgan('combined')); // Formato estándar en producción
}

// Compression - Comprimir respuestas
app.use(compression());

// Body Parser - Parsear JSON y URL encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Archivos estáticos (para imágenes subidas localmente)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ============================
// RUTAS DE LA API
// ============================

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Bienvenido a Talento Local API',
    version: '1.0.0',
    status: 'active',
    documentation: '/api/docs' // Implementaremos Swagger más adelante
  });
});

// Health check - Para verificar que el servidor está funcionando
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Registrar rutas
app.use('/api/notifications', notificationRoutes);

// Registrar rutas de verificación
app.use('/api/verification', verificationRoutes);

// Registrar rutas de geolocalización
app.use('/api/location', locationRoutes);

// Registrar rutas de galería
app.use('/api/gallery', galleryRoutes);

// Registrar rutas
app.use('/api/workers', workerRoutes);

// Rutas principales de la API
app.use('/api', routes);

// ============================
// MANEJO DE ERRORES
// ============================

// Ruta no encontrada (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

module.exports = app;