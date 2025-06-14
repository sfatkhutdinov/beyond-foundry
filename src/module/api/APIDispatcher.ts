import { RouteHandler } from './RouteHandler.js';
import { Logger, getErrorMessage } from '../utils/logger.js';
import type { APIResponse } from '../../types/index.js';

/**
 * API Dispatcher for Beyond Foundry endpoints
 * Provides HTTP-like routing for D&D Beyond conversion endpoints
 */
export class APIDispatcher {
  private readonly routeHandler: RouteHandler;

  constructor() {
    this.routeHandler = new RouteHandler();
  }

  /**
   * Dispatch API requests using HTTP-like routing
   * @param method HTTP method (GET, POST, etc.)
   * @param path API path
   * @param data Request data/parameters
   */
  async dispatch(method: string, path: string, data: unknown = {}): Promise<APIResponse> {
    try {
      Logger.debug(`API Request: ${method} ${path}`, data);

      const route = this.parseRoute(path);
      const { endpoint, characterId, subResource } = route;

      switch (method.toUpperCase()) {
        case 'GET':
          return await this.handleGet(endpoint, characterId, subResource, data);
        case 'POST':
          return await this.handlePost(endpoint, characterId, subResource, data);
        default:
          return {
            success: false,
            endpoint: path,
            error: `Unsupported HTTP method: ${method}`
          };
      }

    } catch (error) {
      Logger.error(`API dispatch error: ${getErrorMessage(error)}`);
      return {
        success: false,
        endpoint: path,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Handle GET requests
   */
  private async handleGet(endpoint: string, characterId: string, subResource: string, data: unknown): Promise<APIResponse> {
    switch (endpoint) {
      case 'import':
        return await this.handleImportGet(characterId, subResource, data);
      case 'export':
        return await this.handleExportGet(characterId, subResource, data);
      case 'debug':
        return await this.handleDebugGet(subResource, data);
      default:
        return {
          success: false,
          endpoint: `GET /${endpoint}`,
          error: `Unknown endpoint: ${endpoint}`
        };
    }
  }

  /**
   * Handle POST requests
   */
  private async handlePost(endpoint: string, characterId: string, subResource: string, data: unknown): Promise<APIResponse> {
    switch (endpoint) {
      case 'import':
        return await this.handleImportPost(characterId, subResource, data);
      default:
        return {
          success: false,
          endpoint: `POST /${endpoint}`,
          error: `Unsupported POST endpoint: ${endpoint}`
        };
    }
  }

  /**
   * Handle import GET requests
   */
  private async handleImportGet(characterId: string, subResource: string, data: unknown): Promise<APIResponse> {
    if (!characterId) {
      return {
        success: false,
        endpoint: '/import',
        error: 'Character ID is required'
      };
    }

    switch (subResource) {
      case '':
      case 'character':
        return await this.routeHandler.getCharacter(characterId, this.getOptions(data));
      case 'items':
        return await this.routeHandler.getCharacterItems(characterId);
      case 'spells':
        return await this.routeHandler.getCharacterSpells(characterId);
      case 'features':
        return await this.routeHandler.getCharacterFeatures(characterId);
      case 'actions':
        return await this.routeHandler.getCharacterActions(characterId);
      case 'currency':
        return await this.routeHandler.getCharacterCurrency(characterId);
      case 'inventory':
        return await this.routeHandler.getCharacterInventory(characterId);
      case 'story':
        return await this.routeHandler.getCharacterStory(characterId);
      case 'full':
        return await this.routeHandler.importCharacterFull(characterId, this.getOptions(data));
      default:
        return {
          success: false,
          endpoint: `/import/character/${characterId}/${subResource}`,
          error: `Unknown import resource: ${subResource}`
        };
    }
  }

  /**
   * Handle import POST requests
   */
  private async handleImportPost(characterId: string, subResource: string, data: unknown): Promise<APIResponse> {
    if (!characterId) {
      return {
        success: false,
        endpoint: '/import',
        error: 'Character ID is required'
      };
    }

    switch (subResource) {
      case 'full':
        return await this.routeHandler.importCharacterFull(characterId, this.getOptions(data));
      default:
        return {
          success: false,
          endpoint: `/import/character/${characterId}/${subResource}`,
          error: `Unsupported POST import resource: ${subResource}`
        };
    }
  }

  /**
   * Handle export GET requests
   */
  private async handleExportGet(characterId: string, subResource: string, _data: unknown): Promise<APIResponse> {
    if (!characterId) {
      return {
        success: false,
        endpoint: '/export',
        error: 'Character ID is required'
      };
    }

    switch (subResource) {
      case '':
      case 'character':
        return await this.routeHandler.exportCharacter(characterId);
      default:
        return {
          success: false,
          endpoint: `/export/character/${characterId}/${subResource}`,
          error: `Unknown export resource: ${subResource}`
        };
    }
  }

  /**
   * Handle debug GET requests
   */
  private async handleDebugGet(subResource: string, _data: unknown): Promise<APIResponse> {
    switch (subResource) {
      case 'status':
        return await this.routeHandler.getDebugStatus();
      default:
        return {
          success: false,
          endpoint: `/debug/${subResource}`,
          error: `Unknown debug resource: ${subResource}`
        };
    }
  }

  /**
   * Parse route path into components
   */
  private parseRoute(path: string): { endpoint: string; characterId: string; subResource: string } {
    // Remove leading slash and split path
    const cleanPath = path.replace(/^\//, '');
    const parts = cleanPath.split('/');

    const endpoint = parts[0] || '';
    let characterId = '';
    let subResource = '';

    if (parts.length >= 3 && (parts[1] === 'character' || parts[1] === 'character')) {
      characterId = parts[2] || '';
      subResource = parts[3] || '';
    } else if (parts.length >= 2 && endpoint === 'debug') {
      subResource = parts[1] || '';
    }

    return { endpoint, characterId, subResource };
  }

  /**
   * Get available endpoints documentation
   */
  getEndpoints(): Record<string, string> {
    return {
      'GET /import/character/:id': 'Get character data and convert to Foundry format',
      'GET /import/character/:id/items': 'Get character items',
      'GET /import/character/:id/spells': 'Get character spells',
      'GET /import/character/:id/features': 'Get character features and feats',
      'GET /import/character/:id/actions': 'Get character actions and attacks',
      'GET /import/character/:id/currency': 'Get character currency',
      'GET /import/character/:id/inventory': 'Get organized character inventory',
      'GET /import/character/:id/story': 'Get character story and background',
      'POST /import/character/:id/full': 'Import complete character with all data',
      'GET /export/character/:id': 'Export character from Foundry to JSON',
      'GET /debug/status': 'Get debug status and system information'
    };
  }

  /**
   * Convenient method wrappers for common operations
   */
  async getCharacter(characterId: string, options = {}) {
    return this.dispatch('GET', `/import/character/${characterId}`, { options });
  }

  async getCharacterItems(characterId: string) {
    return this.dispatch('GET', `/import/character/${characterId}/items`);
  }

  async getCharacterSpells(characterId: string) {
    return this.dispatch('GET', `/import/character/${characterId}/spells`);
  }

  async getCharacterFeatures(characterId: string) {
    return this.dispatch('GET', `/import/character/${characterId}/features`);
  }

  async importCharacterFull(characterId: string, options = {}) {
    return this.dispatch('POST', `/import/character/${characterId}/full`, { options });
  }

  async exportCharacter(characterId: string) {
    return this.dispatch('GET', `/export/character/${characterId}`);
  }

  async getDebugStatus() {
    return this.dispatch('GET', '/debug/status');
  }

  private getOptions(data: unknown): unknown {
    if (data && typeof data === 'object' && 'options' in data) {
      return (data as { options?: unknown }).options ?? {};
    }
    return {};
  }
}
