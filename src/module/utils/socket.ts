/**
 * Socket communication utilities for Beyond Foundry module
 */

import { MODULE_ID } from '../../beyond-foundry.js';
import { log } from './logger.js';
import type { SocketMessage } from '../../types/index.js';

export class BeyondFoundrySocket {
  private static instance: BeyondFoundrySocket;
  private socketName: string = `module.${MODULE_ID}`;

  public static getInstance(): BeyondFoundrySocket {
    if (!BeyondFoundrySocket.instance) {
      BeyondFoundrySocket.instance = new BeyondFoundrySocket();
    }
    return BeyondFoundrySocket.instance;
  }

  public static initialize(): void {
    const instance = BeyondFoundrySocket.getInstance();
    instance.init();
  }

  private init(): void {
    // Register socket listeners
    game.socket?.on(this.socketName, this.onSocketMessage.bind(this));
    log('Socket communication initialized');
  }

  /**
   * Handle incoming socket messages
   * @param message - The socket message
   */
  private onSocketMessage(message: SocketMessage): void {
    log(`Received socket message: ${message.type}`, 'debug');

    switch (message.type) {
      case 'import-progress':
        this.handleImportProgress(message);
        break;
      case 'import-complete':
        this.handleImportComplete(message);
        break;
      case 'import-error':
        this.handleImportError(message);
        break;
      default:
        log(`Unknown socket message type: ${message.type}`, 'warn');
    }
  }

  /**
   * Send a socket message to all connected clients
   * @param message - The message to send
   */
  public emitMessage(message: SocketMessage): void {
    if (!game.socket) {
      log('Socket not available', 'warn');
      return;
    }

    game.socket.emit(this.socketName, message);
    log(`Sent socket message: ${message.type}`, 'debug');
  }

  /**
   * Send a socket message to a specific user
   * @param userId - The target user ID
   * @param message - The message to send
   */
  public emitToUser(userId: string, message: SocketMessage): void {
    if (!game.socket) {
      log('Socket not available', 'warn');
      return;
    }

    const targetUser = game.users?.get(userId);
    if (!targetUser) {
      log(`User not found: ${userId}`, 'warn');
      return;
    }

    game.socket.emit(this.socketName, message, [userId]);
    log(`Sent socket message to ${targetUser.name}: ${message.type}`, 'debug');
  }

  /* -------------------------------------------- */
  /*  Message Handlers                            */
  /* -------------------------------------------- */

  private handleImportProgress(message: SocketMessage): void {
    // Handle import progress updates
    const data = message.data as { progress: number; status: string };
    log(`Import progress: ${data.progress}% - ${data.status}`, 'debug');
    
    // Update UI if this is the current user's import
    if (message.userId === game.user?.id) {
      ui.notifications?.info(`Import Progress: ${data.status} (${data.progress}%)`);
    }
  }

  private handleImportComplete(message: SocketMessage): void {
    // Handle import completion
    log('Import completed', 'info');
    
    if (message.userId === game.user?.id) {
      ui.notifications?.info('Character import completed successfully!');
    }
  }

  private handleImportError(message: SocketMessage): void {
    // Handle import errors
    const error = message.data as { error: string };
    log(`Import error: ${error.error}`, 'error');
    
    if (message.userId === game.user?.id) {
      ui.notifications?.error(`Import failed: ${error.error}`);
    }
  }
}
