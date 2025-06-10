// Add this at the top for FoundryVTT global
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const game: any;

import { MODULE_ID, MODULE_NAME } from '../constants.js';
import { BeyondFoundryAPI } from './BeyondFoundryAPI.js';
import { RouteHandler } from './RouteHandler.js';
import { APIDispatcher } from './APIDispatcher.js';
import { Logger, getErrorMessage } from '../utils/logger.js';
import type { ImportOptions, APIResponse } from '../../types/index.js';

/**
 * Enhanced Module Registration for Beyond Foundry
 * Implements the endpoint conversion strategy using Foundry's built-in utilities
 * and D&D 5e system integration as described in the requirements
 */
export class ModuleRegistration {
  private api: BeyondFoundryAPI;
  private routeHandler: RouteHandler;
  private dispatcher: APIDispatcher;

  constructor() {
    this.api = BeyondFoundryAPI.getInstance();
    this.routeHandler = new RouteHandler();
    this.dispatcher = new APIDispatcher();
  }

  /**
   * Register WebSocket-based API endpoints
   * This follows the prompt's recommendation for WebSocket-based methods
   */
  registerWebSocketAPI(): void {
    // Expose API via game.modules for console access and other modules
    const moduleAPI = {
      // Core API reference
      api: this.api,
      routes: this.routeHandler,
      dispatcher: this.dispatcher,

      // Character Import Endpoints (as specified in the prompt)
      importCharacter: async (id: string, options?: Partial<ImportOptions>): Promise<APIResponse> => {
        return await this.safeApiCall(() => this.routeHandler.getCharacter(id, options || {}));
      },

      // Character sub-resource endpoints
      getCharacterItems: async (id: string): Promise<APIResponse> => {
        return await this.safeApiCall(() => this.routeHandler.getCharacterItems(id));
      },

      getCharacterSpells: async (id: string): Promise<APIResponse> => {
        return await this.safeApiCall(() => this.routeHandler.getCharacterSpells(id));
      },

      getCharacterActions: async (id: string): Promise<APIResponse> => {
        return await this.safeApiCall(() => this.routeHandler.getCharacterActions(id));
      },

      getCharacterFeatures: async (id: string): Promise<APIResponse> => {
        return await this.safeApiCall(() => this.routeHandler.getCharacterFeatures(id));
      },

      getCharacterStory: async (id: string): Promise<APIResponse> => {
        return await this.safeApiCall(() => this.routeHandler.getCharacterStory(id));
      },

      getCharacterCurrency: async (id: string): Promise<APIResponse> => {
        return await this.safeApiCall(() => this.routeHandler.getCharacterCurrency(id));
      },

      // Full import and export endpoints
      importCharacterFull: async (id: string, options?: Partial<ImportOptions>): Promise<APIResponse> => {
        return await this.safeApiCall(() => this.routeHandler.importCharacterFull(id, options || {}));
      },

      exportCharacter: async (id: string): Promise<APIResponse> => {
        return await this.safeApiCall(() => this.routeHandler.exportCharacter(id));
      },

      // Debug and status endpoints
      getDebugStatus: async (): Promise<APIResponse> => {
        return await this.safeApiCall(() => this.routeHandler.getDebugStatus());
      },

      // Generic endpoint dispatcher (RESTful interface)
      request: async (method: string, path: string, data?: any): Promise<APIResponse> => {
        return await this.dispatcher.dispatch(method, path, data);
      },

      // Utility functions using Foundry's built-in utilities
      utils: {
        // Safe fetch with timeout using Foundry's utility
        fetchWithTimeout: async (url: string, options: RequestInit = {}, timeout: number = 30000) => {
          return await this.safeApiCall(async () => {
            // Use Foundry's built-in utility if available
            if (foundry && typeof foundry === 'object' && 'utils' in foundry && typeof (foundry as any).utils?.fetchJsonWithTimeout === 'function') {
              return await (foundry as any).utils.fetchJsonWithTimeout(url, { ...options, timeout });
            } else {
              // Fallback to standard fetch with timeout
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), timeout);
              
              try {
                const response = await fetch(url, { ...options, signal: controller.signal });
                clearTimeout(timeoutId);
                return response;
              } catch (error) {
                clearTimeout(timeoutId);
                throw error;
              }
            }
          });
        },

        // Safe URL encoding using Foundry's utility
        encodeURL: (_path: string): string => {
          // Use Foundry's built-in utility if available
          const foundryUtils = (foundry as unknown as { utils?: { encodeURL?: (path: string) => string } }).utils;
          if (foundryUtils?.encodeURL) {
            return foundryUtils.encodeURL(_path);
          } else {
            // Fallback to standard encoding
            return encodeURIComponent(_path);
          }
        },

        // D&D 5e system integration helpers
        d5e: {
          // Migrate actor data using D&D 5e system utilities
          migrateActorData: async (actorData: unknown): Promise<unknown> => {
            if (game.system.id !== 'dnd5e') return actorData;

            try {
              // Use D&D 5e migration if available
              if (game && typeof game === 'object' && 'dnd5e' in game && game.dnd5e?.migrations?.migrateActorData) {
                return await game.dnd5e.migrations.migrateActorData(actorData);
              }
              return actorData;
            } catch (error) {
              Logger.warn(`Actor migration failed: ${getErrorMessage(error)}`);
              return actorData;
            }
          },

          // Create actor using D&D 5e system
          createActor: async (actorData: unknown): Promise<Actor | null> => {
            try {
              const migratedData = await moduleAPI.utils.d5e.migrateActorData(actorData);
              return await Actor.create(migratedData);
            } catch (error) {
              Logger.error(`Actor creation failed: ${getErrorMessage(error)}`);
              return null;
            }
          },

          // Create item using D&D 5e system
          createItem: async (itemData: unknown, actor?: Actor): Promise<Item | null> => {
            try {
              if (actor) {
                return await Item.create(itemData, { parent: actor });
              } else {
                return await Item.create(itemData);
              }
            } catch (error) {
              Logger.error(`Item creation failed: ${getErrorMessage(error)}`);
              return null;
            }
          },

          // Check if item/spell exists in SRD compendium
          findInCompendium: async (name: string, type: string): Promise<unknown | null> => {
            try {
              // Use global 'game' object, cast packs to expected type
              const pack = (game.packs as unknown as { find: (_predicate: (_p: unknown) => boolean) => unknown }).find((_p: unknown) => {
                const packObj = _p as { metadata?: { type?: string; system?: string } };
                return packObj.metadata?.type === type && packObj.metadata?.system === 'dnd5e';
              });
              if (!pack) return null;

              // Assume pack has getIndex method
              const index = await (pack as { getIndex: () => Promise<unknown[]> }).getIndex();
              return (index as unknown[]).find((entry: unknown) => {
                const entryObj = entry as { name?: string };
                return entryObj.name?.toLowerCase() === name.toLowerCase();
              }) || null;
            } catch (error) {
              Logger.warn(`Compendium search failed: ${getErrorMessage(error)}`);
              return null;
            }
          }
        }
      }
    };

    // Register in game.modules
    (game as unknown as { modules: { get: (id: string) => { api?: unknown } } }).modules.get(MODULE_ID).api = moduleAPI;

    // Also register in global beyondFoundry namespace for easy access
    (game as unknown as { beyondFoundry?: unknown }).beyondFoundry = moduleAPI;

    Logger.info('✅ WebSocket-based API endpoints registered');
  }

  /**
   * Register Socket communication for real-time updates
   */
  registerSocketHandlers(): void {
    // Use global 'game' object, cast socket to expected type
    (game.socket as unknown as { on: (event: string, cb: (data: unknown) => void) => void })?.on(`module.${MODULE_ID}`, (data: unknown) => {
      this.handleSocketMessage(data);
    });

    Logger.info('✅ Socket handlers registered');
  }

  /**
   * Register Foundry VTT hooks for integration
   */
  registerHooks(): void {
    // Character sheet integration
    Hooks.on('getActorSheetHeaderButtons', (app: unknown, buttons: unknown[]) => {
      if ((app as { actor?: { type?: string } }).actor?.type !== 'character' || game.system.id !== 'dnd5e') return;

      buttons.unshift({
        label: 'Import from D&D Beyond',
        class: 'beyond-foundry-import',
        icon: 'fas fa-download',
        onclick: async () => {
          const { CharacterImportDialog } = await import('../apps/CharacterImportDialog.js');
          new CharacterImportDialog((app as { actor?: unknown }).actor).render(true);
        }
      });
    });

    // Item sheet integration
    Hooks.on('getItemSheetHeaderButtons', (app: unknown, buttons: unknown[]) => {
      if (game.system.id !== 'dnd5e') return;

      buttons.unshift({
        label: 'Update from D&D Beyond',
        class: 'beyond-foundry-update',
        icon: 'fas fa-sync',
        onclick: async () => {
          const item = (app as { item?: { getFlag: (_namespace: string, _key: string) => unknown } }).item;
          if (item) {
            const ddbId = item.getFlag('beyond-foundry', 'ddbId');
            if (ddbId) {
              // Implement item update logic
              ui.notifications?.info('Item update from D&D Beyond coming soon!');
            } else {
              ui.notifications?.warn('This item was not imported from D&D Beyond');
            }
          }
        }
      });
    });

    Logger.info('✅ Foundry hooks registered');
  }

  /**
   * Register console shortcuts for development
   */
  registerConsoleAPI(): void {
    // Add development shortcuts to console
    const gameApi = (game as { beyondFoundry?: unknown }).beyondFoundry;
    (window as unknown as { beyondFoundry?: unknown; bfTest?: unknown }).beyondFoundry = gameApi;
    
    // Add quick testing functions
    (window as unknown as { bfTest?: { connection?: () => Promise<boolean>; auth?: (token?: string) => Promise<unknown>; character?: (id: string) => Promise<unknown>; diagnostic?: () => Promise<void> } }).bfTest = {
      connection: async () => await this.api.testProxyConnection(),
      auth: async (token?: string) => await this.api.authenticate(token),
      character: async (id: string) => await this.routeHandler.getCharacter(id),
      diagnostic: async () => await this.api.runDiagnostic()
    };

    Logger.info('✅ Console API shortcuts registered');
    Logger.info('💡 Use beyondFoundry.* for API access or bfTest.* for quick testing');
  }

  /**
   * Complete module registration
   */
  register(): void {
    this.registerWebSocketAPI();
    this.registerSocketHandlers();
    this.registerHooks();
    this.registerConsoleAPI();

    Logger.info(`🚀 ${MODULE_NAME} endpoint registration complete`);
    Logger.info('📡 Available endpoints:');
    this.logAvailableEndpoints();
  }

  /**
   * Handle socket messages for real-time communication
   */
  private async handleSocketMessage(data: unknown): Promise<void> {
    if (typeof data === 'object' && data !== null && 'type' in data) {
      const msg = data as { type: string; message?: string; characterName?: string; error?: string };
      switch (msg.type) {
        case 'import-update':
          ui.notifications?.info(`Import progress: ${msg.message}`);
          break;
        case 'import-complete':
          ui.notifications?.info(`Import completed: ${msg.characterName}`);
          break;
        case 'import-error':
          ui.notifications?.error(`Import failed: ${msg.error}`);
          break;
        default:
          Logger.debug('Unknown socket message', data);
      }
    } else {
      Logger.debug('Received non-object socket message', data);
    }
  }

  /**
   * Safe API call wrapper with error handling
   */
  private async safeApiCall<T>(fn: () => Promise<T>): Promise<T | APIResponse> {
    try {
      return await fn();
    } catch (error) {
      Logger.error(`API call error: ${getErrorMessage(error)}`);
      return {
        success: false,
        endpoint: 'unknown',
        error: getErrorMessage(error)
      } as APIResponse;
    }
  }

  /**
   * Log available endpoints for user reference
   */
  private logAvailableEndpoints(): void {
    const endpoints = [
      'GET  /character/:id              - Full character import',
      'GET  /character/:id/items        - Character equipment',
      'GET  /character/:id/spells       - Character spells',
      'GET  /character/:id/actions      - Character actions',
      'GET  /character/:id/features     - Character features',
      'GET  /character/:id/story        - Character story',
      'GET  /character/:id/currency     - Character currency',
      'POST /character/:id/full         - Full sync/re-import',
      'GET  /debug/status               - System diagnostics'
    ];

    endpoints.forEach(endpoint => Logger.info(`  ${endpoint}`));
    Logger.info('');
    Logger.info('💡 Usage examples:');
    Logger.info('  beyondFoundry.importCharacter("12345")');
    Logger.info('  beyondFoundry.getCharacterSpells("12345")');
    Logger.info('  beyondFoundry.request("GET", "/character/12345/items")');
  }
}
