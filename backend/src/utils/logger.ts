class Logger {
  info(message: string, data?: any): void {
    console.log(`[INFO] ${new Date().toISOString()} ${message}`, data || '');
  }

  error(message: string, data?: any): void {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, data || '');
  }

  warn(message: string, data?: any): void {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`, data || '');
  }

  debug(message: string, data?: any): void {
    console.debug(`[DEBUG] ${new Date().toISOString()} ${message}`, data || '');
  }
}

export const logger = new Logger();
