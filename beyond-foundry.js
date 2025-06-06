// Module constants
const MODULE_ID = 'beyond-foundry';
const MODULE_NAME = 'Beyond Foundry';
// API endpoints - configured for Docker environment
const DEFAULT_PROXY_URL = 'http://localhost:3100';
const DOCKER_PROXY_URL = 'http://ddb-proxy:3000';
// Settings keys
const SETTINGS = {
    PROXY_URL: 'proxyUrl',
    USE_DOCKER_PROXY: 'useDockerProxy',
    API_ENDPOINT: 'apiEndpoint',
    DEBUG_MODE: 'debugMode',
    AUTO_IMPORT_ITEMS: 'autoImportItems',
    IMPORT_POLICY: 'importPolicy'
};
// Default import options
const DEFAULT_IMPORT_OPTIONS = {
    importItems: true,
    importSpells: true,
    updateExisting: false,
    createCompendiumItems: true
};

/**
 * Register all module settings
 */
function registerSettings() {
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
        onChange: (value) => {
            if (value) {
                game.settings.set(MODULE_ID, SETTINGS.PROXY_URL, DOCKER_PROXY_URL);
            }
            else {
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
}
/**
 * Get a module setting value
 */
function getModuleSetting(settingKey) {
    return game.settings.get(MODULE_ID, settingKey);
}
/**
 * Get all module settings as a typed object
 */
function getModuleSettings() {
    return {
        proxyUrl: getModuleSetting(SETTINGS.PROXY_URL),
        useDockerProxy: getModuleSetting(SETTINGS.USE_DOCKER_PROXY),
        apiEndpoint: getModuleSetting(SETTINGS.API_ENDPOINT),
        debugMode: getModuleSetting(SETTINGS.DEBUG_MODE),
        autoImportItems: getModuleSetting(SETTINGS.AUTO_IMPORT_ITEMS),
        importPolicy: getModuleSetting(SETTINGS.IMPORT_POLICY)
    };
}

/**
 * Logger utility for Beyond Foundry module
 */
class Logger {
    static moduleId = MODULE_ID;
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
// Convenience export
Logger.log.bind(Logger);
/**
 * Safely extract error message from unknown error type
 */
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

/**
 * Main API class for Beyond Foundry module
 * Handles communication with ddb-proxy and data transformation
 */
class BeyondFoundryAPI {
    static instance;
    proxyEndpoint = '';
    apiEndpoint = '';
    initialized = false;
    constructor() { }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!BeyondFoundryAPI.instance) {
            BeyondFoundryAPI.instance = new BeyondFoundryAPI();
        }
        return BeyondFoundryAPI.instance;
    }
    /**
     * Initialize the API with current settings
     */
    init() {
        if (this.initialized)
            return;
        const settings = getModuleSettings();
        this.proxyEndpoint = settings.proxyUrl;
        this.apiEndpoint = settings.apiEndpoint;
        this.initialized = true;
        Logger.info('BeyondFoundryAPI initialized');
        // Test proxy connection on init
        this.testProxyConnection().catch(error => {
            Logger.warn(`Initial proxy connection test failed: ${error.message}`);
        });
    }
    /**
     * Test connection to ddb-proxy
     */
    async testProxyConnection() {
        try {
            Logger.debug(`Testing proxy connection to: ${this.proxyEndpoint}`);
            const response = await fetch(`${this.proxyEndpoint}/ping`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                Logger.info('Proxy connection successful');
                return true;
            }
            else {
                Logger.warn(`Proxy connection failed with status: ${response.status}`);
                return false;
            }
        }
        catch (error) {
            Logger.error(`Proxy connection error: ${getErrorMessage(error)}`);
            return false;
        }
    }
    /**
     * Authenticate with D&D Beyond through proxy
     * @param cobaltToken - The D&D Beyond Cobalt session token
     */
    async authenticate(cobaltToken) {
        try {
            Logger.debug('Attempting authentication with D&D Beyond');
            const response = await fetch(`${this.proxyEndpoint}/proxy/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cobaltToken: cobaltToken
                })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                Logger.info('Authentication successful');
                return {
                    success: true,
                    userId: data.userId,
                    message: 'Authentication successful'
                };
            }
            else {
                Logger.warn(`Authentication failed: ${data.message || 'Unknown error'}`);
                return {
                    success: false,
                    message: data.message || 'Authentication failed'
                };
            }
        }
        catch (error) {
            Logger.error(`Authentication error: ${error.message}`);
            return {
                success: false,
                message: `Authentication error: ${error.message}`
            };
        }
    }
    /**
     * Get list of characters from D&D Beyond
     */
    async getCharacterList() {
        try {
            Logger.debug('Fetching character list from D&D Beyond');
            const response = await fetch(`${this.proxyEndpoint}/proxy/api/character/list`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            const data = await response.json();
            if (response.ok && data.success) {
                Logger.info(`Retrieved ${data.characters?.length || 0} characters`);
                return {
                    success: true,
                    characters: data.characters || []
                };
            }
            else {
                Logger.warn(`Failed to retrieve characters: ${data.message || 'Unknown error'}`);
                return {
                    success: false,
                    error: data.message || 'Failed to retrieve characters'
                };
            }
        }
        catch (error) {
            Logger.error(`Character list error: ${error.message}`);
            return {
                success: false,
                error: `Character list error: ${error.message}`
            };
        }
    }
    /**
     * Get character data from D&D Beyond
     * @param characterId - The D&D Beyond character ID
     */
    async getCharacter(characterId) {
        try {
            Logger.debug(`Fetching character data for ID: ${characterId}`);
            const response = await fetch(`${this.proxyEndpoint}/proxy/api/character/get`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    characterId: characterId
                })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                Logger.info(`Retrieved character data for: ${data.character?.name || 'Unknown'}`);
                return data.character;
            }
            else {
                Logger.warn(`Failed to retrieve character: ${data.message || 'Unknown error'}`);
                return null;
            }
        }
        catch (error) {
            Logger.error(`Character fetch error: ${error.message}`);
            return null;
        }
    }
    /**
     * Import a character from D&D Beyond to FoundryVTT
     * @param characterId - The D&D Beyond character ID
     * @param options - Import options
     */
    async importCharacter(characterId, options = {}) {
        try {
            Logger.info(`Starting character import for ID: ${characterId}`);
            // Get character data from D&D Beyond
            const ddbCharacter = await this.getCharacter(characterId);
            if (!ddbCharacter) {
                return {
                    success: false,
                    errors: ['Failed to fetch character data from D&D Beyond']
                };
            }
            // Merge options with defaults
            const importOptions = { ...DEFAULT_IMPORT_OPTIONS, ...options };
            // TODO: Implement character parsing and creation
            // This is where we'll transform DDB data to Foundry format
            Logger.warn('Character parsing not yet implemented');
            return {
                success: false,
                errors: ['Character import not yet implemented'],
                warnings: ['This is a placeholder - implementation coming soon']
            };
        }
        catch (error) {
            Logger.error(`Character import error: ${error.message}`);
            return {
                success: false,
                errors: [`Character import error: ${error.message}`]
            };
        }
    }
    /**
     * Test method for development
     * Quick test of API functionality with existing ddb-proxy
     */
    async runConnectionTest() {
        Logger.info('Running Beyond Foundry connection test...');
        // Test 1: Proxy connection
        const proxyTest = await this.testProxyConnection();
        ui.notifications.info(`Proxy connection: ${proxyTest ? 'SUCCESS' : 'FAILED'}`);
        // Test 2: Character list (requires authentication)
        try {
            const characterList = await this.getCharacterList();
            if (characterList.success) {
                ui.notifications.info(`Character list: SUCCESS (${characterList.characters?.length || 0} characters)`);
            }
            else {
                ui.notifications.warn(`Character list: FAILED - ${characterList.error || 'Unknown error'}`);
            }
        }
        catch (error) {
            ui.notifications.error(`Character list test failed: ${error.message}`);
        }
        Logger.info('Connection test complete');
    }
}

/**
 * Beyond Foundry Module Entry Point
 *
 * This module allows importing purchased D&D Beyond content into FoundryVTT
 * with support for characters, spells, items, and more.
 */
// Initialize module when Foundry is ready
Hooks.once('init', async () => {
    Logger.info(`Initializing ${MODULE_NAME}...`);
    // Register module settings
    registerSettings();
    // Initialize API
    const api = BeyondFoundryAPI.getInstance();
    // Expose API globally for console access and other modules
    game.modules.get(MODULE_ID).api = api;
    Logger.info(`${MODULE_NAME} initialized successfully`);
});
// Setup module when ready
Hooks.once('ready', async () => {
    Logger.info(`${MODULE_NAME} ready`);
    // Initialize API with current settings
    const api = BeyondFoundryAPI.getInstance();
    api.init();
    // Add console message for developers
    Logger.info('Access the API via: game.modules.get("beyond-foundry").api');
});
// Add character sheet header button for import
Hooks.on('getActorSheetHeaderButtons', (app, buttons) => {
    // Only add to character sheets in D&D 5e system
    if (app.actor.type !== 'character' || game.system.id !== 'dnd5e') {
        return;
    }
    buttons.unshift({
        label: 'Import from D&D Beyond',
        class: 'beyond-foundry-import',
        icon: 'fas fa-download',
        onclick: () => {
            Logger.info('D&D Beyond import button clicked');
            ui.notifications.info('D&D Beyond import dialog - Coming Soon!');
            // TODO: Open import dialog
        }
    });
});
// Add actor directory context menu option
Hooks.on('getActorDirectoryEntryContext', (html, options) => {
    options.push({
        name: 'Import from D&D Beyond',
        icon: '<i class="fas fa-download"></i>',
        condition: () => game.system.id === 'dnd5e',
        callback: () => {
            Logger.info('D&D Beyond import context menu clicked');
            ui.notifications.info('D&D Beyond import dialog - Coming Soon!');
            // TODO: Open import dialog
        }
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
//# sourceMappingURL=beyond-foundry.js.map
