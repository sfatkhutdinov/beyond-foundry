import { MODULE_ID, MODULE_NAME } from './constants.js';
import { registerSettings } from './utils/settings.js';
import { Logger } from './utils/logger.js';
import { BeyondFoundryAPI } from './api/BeyondFoundryAPI.js';
import { ModuleRegistration } from './api/ModuleRegistration.js';
import { CharacterImportDialog } from './apps/CharacterImportDialog.js';

/**
 * Beyond Foundry Module Entry Point
 *
 * This module allows importing purchased D&D Beyond content into FoundryVTT
 * with support for characters, spells, items, and more.
 * 
 * Enhanced with RESTful API endpoints and Foundry VTT integration
 * as specified in the endpoint conversion strategy.
 */

// Initialize module when Foundry is ready
Hooks.once('init', async () => {
  Logger.info(`Initializing ${MODULE_NAME}...`);

  // Register module settings
  registerSettings();

  // Initialize core API
  const api = BeyondFoundryAPI.getInstance();
  
  // Store core API reference for basic access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (game as any).modules.get(MODULE_ID)!.api = api;

  Logger.info(`${MODULE_NAME} initialized successfully`);
});

// Setup module when ready - Enhanced Registration
Hooks.once('ready', async () => {
  Logger.info(`${MODULE_NAME} ready - Setting up enhanced endpoints...`);

  // Initialize API with current settings
  const api = BeyondFoundryAPI.getInstance();
  api.init();

  // Enhanced Module Registration with endpoint conversion strategy
  const moduleRegistration = new ModuleRegistration();
  moduleRegistration.register();

  // Add console message for developers
  Logger.info('🚀 Beyond Foundry API ready!');
  Logger.info('💡 Access via: game.beyondFoundry');
  Logger.info('📚 Documentation: game.beyondFoundry.docs');
  Logger.info('🎯 Examples: game.beyondFoundry.examples');
  Logger.info('🔧 WebSocket updates enabled via Socket.io');
});

// Add character sheet header button for import
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Hooks.on('getActorSheetHeaderButtons', (app: any, buttons: any[]) => {
  // Only add to character sheets in D&D 5e system
  if (app.actor?.type !== 'character' || game.system.id !== 'dnd5e') {
    return;
  }

  buttons.unshift({
    label: 'Import from D&D Beyond',
    class: 'beyond-foundry-import',
    icon: 'fas fa-download',
    onclick: () => {
      Logger.info('D&D Beyond import button clicked');
      CharacterImportDialog.show();
    },
  });
});

// Add actor directory context menu option
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Hooks.on('getActorDirectoryEntryContext', (html: any, options: any[]) => {
  options.push({
    name: 'Import from D&D Beyond',
    icon: '<i class="fas fa-download"></i>',
    condition: () => game.system.id === 'dnd5e',
    callback: () => {
      Logger.info('D&D Beyond import context menu clicked');
      CharacterImportDialog.show();
    },
  });
});

// Console command for testing (development)
Hooks.once('ready', () => {
  if (game.settings.get(MODULE_ID, 'debugMode')) {
    Logger.info('Debug mode enabled - test commands available');
    Logger.info('Try: game.modules.get("beyond-foundry").api.runConnectionTest()');
  }
});

Logger.info(`${MODULE_NAME} module loaded`);
