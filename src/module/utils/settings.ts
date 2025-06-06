/**
 * Module settings registration and management
 */

import { MODULE_ID } from '../../beyond-foundry.js';
import type { BeyondFoundrySettings } from '../../types/index.js';

export function registerSettings(): void {
  // Debug mode setting
  game.settings.register(MODULE_ID, 'debugMode', {
    name: 'BEYOND_FOUNDRY.Settings.DebugMode.Name',
    hint: 'BEYOND_FOUNDRY.Settings.DebugMode.Hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    onChange: (value: boolean) => {
      console.log(`Beyond Foundry debug mode ${value ? 'enabled' : 'disabled'}`);
    }
  });

  // Auto-sync setting
  game.settings.register(MODULE_ID, 'autoSync', {
    name: 'BEYOND_FOUNDRY.Settings.AutoSync.Name',
    hint: 'BEYOND_FOUNDRY.Settings.AutoSync.Hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });

  // Sync interval setting
  game.settings.register(MODULE_ID, 'syncInterval', {
    name: 'BEYOND_FOUNDRY.Settings.SyncInterval.Name',
    hint: 'BEYOND_FOUNDRY.Settings.SyncInterval.Hint',
    scope: 'world',
    config: true,
    type: Number,
    default: 60,
    range: {
      min: 5,
      max: 1440,
      step: 5
    }
  });

  // API endpoint setting
  game.settings.register(MODULE_ID, 'apiEndpoint', {
    name: 'BEYOND_FOUNDRY.Settings.ApiEndpoint.Name',
    hint: 'BEYOND_FOUNDRY.Settings.ApiEndpoint.Hint',
    scope: 'world',
    config: true,
    type: String,
    default: 'https://www.dndbeyond.com'
  });

  // Default import options
  game.settings.register(MODULE_ID, 'defaultImportOptions', {
    name: 'BEYOND_FOUNDRY.Settings.DefaultImportOptions.Name',
    hint: 'BEYOND_FOUNDRY.Settings.DefaultImportOptions.Hint',
    scope: 'world',
    config: false, // This will be configured through a custom settings menu
    type: Object,
    default: {
      importSpells: true,
      importEquipment: true,
      importFeatures: true,
      importBiography: true,
      overrideExisting: false,
      createBackup: true
    }
  });

  // User-specific settings
  game.settings.register(MODULE_ID, 'userApiKey', {
    name: 'BEYOND_FOUNDRY.Settings.UserApiKey.Name',
    hint: 'BEYOND_FOUNDRY.Settings.UserApiKey.Hint',
    scope: 'client',
    config: true,
    type: String,
    default: ''
  });

  // Last sync timestamp
  game.settings.register(MODULE_ID, 'lastSyncTime', {
    scope: 'world',
    config: false,
    type: Number,
    default: 0
  });
}

export function getModuleSetting<K extends keyof BeyondFoundrySettings>(
  key: K
): BeyondFoundrySettings[K] {
  return game.settings.get(MODULE_ID, key) as BeyondFoundrySettings[K];
}

export function setModuleSetting<K extends keyof BeyondFoundrySettings>(
  key: K,
  value: BeyondFoundrySettings[K]
): Promise<BeyondFoundrySettings[K]> {
  return game.settings.set(MODULE_ID, key, value);
}
