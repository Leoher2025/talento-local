// src/utils/constants.js - Constantes y configuración de la app

// ============================
// CONFIGURACIÓN DE API
// ============================

// IMPORTANTE: Cambia esta IP por la IP de tu computadora en la red local
// Para obtener tu IP en Windows: 
// 1. Abre CMD
// 2. Escribe: ipconfig
// 3. Busca "Dirección IPv4" en tu adaptador de red activo

// Para desarrollo:
// - Dispositivo físico: usa tu IP local (ej: 192.168.1.100)
// - Emulador Android: usa 10.0.2.2
// - Emulador iOS: usa localhost o 127.0.0.1

export const API_URL = 'http://192.168.101.18:5000/api'; // CAMBIA ESTA IP

// ============================
// COLORES DE LA APP
// ============================
export const COLORS = {
  // Colores principales
  primary: '#4F46E5', // Índigo
  secondary: '#10B981', // Verde esmeralda
  accent: '#F59E0B', // Ámbar
  
  // Colores de estado
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Escala de grises
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Colores de fondo
  background: '#F9FAFB',
  surface: '#FFFFFF',
  
  // Colores de texto
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    disabled: '#9CA3AF',
    inverse: '#FFFFFF',
  }
};

// ============================
// TAMAÑOS DE FUENTE
// ============================
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

// ============================
// ESPACIADO
// ============================
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

// ============================
// BORDER RADIUS
// ============================
export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// ============================
// CATEGORÍAS DE TRABAJO
// ============================
export const JOB_CATEGORIES = [
  { id: 'plomeria', name: 'Plomería', icon: '🔧' },
  { id: 'electricidad', name: 'Electricidad', icon: '⚡' },
  { id: 'albanileria', name: 'Albañilería', icon: '🧱' },
  { id: 'carpinteria', name: 'Carpintería', icon: '🔨' },
  { id: 'pintura', name: 'Pintura', icon: '🎨' },
  { id: 'jardineria', name: 'Jardinería', icon: '🌿' },
  { id: 'limpieza', name: 'Limpieza', icon: '🧹' },
  { id: 'cerrajeria', name: 'Cerrajería', icon: '🔐' },
  { id: 'mecanica', name: 'Mecánica', icon: '🔩' },
  { id: 'otros', name: 'Otros', icon: '📋' },
];

// ============================
// ESTADOS DE TRABAJO
// ============================
export const JOB_STATUS = {
  ACTIVE: 'active',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// ============================
// ROLES DE USUARIO
// ============================
export const USER_ROLES = {
  CLIENT: 'client',
  WORKER: 'worker',
  ADMIN: 'admin',
};

// ============================
// MENSAJES COMUNES
// ============================
export const MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
  SERVER_ERROR: 'Error del servidor. Intenta más tarde.',
  INVALID_CREDENTIALS: 'Email o contraseña incorrectos.',
  REQUIRED_FIELD: 'Este campo es requerido.',
  INVALID_EMAIL: 'Email inválido.',
  PASSWORD_MIN_LENGTH: 'La contraseña debe tener al menos 8 caracteres.',
  PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden.',
};

// ============================
// CONFIGURACIÓN DE VALIDACIÓN
// ============================
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  BIO_MAX_LENGTH: 500,
  PHONE_REGEX: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  EMAIL_REGEX: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
};