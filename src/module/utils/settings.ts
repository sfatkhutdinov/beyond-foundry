import { MODULE_ID, SETTINGS, DEFAULT_PROXY_URL, DOCKER_PROXY_URL } from '../constants.js';
import type { ModuleSettings, ImportPolicy } from '../../types/index.js';

/**
 * Register all module settings
 */
export function registerSettings(): void {
  // Check if game object is available (i.e., we are in Foundry environment)
  if (typeof game === 'undefined' || !game.settings) {
    console.warn('BeyondFoundry: Game settings not available. Skipping registration. This is expected in test environments.');
    return;
  }

  // Proxy configuration
  game.settings.register(MODULE_ID, SETTINGS.PROXY_URL, {
    name: 'beyond-foundry.settings.proxyUrl.name',
    hint: 'beyond-foundry.settings.proxyUrl.hint',
    scope: 'world',
    config: true,
    type: String,
    default: DEFAULT_PROXY_URL,
    onChange: () => window.location.reload(),
  });

  game.settings.register(MODULE_ID, SETTINGS.USE_DOCKER_PROXY, {
    name: 'beyond-foundry.settings.useDockerProxy.name',
    hint: 'beyond-foundry.settings.useDockerProxy.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    onChange: (value: boolean) => {
      if (value) {
        game.settings.set(MODULE_ID, SETTINGS.PROXY_URL, DOCKER_PROXY_URL);
      } else {
        game.settings.set(MODULE_ID, SETTINGS.PROXY_URL, DEFAULT_PROXY_URL);
      }
    },
  });

  // API configuration
  game.settings.register(MODULE_ID, SETTINGS.API_ENDPOINT, {
    name: 'beyond-foundry.settings.apiEndpoint.name',
    hint: 'beyond-foundry.settings.apiEndpoint.hint',
    scope: 'world',
    config: true,
    type: String,
    default: '',
    onChange: () => window.location.reload(),
  });

  // Debug mode
  game.settings.register(MODULE_ID, SETTINGS.DEBUG_MODE, {
    name: 'beyond-foundry.settings.debugMode.name',
    hint: 'beyond-foundry.settings.debugMode.hint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
  });

  // Import options
  game.settings.register(MODULE_ID, SETTINGS.AUTO_IMPORT_ITEMS, {
    name: 'beyond-foundry.settings.autoImportItems.name',
    hint: 'beyond-foundry.settings.autoImportItems.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_ID, SETTINGS.IMPORT_POLICY, {
    name: 'beyond-foundry.settings.importPolicy.name',
    hint: 'beyond-foundry.settings.importPolicy.hint',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      ask: 'beyond-foundry.settings.importPolicy.ask',
      update: 'beyond-foundry.settings.importPolicy.update',
      replace: 'beyond-foundry.settings.importPolicy.replace',
      skip: 'beyond-foundry.settings.importPolicy.skip',
    },
    default: 'ask',
  });

  // Authentication
  game.settings.register(MODULE_ID, SETTINGS.COBALT_TOKEN, {
    name: 'beyond-foundry.settings.cobaltToken.name',
    hint: 'beyond-foundry.settings.cobaltToken.hint',
    scope: 'world',
    config: false, // Hidden from UI - managed by auth dialog
    type: String,
    default: '',
  });
}

/**
 * Get a module setting value
 */
export function getModuleSetting<T = any>(settingKey: string): T | undefined {
  if (typeof game !== 'undefined' && game.settings && typeof game.settings.get === 'function') {
    return game.settings.get(MODULE_ID, settingKey) as T;
  }
  // In test environment or if game object is not fully available, return undefined or a default
  // The API class will handle providing defaults from testSettings or env vars.
  console.warn(`BeyondFoundry: Attempted to get setting '${settingKey}' but game object is not available. Returning undefined.`);
  return undefined;
}

/**
 * Set a module setting value
 */
export function setModuleSetting(settingKey: string, value: any): Promise<any | void> {
  if (typeof game !== 'undefined' && game.settings && typeof game.settings.set === 'function') {
    return game.settings.set(MODULE_ID, settingKey, value);
  }
  console.warn(`BeyondFoundry: Attempted to set setting '${settingKey}' but game object is not available. Operation skipped.`);
  return Promise.resolve();
}

/**
 * Get all module settings as a typed object
 */
export function getModuleSettings(): Partial<ModuleSettings> {
  if (typeof game !== 'undefined' && game.settings && typeof game.settings.get === 'function') {
    return {
      proxyUrl: getModuleSetting(SETTINGS.PROXY_URL),
      useDockerProxy: getModuleSetting(SETTINGS.USE_DOCKER_PROXY),
      apiEndpoint: getModuleSetting(SETTINGS.API_ENDPOINT),
      debugMode: getModuleSetting(SETTINGS.DEBUG_MODE),
      autoImportItems: getModuleSetting(SETTINGS.AUTO_IMPORT_ITEMS),
      importPolicy: getModuleSetting(SETTINGS.IMPORT_POLICY) as ImportPolicy,
      cobaltToken: getModuleSetting(SETTINGS.COBALT_TOKEN),
    };
  }
  // Return an empty object or defaults if game is not available.
  // The API class will primarily use testSettings or env vars in this case.
  console.warn('BeyondFoundry: Attempted to get all module settings but game object is not available. Returning empty settings object.');
  return {};
}
