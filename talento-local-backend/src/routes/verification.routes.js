// src/routes/verification.routes.js
// Rutas para verificación de identidad

const express = require('express');
const router = express.Router();
const VerificationController = require('../controllers/verification.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

// POST /api/verification/send-sms - Enviar código SMS
router.post('/send-sms', VerificationController.sendSMSCode);

// POST /api/verification/verify-sms - Verificar código SMS
router.post('/verify-sms', VerificationController.verifySMSCode);

// POST /api/verification/resend-code - Reenviar código
router.post('/resend-code', VerificationController.resendCode);

// POST /api/verification/verify-photo - Marcar foto como verificada
router.post('/verify-photo', VerificationController.markProfilePictureVerified);

// GET /api/verification/status - Obtener estado de verificación
router.get('/status', VerificationController.getStatus);

module.exports = router;