/**
 * FoundryVTT Hooks Registration and Management
 */

import { log } from '../utils/logger.js';
import { BeyondFoundryAPI } from '../api/BeyondFoundryAPI.js';

/* -------------------------------------------- */
/*  Hook Registration                           */
/* -------------------------------------------- */

export function registerHooks(): void {
  // Register all hooks here
  registerActorHooks();
  registerItemHooks();
  registerCombatHooks();
  registerCanvasHooks();
  
  log('FoundryVTT hooks registered');
}

/* -------------------------------------------- */
/*  Actor Hooks                                 */
/* -------------------------------------------- */

function registerActorHooks(): void {
  // Actor creation hook
  Hooks.on('createActor', (actor: Actor, options: object, userId: string) => {
    log(`Actor created: ${actor.name} by user ${userId}`, 'debug');
    
    // Check if this actor was created by Beyond Foundry
    const isBeyondFoundryActor = actor.getFlag('beyond-foundry', 'imported');
    if (isBeyondFoundryActor) {
      log(`Beyond Foundry imported actor created: ${actor.name}`, 'info');
    }
  });

  // Actor update hook
  Hooks.on('updateActor', (actor: Actor, changes: object, options: object, userId: string) => {
    log(`Actor updated: ${actor.name} by user ${userId}`, 'debug');
    
    // Handle sync conflicts if auto-sync is enabled
    const lastSyncTime = actor.getFlag('beyond-foundry', 'lastSync');
    if (lastSyncTime) {
      // Check if manual changes conflict with sync
      // This would trigger a conflict resolution dialog
    }
  });

  // Actor deletion hook
  Hooks.on('deleteActor', (actor: Actor, options: object, userId: string) => {
    log(`Actor deleted: ${actor.name} by user ${userId}`, 'debug');
  });
}

/* -------------------------------------------- */
/*  Item Hooks                                  */
/* -------------------------------------------- */

function registerItemHooks(): void {
  // Item creation hook
  Hooks.on('createItem', (item: Item, options: object, userId: string) => {
    log(`Item created: ${item.name} by user ${userId}`, 'debug');
  });

  // Item update hook
  Hooks.on('updateItem', (item: Item, changes: object, options: object, userId: string) => {
    log(`Item updated: ${item.name} by user ${userId}`, 'debug');
  });
}

/* -------------------------------------------- */
/*  Combat Hooks                                */
/* -------------------------------------------- */

function registerCombatHooks(): void {
  // Combat start hook
  Hooks.on('combatStart', (combat: Combat, updateData: object) => {
    log(`Combat started: ${combat.scene?.name}`, 'debug');
    
    // Sync character data before combat if auto-sync is enabled
    // This ensures all character stats are up to date
  });

  // Combat turn hook
  Hooks.on('combatTurn', (combat: Combat, updateData: object, updateOptions: object) => {
    const currentCombatant = combat.combatant;
    if (currentCombatant?.actor) {
      log(`Combat turn: ${currentCombatant.actor.name}`, 'debug');
    }
  });
}

/* -------------------------------------------- */
/*  Canvas Hooks                                */
/* -------------------------------------------- */

function registerCanvasHooks(): void {
  // Canvas ready hook
  Hooks.on('canvasReady', (canvas: Canvas) => {
    log('Canvas ready', 'debug');
  });

  // Token creation hook
  Hooks.on('createToken', (tokenDocument: TokenDocument, options: object, userId: string) => {
    log(`Token created: ${tokenDocument.name} by user ${userId}`, 'debug');
  });
}

/* -------------------------------------------- */
/*  Custom Hooks                                */
/* -------------------------------------------- */

/**
 * Call when a character import starts
 * @param characterUrl - The D&D Beyond character URL
 * @param options - Import options
 */
export function callImportStartHook(characterUrl: string, options: object): void {
  Hooks.callAll('beyondFoundry.importStart', characterUrl, options);
}

/**
 * Call when a character import completes
 * @param actor - The created actor
 * @param characterData - The D&D Beyond character data
 */
export function callImportCompleteHook(actor: Actor, characterData: object): void {
  Hooks.callAll('beyondFoundry.importComplete', actor, characterData);
}

/**
 * Call when a character import fails
 * @param error - The error that occurred
 * @param characterUrl - The D&D Beyond character URL
 */
export function callImportErrorHook(error: Error, characterUrl: string): void {
  Hooks.callAll('beyondFoundry.importError', error, characterUrl);
}
