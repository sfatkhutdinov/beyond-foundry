import { MODULE_ID } from '../constants.js';
/**
 * Logger utility for Beyond Foundry module
 */
export class Logger {
    static log(message, level = 'info') {
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
    static info(message) {
        this.log(message, 'info');
    }
    static warn(message) {
        this.log(message, 'warn');
    }
    static error(message) {
        this.log(message, 'error');
    }
    static debug(message) {
        this.log(message, 'debug');
    }
}
Logger.moduleId = MODULE_ID;
// Convenience export
export const log = Logger.log.bind(Logger);
/**
 * Safely extract error message from unknown error type
 */
export function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
