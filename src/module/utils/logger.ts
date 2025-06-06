/**
 * Logging utilities for Beyond Foundry module
 */

import { MODULE_ID } from '../../beyond-foundry.js';
import { getModuleSetting } from './settings.js';
import type { LogLevel } from '../../types/index.js';

/* -------------------------------------------- */
/*  Logging Functions                           */
/* -------------------------------------------- */

/**
 * Enhanced logging function with module prefix and debug mode support
 * @param message - The message to log
 * @param level - The log level
 * @param force - Force logging even if debug mode is off
 */
export function log(message: string, level: LogLevel = 'info', force: boolean = false): void {
  const debugMode = getModuleSetting('debugMode') as boolean;
  
  // Only log debug messages if debug mode is enabled or forced
  if (level === 'debug' && !debugMode && !force) {
    return;
  }

  const prefix = `${MODULE_ID} |`;
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${prefix} ${message}`;

  switch (level) {
    case 'debug':
      console.debug(formattedMessage);
      break;
    case 'info':
      console.info(formattedMessage);
      break;
    case 'warn':
      console.warn(formattedMessage);
      break;
    case 'error':
      console.error(formattedMessage);
      break;
    default:
      console.log(formattedMessage);
  }
}

/**
 * Log debug message
 * @param message - The message to log
 */
export function logDebug(message: string): void {
  log(message, 'debug');
}

/**
 * Log info message
 * @param message - The message to log
 */
export function logInfo(message: string): void {
  log(message, 'info');
}

/**
 * Log warning message
 * @param message - The message to log
 */
export function logWarn(message: string): void {
  log(message, 'warn');
}

/**
 * Log error message
 * @param message - The message to log
 */
export function logError(message: string): void {
  log(message, 'error');
}

/**
 * Log an error with stack trace
 * @param error - The error object
 * @param context - Additional context for the error
 */
export function logErrorWithStack(error: Error, context?: string): void {
  const contextMsg = context ? ` (${context})` : '';
  logError(`${error.message}${contextMsg}`);
  if (getModuleSetting('debugMode')) {
    console.error(error);
  }
}
