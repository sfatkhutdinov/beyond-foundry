import { MODULE_ID } from '../constants.js';

/**
 * Logger utility for Beyond Foundry module
 */
export class Logger {
  private static moduleId = MODULE_ID;

  static log(message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info', data?: unknown): void {
    const prefix = `${this.moduleId} |`;

    switch (level) {
      case 'info':
        console.log(prefix, message, data || '');
        break;
      case 'warn':
        console.warn(prefix, message, data || '');
        break;
      case 'error':
        console.error(prefix, message, data || '');
        break;
      case 'debug':
        if (game.settings.get(MODULE_ID, 'debugMode')) {
          console.log(`${prefix} [DEBUG]`, message, data || '');
        }
        break;
    }
  }

  static info(message: string, data?: unknown): void {
    this.log(message, 'info', data);
  }

  static warn(message: string, data?: unknown): void {
    this.log(message, 'warn', data);
  }

  static error(message: string, data?: unknown): void {
    this.log(message, 'error', data);
  }

  static debug(message: string, data?: unknown): void {
    this.log(message, 'debug', data);
  }
}

// Convenience export
export const log = Logger.log.bind(Logger);

/**
 * Safely extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
