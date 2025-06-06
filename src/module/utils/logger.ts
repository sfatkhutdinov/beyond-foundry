import { MODULE_ID } from '../constants.js';

/**
 * Logger utility for Beyond Foundry module
 */
export class Logger {
  private static moduleId = MODULE_ID;

  static log(message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info'): void {
    const prefix = `${this.moduleId} |`;
    
    switch (level) {
      case 'info':
        console.log(prefix, message);
        break;
      case 'warn':
        console.warn(prefix, message);
        break;
      case 'error':
        console.error(prefix, message);
        break;
      case 'debug':
        if (game.settings.get(MODULE_ID, 'debugMode')) {
          console.log(`${prefix} [DEBUG]`, message);
        }
        break;
    }
  }

  static info(message: string): void {
    this.log(message, 'info');
  }

  static warn(message: string): void {
    this.log(message, 'warn');
  }

  static error(message: string): void {
    this.log(message, 'error');
  }

  static debug(message: string): void {
    this.log(message, 'debug');
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
