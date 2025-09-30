// src/middlewares/upload.middleware.js
// Middleware para manejo de subida de archivos

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Crear directorios si no existen
const createUploadDirs = () => {
  const dirs = [
    'public/uploads/profiles',
    'public/uploads/gallery',
    'public/uploads/jobs',
    'public/uploads/documents'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, '../../', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      logger.info(`Directorio creado: ${fullPath}`);
    }
  });
};

// Crear directorios al iniciar
createUploadDirs();

// ============================
// CONFIGURACIÓN DE MULTER PARA FOTOS DE PERFIL
// ============================
const profilePictureStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads/profiles'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const profilePictureFilter = (req, file, cb) => {
  // Validar tipo de archivo
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'), false);
  }
};

const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  fileFilter: profilePictureFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// ============================
// CONFIGURACIÓN DE MULTER PARA GALERÍA
// ============================
const galleryStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads/gallery'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `gallery-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const galleryFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes'), false);
  }
};

const uploadGalleryPhoto = multer({
  storage: galleryStorage,
  fileFilter: galleryFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo para galería
  }
});

// ============================
// CONFIGURACIÓN DE MULTER PARA TRABAJOS
// ============================
const jobImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads/jobs'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `job-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const uploadJobImage = multer({
  storage: jobImageStorage,
  fileFilter: galleryFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

// ============================
// CONFIGURACIÓN DE MULTER PARA DOCUMENTOS
// ============================
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads/documents'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const documentFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes y PDF'), false);
  }
};

const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

// ============================
// MIDDLEWARE DE ERROR PARA MULTER
// ============================
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({
        success: false,
        message: 'El archivo es demasiado grande. Tamaño máximo permitido: 10MB'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Campo de archivo inesperado'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: `Error al subir archivo: ${error.message}`
    });
  }
  
  if (error.message && error.message.includes('Tipo de archivo no permitido')) {
    return res.status(415).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

module.exports = {
  uploadProfilePicture,
  uploadGalleryPhoto,
  uploadJobImage,
  uploadDocument,
  handleMulterError
};