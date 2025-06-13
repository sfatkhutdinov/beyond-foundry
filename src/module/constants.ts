// Module constants
export const MODULE_ID = 'beyond-foundry';
export const MODULE_NAME = 'Beyond Foundry';

// API endpoints - configured for Docker environment
export const DEFAULT_PROXY_URL = 'http://localhost:4000';
export const DOCKER_PROXY_URL = 'http://ddb-proxy:4000';

// D&D Beyond API constants
export const DDB_BASE_URL = 'https://www.dndbeyond.com';
export const DDB_API_BASE = 'https://character-service.dndbeyond.com';

// Settings keys
export const SETTINGS = {
  PROXY_URL: 'proxyUrl',
  USE_DOCKER_PROXY: 'useDockerProxy',
  API_ENDPOINT: 'apiEndpoint',
  DEBUG_MODE: 'debugMode',
  AUTO_IMPORT_ITEMS: 'autoImportItems',
  IMPORT_POLICY: 'importPolicy',
  COBALT_TOKEN: 'cobaltToken',
} as const;

// Default import options
export const DEFAULT_IMPORT_OPTIONS = {
  importItems: true,
  importSpells: true,
  updateExisting: false,
  createCompendiumItems: true,
};

// NOTE: /proxy/classes endpoint now expects /proxy/classes/{classID}-{class_name}
