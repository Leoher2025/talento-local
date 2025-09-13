// - Sistema de logging personalizado
// Un logger simple pero efectivo para desarrollo y producción

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  // Formatear timestamp
  getTimestamp() {
    return new Date().toISOString();
  }

  // Método base para logging
  log(level, message, ...args) {
    const timestamp = this.getTimestamp();
    const formattedMessage = `[${timestamp}] [${level}]`;
    
    if (this.isDevelopment) {
      // En desarrollo, usar colores
      console.log(formattedMessage, message, ...args);
    } else {
      // En producción, formato JSON para mejor parsing
      console.log(JSON.stringify({
        timestamp,
        level,
        message,
        data: args.length > 0 ? args : undefined
      }));
    }
  }

  // Métodos específicos por nivel
  info(message, ...args) {
    if (this.isDevelopment) {
      console.log(
        `${colors.blue}[${this.getTimestamp()}] [INFO]${colors.reset}`,
        message,
        ...args
      );
    } else {
      this.log('INFO', message, ...args);
    }
  }

  success(message, ...args) {
    if (this.isDevelopment) {
      console.log(
        `${colors.green}[${this.getTimestamp()}] [SUCCESS]${colors.reset}`,
        message,
        ...args
      );
    } else {
      this.log('SUCCESS', message, ...args);
    }
  }

  warn(message, ...args) {
    if (this.isDevelopment) {
      console.warn(
        `${colors.yellow}[${this.getTimestamp()}] [WARN]${colors.reset}`,
        message,
        ...args
      );
    } else {
      this.log('WARN', message, ...args);
    }
  }

  error(message, ...args) {
    if (this.isDevelopment) {
      console.error(
        `${colors.red}[${this.getTimestamp()}] [ERROR]${colors.reset}`,
        message,
        ...args
      );
    } else {
      this.log('ERROR', message, ...args);
    }
  }

  debug(message, ...args) {
    // Solo mostrar debug en desarrollo
    if (this.isDevelopment) {
      console.log(
        `${colors.magenta}[${this.getTimestamp()}] [DEBUG]${colors.reset}`,
        message,
        ...args
      );
    }
  }

  // Para queries de base de datos
  query(sql, params) {
    if (this.isDevelopment) {
      console.log(
        `${colors.cyan}[${this.getTimestamp()}] [QUERY]${colors.reset}`,
        sql.substring(0, 100),
        params ? `Params: ${JSON.stringify(params)}` : ''
      );
    }
  }
}

// Exportar una instancia única (singleton)
module.exports = new Logger();