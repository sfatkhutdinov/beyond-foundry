/**
 * Beyond Foundry Module
 * A FoundryVTT module for importing D&D Beyond purchased data
 */

import { BeyondFoundryAPI } from './module/api/BeyondFoundryAPI.js';
import { registerSettings } from './module/utils/settings.js';
import { registerHooks } from './module/hooks/index.js';
import { BeyondFoundrySocket } from './module/utils/socket.js';
import { log } from './module/utils/logger.js';

/* -------------------------------------------- */
/*  Module Constants                            */
/* -------------------------------------------- */

export const MODULE_ID = 'beyond-foundry' as const;
export const MODULE_TITLE = 'Beyond Foundry' as const;

/* -------------------------------------------- */
/*  Initialize Module                           */
/* -------------------------------------------- */

Hooks.once('init', async (): Promise<void> => {
  log('Initializing Beyond Foundry module...');
  
  // Register module settings
  registerSettings();
  
  // Initialize API
  BeyondFoundryAPI.initialize();
  
  // Register hooks
  registerHooks();
  
  log('Beyond Foundry module initialized successfully');
});

/* -------------------------------------------- */
/*  Setup Module                                */
/* -------------------------------------------- */

Hooks.once('setup', async (): Promise<void> => {
  log('Setting up Beyond Foundry module...');
  
  // Setup socket communication if needed
  BeyondFoundrySocket.initialize();
  
  log('Beyond Foundry module setup complete');
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', async (): Promise<void> => {
  log('Beyond Foundry module ready');
  
  // Notify users about module readiness
  if (game.user?.isGM) {
    ui.notifications?.info(`${MODULE_TITLE} is ready! Access import tools from the module settings.`);
  }
});

/* -------------------------------------------- */
/*  Hot Reload Support                          */
/* -------------------------------------------- */

if (import.meta.hot) {
  import.meta.hot.accept();
}
