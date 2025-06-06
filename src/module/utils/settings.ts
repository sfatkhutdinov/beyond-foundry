import { MODULE_ID, SETTINGS, DEFAULT_PROXY_URL, DOCKER_PROXY_URL } from '../constants.js';
import type { ModuleSettings, ImportPolicy } from '../../types/index.js';

/**
 * Register all module settings
 */
export function registerSettings(): void {
  // Proxy configuration
  game.settings.register(MODULE_ID, SETTINGS.PROXY_URL, {
    name: 'beyond-foundry.settings.proxyUrl.name',
    hint: 'beyond-foundry.settings.proxyUrl.hint', 
    scope: 'world',
    config: true,
    type: String,
    default: DEFAULT_PROXY_URL,
    onChange: () => window.location.reload()
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
    }
  });

  // API configuration  
  game.settings.register(MODULE_ID, SETTINGS.API_ENDPOINT, {
    name: 'beyond-foundry.settings.apiEndpoint.name',
    hint: 'beyond-foundry.settings.apiEndpoint.hint',
    scope: 'world',
    config: true,
    type: String,
    default: '',
    onChange: () => window.location.reload()
  });

  // Debug mode
  game.settings.register(MODULE_ID, SETTINGS.DEBUG_MODE, {
    name: 'beyond-foundry.settings.debugMode.name',
    hint: 'beyond-foundry.settings.debugMode.hint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: false
  });

  // Import options
  game.settings.register(MODULE_ID, SETTINGS.AUTO_IMPORT_ITEMS, {
    name: 'beyond-foundry.settings.autoImportItems.name',
    hint: 'beyond-foundry.settings.autoImportItems.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, SETTINGS.IMPORT_POLICY, {
    name: 'beyond-foundry.settings.importPolicy.name', 
    hint: 'beyond-foundry.settings.importPolicy.hint',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      'ask': 'beyond-foundry.settings.importPolicy.ask',
      'update': 'beyond-foundry.settings.importPolicy.update', 
      'replace': 'beyond-foundry.settings.importPolicy.replace',
      'skip': 'beyond-foundry.settings.importPolicy.skip'
    },
    default: 'ask'
  });

  // Authentication
  game.settings.register(MODULE_ID, SETTINGS.COBALT_TOKEN, {
    name: 'beyond-foundry.settings.cobaltToken.name',
    hint: 'beyond-foundry.settings.cobaltToken.hint',
    scope: 'world',
    config: false, // Hidden from UI - managed by auth dialog
    type: String,
    default: ''
  });
}

/**
 * Get a module setting value
 */
export function getModuleSetting<T = any>(settingKey: string): T {
  return game.settings.get(MODULE_ID, settingKey) as T;
}

/**
 * Set a module setting value
 */
export function setModuleSetting(settingKey: string, value: any): Promise<any> {
  return game.settings.set(MODULE_ID, settingKey, value);
}

/**
 * Get all module settings as a typed object
 */
export function getModuleSettings(): ModuleSettings {
  return {
    proxyUrl: getModuleSetting(SETTINGS.PROXY_URL),
    useDockerProxy: getModuleSetting(SETTINGS.USE_DOCKER_PROXY),
    apiEndpoint: getModuleSetting(SETTINGS.API_ENDPOINT), 
    debugMode: getModuleSetting(SETTINGS.DEBUG_MODE),
    autoImportItems: getModuleSetting(SETTINGS.AUTO_IMPORT_ITEMS),
    importPolicy: getModuleSetting(SETTINGS.IMPORT_POLICY) as ImportPolicy,
    cobaltToken: getModuleSetting(SETTINGS.COBALT_TOKEN)
  };
}
