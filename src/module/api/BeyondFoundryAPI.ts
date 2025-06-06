import type { 
  DDBCharacter, 
  CharacterListResponse, 
  ImportResult, 
  AuthResponse,
  ImportOptions 
} from '../../types/index.js';
import { getModuleSettings } from '../utils/settings.js';
import { Logger, getErrorMessage } from '../utils/logger.js';
import { DEFAULT_IMPORT_OPTIONS } from '../constants.js';

/**
 * Main API class for Beyond Foundry module
 * Handles communication with ddb-proxy and data transformation
 */
export class BeyondFoundryAPI {
  private static instance: BeyondFoundryAPI;
  private proxyEndpoint: string = '';
  private apiEndpoint: string = '';
  private initialized: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): BeyondFoundryAPI {
    if (!BeyondFoundryAPI.instance) {
      BeyondFoundryAPI.instance = new BeyondFoundryAPI();
    }
    return BeyondFoundryAPI.instance;
  }

  /**
   * Initialize the API with current settings
   */
  public init(): void {
    if (this.initialized) return;

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
  public async testProxyConnection(): Promise<boolean> {
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
      } else {
        Logger.warn(`Proxy connection failed with status: ${response.status}`);
        return false;
      }
    } catch (error) {
      Logger.error(`Proxy connection error: ${getErrorMessage(error)}`);
      return false;
    }
  }

  /**
   * Authenticate with D&D Beyond through proxy
   * @param cobaltToken - The D&D Beyond Cobalt session token
   */
  public async authenticate(cobaltToken: string): Promise<AuthResponse> {
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
      } else {
        Logger.warn(`Authentication failed: ${data.message || 'Unknown error'}`);
        return {
          success: false,
          message: data.message || 'Authentication failed'
        };
      }
    } catch (error) {
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
  public async getCharacterList(): Promise<CharacterListResponse> {
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
      } else {
        Logger.warn(`Failed to retrieve characters: ${data.message || 'Unknown error'}`);
        return {
          success: false,
          error: data.message || 'Failed to retrieve characters'
        };
      }
    } catch (error) {
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
  public async getCharacter(characterId: string): Promise<DDBCharacter | null> {
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
      } else {
        Logger.warn(`Failed to retrieve character: ${data.message || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      Logger.error(`Character fetch error: ${error.message}`);
      return null;
    }
  }

  /**
   * Import a character from D&D Beyond to FoundryVTT
   * @param characterId - The D&D Beyond character ID
   * @param options - Import options
   */
  public async importCharacter(
    characterId: string, 
    options: Partial<ImportOptions> = {}
  ): Promise<ImportResult> {
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

    } catch (error) {
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
  public async runConnectionTest(): Promise<void> {
    Logger.info('Running Beyond Foundry connection test...');
    
    // Test 1: Proxy connection
    const proxyTest = await this.testProxyConnection();
    ui.notifications.info(`Proxy connection: ${proxyTest ? 'SUCCESS' : 'FAILED'}`);
    
    // Test 2: Character list (requires authentication)
    try {
      const characterList = await this.getCharacterList();
      if (characterList.success) {
        ui.notifications.info(`Character list: SUCCESS (${characterList.characters?.length || 0} characters)`);
      } else {
        ui.notifications.warn(`Character list: FAILED - ${characterList.error || 'Unknown error'}`);
      }
    } catch (error) {
      ui.notifications.error(`Character list test failed: ${error.message}`);
    }
    
    Logger.info('Connection test complete');
  }
}
