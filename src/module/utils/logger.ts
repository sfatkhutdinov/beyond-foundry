import { MODULE_ID } from '../constants';

/**
 * Logger utility for Beyond Foundry module
 */
// Rename Logger class to LoggerImpl (not exported)
class LoggerImplClass {
  private static readonly moduleId = MODULE_ID;
  static log(message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info', data?: unknown): void {
    const prefix = `${this.moduleId} |`;
    switch (level) {
      case 'info':
        console.log(prefix, message, data ?? '');
        break;
      case 'warn':
        console.warn(prefix, message, data ?? '');
        break;
      case 'error':
        console.error(prefix, message, data ?? '');
        break;
      case 'debug': {
        // Only log debug if FoundryVTT and debugMode enabled
        const g = globalThis as { game?: { settings?: { get?: (moduleId: string, key: string) => boolean } } };
        if (typeof window === 'undefined' || typeof g.game === 'undefined' || g.game?.settings?.get?.(MODULE_ID, 'debugMode')) {
          console.log(`${prefix} [DEBUG]`, message, data ?? '');
        }
        break;
      }
    }
  }
  static info(message: string, data?: unknown): void { this.log(message, 'info', data); }
  static warn(message: string, data?: unknown): void { this.log(message, 'warn', data); }
  static error(message: string, data?: unknown): void { this.log(message, 'error', data); }
  static debug(message: string, data?: unknown): void { this.log(message, 'debug', data); }
}
// Patch: CLI/Node fallback for Logger
const isCli = typeof process !== 'undefined' && (process.env.BEYOND_FOUNDRY_CLI || process.argv?.[1]?.includes('ts-node'));

// Use a type alias for logger function to avoid unused parameter linter errors
export type LoggerFn = (...args: unknown[]) => void;
export type LoggerType = {
  info: LoggerFn;
  warn: LoggerFn;
  error: LoggerFn;
  debug: LoggerFn;
};

export const Logger: LoggerType = isCli
  ? {
      info: (...args: unknown[]) => console.log('[INFO]', ...args),
      warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
      error: (...args: unknown[]) => console.error('[ERROR]', ...args),
      debug: (...args: unknown[]) => console.debug('[DEBUG]', ...args),
    }
  : LoggerImplClass;

/**
 * Safely extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
