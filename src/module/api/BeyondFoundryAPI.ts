import type {
  DDBCharacter,
  CharacterListResponse,
  ImportResult,
  AuthResponse,
  ImportOptions,
  DDBSpell,
  FoundrySpell,
  DDBItem,
  ModuleSettings,
  ImportPolicy, // Added ImportPolicy here
} from '../../types/index.js';
// Removed getModuleSettings import, will use passed-in config or env vars for tests
import { Logger, getErrorMessage } from '../utils/logger.js';
import { CharacterImportService } from '../../services/CharacterImportService.js';
import { ContentImportService } from '../../services/ContentImportService.js';
import { DEFAULT_PROXY_URL } from '../constants.js'; // Added for default proxy

/**
 * Main API class for Beyond Foundry module
 * Handles communication with ddb-proxy and data transformation
 */
export class BeyondFoundryAPI {
  private static instance: BeyondFoundryAPI;
  public proxyEndpoint: string = '';
  private apiEndpoint: string = ''; // Retained for potential future use
  private initialized: boolean = false;
  private bearerToken: string | null = null;
  private settings: Partial<ModuleSettings> = {}; // Store settings internally

  // New service instances for separated import workflows
  private characterImportService: CharacterImportService | null = null;
  private contentImportService: ContentImportService | null = null;

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
   * Initialize the API with current settings and setup separated import services
   * Accepts optional settings for testing environments where `game` object is not available.
   */
  public init(testSettings?: Partial<ModuleSettings>): void {
    if (this.initialized) return;

    // Prioritize testSettings if provided (for test environments)
    if (testSettings) {
      this.settings = {
        proxyUrl: testSettings.proxyUrl || process.env.PROXY_URL || DEFAULT_PROXY_URL,
        cobaltToken: testSettings.cobaltToken || process.env.COBALT_TOKEN || '',
        apiEndpoint: testSettings.apiEndpoint || process.env.API_ENDPOINT || '',
        debugMode: testSettings.debugMode !== undefined ? testSettings.debugMode : (process.env.DEBUG_MODE === 'true'),
        autoImportItems: testSettings.autoImportItems !== undefined ? testSettings.autoImportItems : (process.env.AUTO_IMPORT_ITEMS === 'true'),
        importPolicy: testSettings.importPolicy || (process.env.IMPORT_POLICY as ImportPolicy) || 'ask',
      };
      Logger.info('🔧 BeyondFoundryAPI initialized with provided test settings and environment variable fallbacks.');
    } 
    // Else, check for Foundry environment - ensure game.settings.get is a function
    else if (typeof game !== 'undefined' && game.settings && typeof game.settings.get === 'function') {
      // In Foundry environment, use game.settings
      const { getModuleSettings } = require('../utils/settings.js'); // Dynamically import for Foundry env
      this.settings = getModuleSettings();
      Logger.info('🔧 BeyondFoundryAPI initialized with Foundry game settings.');
    } 
    // Else, fallback for pure Node.js environments if no testSettings and no Foundry (should be rare for tests now)
    else {
      this.settings = {
        proxyUrl: process.env.PROXY_URL || DEFAULT_PROXY_URL,
        cobaltToken: process.env.COBALT_TOKEN || '',
        apiEndpoint: process.env.API_ENDPOINT || '',
        debugMode: process.env.DEBUG_MODE === 'true',
        autoImportItems: process.env.AUTO_IMPORT_ITEMS === 'true',
        importPolicy: (process.env.IMPORT_POLICY as ImportPolicy) || 'ask',
      };
      Logger.info('🔧 BeyondFoundryAPI initialized with environment variables/defaults for non-Foundry, non-test-specific environment.');
    }
    
    this.proxyEndpoint = this.settings.proxyUrl || DEFAULT_PROXY_URL;
    this.apiEndpoint = this.settings.apiEndpoint || ''; // Ensure apiEndpoint is also set

    // Initialize separated import services
    this.characterImportService = new CharacterImportService(this.proxyEndpoint);
    this.contentImportService = new ContentImportService(this.proxyEndpoint);
    
    // If a cobalt token is available in settings, set it on services
    if (this.settings.cobaltToken) {
        this.bearerToken = this.settings.cobaltToken; // Store it locally for API methods
        if (this.characterImportService) {
            this.characterImportService.setBearerToken(this.settings.cobaltToken);
        }
        if (this.contentImportService) {
            this.contentImportService.setBearerToken(this.settings.cobaltToken);
        }
        Logger.debug('Bearer token set on import services from initial settings.');
    }

    this.initialized = true;
    Logger.info('🔧 BeyondFoundryAPI initialized.');
    Logger.debug(`  • Proxy Endpoint: ${this.proxyEndpoint}`);
    Logger.debug('  • Character Import: API-first using rich character endpoint');
    Logger.debug('  • Content Import: Scraping-based for maximum quality');

    // Test proxy connection on init
    this.testProxyConnection().catch(error => {
      Logger.warn(`Initial proxy connection test failed: ${getErrorMessage(error)}`);
    });
  }

  /**
   * Test connection to ddb-proxy
   */
  public async testProxyConnection(): Promise<boolean> {
    try {
      // Ensure proxyEndpoint is set, defaulting if necessary
      const endpointToTest = this.proxyEndpoint || process.env.PROXY_URL || DEFAULT_PROXY_URL;
      Logger.debug(`Testing proxy connection to: ${endpointToTest}`);

      const response = await fetch(`${endpointToTest}/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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
   * @param cobaltToken - The D&D Beyond Cobalt session token (optional, uses stored token if not provided)
   */
  public async authenticate(cobaltToken?: string): Promise<AuthResponse> {
    try {
      // Use provided token, then settings token, then env token
      const tokenToUse = cobaltToken || this.settings.cobaltToken || process.env.COBALT_TOKEN;

      if (!tokenToUse) {
        return {
          success: false,
          message: 'No cobalt token provided. Please authenticate first.',
        };
      }

      Logger.debug('Attempting authentication with D&D Beyond');

      // Exchange COBALT_COOKIE for Bearer token
      const authEndpoint = `${this.proxyEndpoint || process.env.PROXY_URL || DEFAULT_PROXY_URL}/proxy/auth/token`;
      Logger.debug(`Authenticating via: ${authEndpoint}`);
      const response = await fetch(authEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'foundry_user', // Identifier for caching
          cobalt: tokenToUse,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          // Store the Bearer token for future API calls
          this.bearerToken = data.token;
          // Also update internal settings if this was a manual auth call
          if (this.settings) { 
            this.settings.cobaltToken = data.token; 
          }
          
          // Set the bearer token on the import services
          if (this.characterImportService) {
            this.characterImportService.setBearerToken(data.token);
          }
          if (this.contentImportService) {
            this.contentImportService.setBearerToken(data.token);
          }
          
          Logger.info('Authentication successful - Bearer token obtained');
          return {
            success: true,
            userId: 'foundry_user',
            message: 'Authentication successful',
          };
        } else {
          Logger.warn('Authentication failed: No token in response');
          return {
            success: false,
            message: 'No token received from auth service',
          };
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        Logger.warn(`Authentication failed: ${response.status} - ${errorData.error ?? 'Unknown error'}`);
        return {
          success: false,
          message: errorData.error ?? `Authentication failed with status ${response.status}`,
        };
      }
    } catch (error) {
      Logger.error(`Authentication error: ${getErrorMessage(error)}`);
      return {
        success: false,
        message: `Authentication error: ${getErrorMessage(error)}`,
      };
    }
  }

  /**
   * Get list of characters from D&D Beyond
   * NOTE: ddb-proxy does not provide a character list endpoint.
   * Users must provide character IDs manually from D&D Beyond URLs.
   */
  public async getCharacterList(): Promise<CharacterListResponse> {
    Logger.warn('Character list not available through ddb-proxy');
    Logger.info('To get characters:');
    Logger.info('1. Go to dndbeyond.com/characters');
    Logger.info('2. Find character IDs in URLs: dndbeyond.com/characters/{ID}');
    Logger.info('3. Use importCharacter(characterId) or getCharacter(characterId)');

    return {
      success: false,
      error:
        'Character list endpoint not available in ddb-proxy. Use direct character IDs from D&D Beyond URLs (dndbeyond.com/characters/{ID}).',
    };
  }

  /**
   * Get character data from D&D Beyond
   * @param characterId - The D&D Beyond character ID
   */
  public async getCharacter(characterId: string): Promise<DDBCharacter | null> {
    try {
      Logger.debug(`🎭 Delegating character fetch to CharacterImportService: ${characterId}`);

      if (!this.initialized) this.init(); // Ensure initialized

      // Ensure character import service is available
      if (!this.characterImportService) {
        Logger.error('CharacterImportService not initialized');
        return null;
      }

      // Ensure we have authentication
      if (!this.bearerToken) {
        Logger.warn('No Bearer token available. Attempting authentication...');
        // Pass token from settings/env if available, authenticate will handle it
        const authResult = await this.authenticate(this.settings.cobaltToken || process.env.COBALT_TOKEN);
        if (!authResult.success) {
          Logger.error('Failed to authenticate. Please check your COBALT token.');
          return null;
        }
      }

      // Delegate to the character import service
      return await this.characterImportService.getCharacterData(characterId);
    } catch (error) {
      Logger.error(`Character fetch error: ${getErrorMessage(error)}`);
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
      Logger.info(`🎭 Delegating character import to CharacterImportService: ${characterId}`);
      if (!this.initialized) this.init(); // Ensure initialized

      // Ensure character import service is available
      if (!this.characterImportService) {
        return {
          success: false,
          errors: ['CharacterImportService not initialized'],
          endpoint: 'importCharacter',
        };
      }

      // Ensure we have authentication
      if (!this.bearerToken) {
        Logger.warn('No Bearer token available. Attempting authentication...');
         // Pass token from options, then settings/env if available
        const tokenForAuth = options.cobaltToken || this.settings.cobaltToken || process.env.COBALT_TOKEN;
        const authResult = await this.authenticate(tokenForAuth);
        if (!authResult.success) {
          return {
            success: false,
            errors: ['Failed to authenticate. Please check your COBALT token.'],
            endpoint: 'importCharacter',
          };
        }
      }

      // Delegate to the character import service (API-first approach)
      return await this.characterImportService.importCharacter(characterId, options);
    } catch (error) {
      Logger.error(`Character import error: ${getErrorMessage(error)}`);
      return {
        success: false,
        errors: [`Character import error: ${getErrorMessage(error)}`],
        endpoint: 'importCharacter',
      };
    }
  }

  /**
   * Import character data by ID and transform it for FoundryVTT
   * @param characterId The D&D Beyond character ID
   * @param options Import options, including cobaltToken and proxyUrl
   * @returns Promise<ImportResult>
   */
  public async importCharacterById(characterId: string, options: ImportOptions): Promise<ImportResult> {
    try {
      Logger.info(`🎭 Delegating character import (by ID) to CharacterImportService: ${characterId}`);
      
      // Ensure API is initialized. Pass options that might contain test settings.
      if (!this.initialized) {
         this.init({ 
            proxyUrl: options.proxyUrl, 
            cobaltToken: options.cobaltToken, 
            debugMode: options.debug 
        });
      }

      // Ensure character import service is available
      if (!this.characterImportService) {
        Logger.error('CharacterImportService not initialized');
        return {
          success: false,
          errors: ['CharacterImportService not initialized'],
          endpoint: 'importCharacterById',
        };
      }

      // Ensure we have authentication
      // Use token from options if provided, then current bearerToken, then settings/env.
      let tokenToUseForAuth = options.cobaltToken || this.bearerToken || this.settings.cobaltToken || process.env.COBALT_TOKEN;
      
      if (!this.bearerToken || (options.cobaltToken && options.cobaltToken !== this.bearerToken)) {
        Logger.warn('Bearer token mismatch or not set. Attempting authentication with provided/best available token...');
        const authResult = await this.authenticate(tokenToUseForAuth);
        if (!authResult.success) {
          return {
            success: false,
            errors: ['Failed to authenticate. Please check your COBALT token.'],
            endpoint: 'importCharacterById',
          };
        }
        // Update tokenToUseForAuth if authenticate returned a new one and stored it in this.bearerToken
        tokenToUseForAuth = this.bearerToken; 
      }
      
      // If the characterImportService's bearer token is not set or differs, set it now.
      if (this.bearerToken && (!this.characterImportService.hasBearerToken() || !this.characterImportService.isTokenSame(this.bearerToken))) {
        this.characterImportService.setBearerToken(this.bearerToken);
      }


      // Delegate to the character import service (API-first approach)
      // The CharacterImportService.importCharacter method is the correct one to call.
      return await this.characterImportService.importCharacter(characterId, options);

    } catch (error) {
      Logger.error(`Character import (by ID) error: ${getErrorMessage(error)}`);
      return {
        success: false,
        errors: [`Character import (by ID) error: ${getErrorMessage(error)}`],
        endpoint: 'importCharacterById',
      };
    }
  }

  private async addItemsToActor(
    actor: Actor,
    ddbItems: DDBItem[],
    options: Partial<ImportOptions>
  ): Promise<number> {
    // This method relies on `game` object, so it won't work in test scripts as-is.
    // For test scripts, we are focused on the API's ability to fetch and parse,
    // not Foundry integration. So, this can be skipped or mocked if tests call it.
    if (typeof game === 'undefined') {
        Logger.warn('Skipping addItemsToActor in test environment (game object not available).');
        return 0;
    }
    const compendiumName = options.itemCompendiumName || 'beyondfoundry.items';
    const { ItemParser } = await import('../../parsers/items/ItemParser.js');
    // Use eslint-disable for Foundry dynamic API compatibility - this is a known limitation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const packs = (game as any).packs;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pack = packs.get(compendiumName) as any;
    const compendiumIndex: { [ddbId: number]: string } = {};
    if (pack) {
      await pack.getIndex();
      for (const entry of pack.index) {
        if (!entry._id) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FoundryVTT dynamic API
        const doc = await pack.getDocument(entry._id) as any;
         
        const ddbId = doc?.getFlag?.('beyond-foundry', 'ddbId');
        if (typeof ddbId === 'number') compendiumIndex[ddbId] = entry._id;
      }
    }
    let importedCount = 0;
    for (const ddbItem of ddbItems) {
      try {
        let compendiumEntry: { name?: string; id?: string; type?: string } | null = null;
        const compendiumId = pack && compendiumIndex[ddbItem.definition.id];
        if (pack && compendiumId) {
          const doc = await pack.getDocument(compendiumId);
          compendiumEntry = doc as { name?: string; id?: string; type?: string };
        }
        if (compendiumEntry?.name && compendiumEntry?.id) {
          await actor.createEmbeddedDocuments('Item', [{
            name: compendiumEntry.name,
            type: compendiumEntry.type || 'loot',
            flags: { 'beyond-foundry': { ddbId: ddbItem.definition.id, compendiumId: compendiumEntry.id } },
            compendium: compendiumName,
            _id: compendiumEntry.id
          }]);
          Logger.debug(`Linked item from compendium: ${compendiumEntry.name}`);
        } else {
          const foundryItem = ItemParser.parseItem(ddbItem);
          if (!foundryItem) continue;
          await Item.create(foundryItem, { parent: actor });
          Logger.debug(`Embedded item: ${foundryItem.name}`);
        }
        importedCount++;
      } catch (itemError) {
        Logger.warn(`Failed to import item ${ddbItem.definition?.name}: ${getErrorMessage(itemError)}`);
      }
    }
    return importedCount;
  }

  /**
   * Import character spells into FoundryVTT actor
   * Enhanced implementation using ddb-proxy patterns
   */
  public async importCharacterSpells(
    actor: Actor,
    ddbCharacter: DDBCharacter,
    options: Partial<ImportOptions> = {}
  ): Promise<{ success: boolean; warnings?: string[]; errors?: string[] }> {
    // This method relies on `game` object for settings, so it won't work in test scripts as-is.
    // It also takes an Actor object.
    if (typeof game === 'undefined') {
        Logger.warn('Skipping importCharacterSpells in test environment (game object not available).');
        return { success: true, warnings: ['Skipped in test environment'] };
    }
    try {
      const warnings: string[] = [];
      const errors: string[] = [];

      // Check if character has class data for spell fetching
      if (!ddbCharacter.classes || ddbCharacter.classes.length === 0) {
        return { success: true, warnings: ['No classes found for character - skipping spell import'] };
      }

      // Get cobalt token from settings
      const tokenForSpellFetch = this.settings.cobaltToken || process.env.COBALT_TOKEN;
      if (!tokenForSpellFetch) {
        warnings.push('No cobalt token configured - cannot fetch spells from D&D Beyond');
        return { success: true, warnings };
      }

      Logger.info(`🔮 Starting spell import for ${ddbCharacter.name}`);

      let totalSpellsImported = 0;

      // Process each spellcasting class
      for (const classInfo of ddbCharacter.classes) {
        if (!this.isSpellcastingClass(classInfo)) {
          Logger.debug(`Skipping non-spellcasting class: ${classInfo.definition?.name}`);
          continue;
        }

        try {
          // Calculate spell level access for this class
          const spellLevelAccess = this.calculateSpellLevelAccess(classInfo);
          
          if (spellLevelAccess === 0) {
            Logger.debug(`Class ${classInfo.definition?.name} has no spell access yet`);
            continue;
          }

          // Prepare class info for spell fetching
          interface SpellFetchClassInfo {
            id: number;
            name: string;
            level: number;
            spellLevelAccess: number;
            campaignId?: number;
            backgroundId?: number;
          }
          const fetchClassInfo: SpellFetchClassInfo = {
            id: classInfo.definition?.id || 0,
            name: classInfo.definition?.name || 'Unknown',
            level: classInfo.level || 1,
            spellLevelAccess
          };
          if (typeof ddbCharacter.campaignId === 'number') fetchClassInfo.campaignId = ddbCharacter.campaignId;
          if (typeof ddbCharacter.background?.definition?.id === 'number') fetchClassInfo.backgroundId = ddbCharacter.background.definition.id;

          Logger.debug(`Fetching spells for ${fetchClassInfo.name} (Level ${fetchClassInfo.level}, Spell Level Access: ${spellLevelAccess})`);

          // Fetch spells for this class
          const classSpells = await this.fetchCharacterSpells(
            ddbCharacter.id,
            this.settings.cobaltToken,
            fetchClassInfo
          );

          if (classSpells.length > 0) {
            // Parse and add spells to actor
            const importedCount = await this.addSpellsToActor(actor, classSpells, options);
            totalSpellsImported += importedCount;
            
            Logger.info(`✅ Imported ${importedCount} spells from ${fetchClassInfo.name}`);
          }

        } catch (classError) {
          const errorMsg = `Failed to import spells for class ${classInfo.definition?.name}: ${getErrorMessage(classError)}`;
          Logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      if (totalSpellsImported > 0) {
        Logger.info(`🎉 Successfully imported ${totalSpellsImported} total spells`);
      } else {
        warnings.push('No spells were imported - character may not have any spells or fetching failed');
      }

      return { 
        success: errors.length === 0, 
        ...(warnings.length > 0 && { warnings }),
        ...(errors.length > 0 && { errors })
      };

    } catch (error) {
      Logger.error(`Character spell import error: ${getErrorMessage(error)}`);
      return {
        success: false,
        errors: [`Character spell import error: ${getErrorMessage(error)}`],
      };
    }
  }

  /**
   * Fetch character spells from ddb-proxy
   * Implements the spell extraction patterns from ddb-proxy spells.js
   */
  public async fetchCharacterSpells(
    characterId: number,
    cobaltTokenInput?: string, // Made optional, will use internal if not provided
    classInfo?: {
      id: number;
      name: string;
      level: number;
      spellLevelAccess: number;
      campaignId?: number;
      backgroundId?: number;
    }
  ): Promise<DDBSpell[]> {
    try {
      if (!classInfo) {
        Logger.warn('No class info provided for spell fetch');
        return [];
      }

      Logger.debug(`Fetching spells for ${classInfo.name} (ID: ${classInfo.id}) at level ${classInfo.spellLevelAccess}`);

      // Authenticate first, use provided token or internal token
      const tokenToUse = cobaltTokenInput || this.settings.cobaltToken || process.env.COBALT_TOKEN;
      if (!tokenToUse) {
        throw new Error('Cobalt token not available for spell fetch.');
      }
      // Ensure API is initialized if not already
      if(!this.initialized) this.init({ cobaltToken: tokenToUse });

      const authSuccess = await this.authenticate(tokenToUse);
      if (!authSuccess.success) {
        throw new Error('Authentication failed');
      }

      // Fetch class spells using ddb-proxy pattern
      const spells = await this.extractSpells(classInfo);
      
      Logger.info(`Fetched ${spells.length} spells for ${classInfo.name}`);
      return spells;

    } catch (error) {
      Logger.error(`Failed to fetch character spells: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Extract spells for a class (based on ddb-proxy extractSpells)
   */
  private async extractSpells(
    classInfo: { id: number; name: string; spellLevelAccess: number; campaignId?: number }
  ): Promise<DDBSpell[]> {
    try {
      // Ensure API is initialized if not already
      if(!this.initialized) this.init();
      // Ensure we have a valid Bearer token
      if (!this.bearerToken) {
        Logger.warn('No Bearer token available. Attempting authentication...');
        const authResult = await this.authenticate();
        if (!authResult.success) {
          throw new Error('Failed to authenticate. Please check your COBALT token.');
        }
      }

      const response = await fetch(`${this.proxyEndpoint || process.env.PROXY_URL || DEFAULT_PROXY_URL}/proxy/spells/class/spells`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          className: classInfo.name,
          cobaltToken: this.bearerToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Spell fetch failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.message ?? 'Invalid spell data received');
      }

      // Filter spells by level access and exclude certain sources (like UA)
      const filteredSpells = data.data.filter((spell: DDBSpell) => {
        // Filter by spell level access
        if (spell.definition.level > classInfo.spellLevelAccess) {
          return false;
        }

        // Filter out Unearthed Arcana (source ID 39) if needed
        if (spell.definition.sources?.some((source: { sourceId: number }) => source.sourceId === 39)) {
          return false;
        }

        return true;
      });

      Logger.debug(`Filtered ${filteredSpells.length} of ${data.data.length} spells for ${classInfo.name}`);
      return filteredSpells;

    } catch (error) {
      Logger.error(`Extract spells error: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Extract always prepared spells (based on ddb-proxy extractAlwaysPreparedSpells)
   */
  public async extractAlwaysPreparedSpells(
    classInfo: { id: number; name: string; spellLevelAccess: number; campaignId?: number },
    spellListIds: number[] = []
  ): Promise<DDBSpell[]> {
     // Ensure API is initialized if not already
    if(!this.initialized) this.init();
    try {
      const url = `${this.proxyEndpoint || process.env.PROXY_URL || DEFAULT_PROXY_URL}/proxy/spells/always-prepared/${classInfo.id}?level=${classInfo.spellLevelAccess}&campaign=${classInfo.campaignId || ''}&spellLists=${spellListIds.join(',')}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Always prepared spells fetch failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.message ?? 'Invalid always prepared spell data');
      }

      // Apply same filtering as regular spells
      const filteredSpells = data.data.filter((spell: DDBSpell) => {
        return spell.definition.level <= classInfo.spellLevelAccess &&
               !spell.definition.sources?.some((source: { sourceId: number }) => source.sourceId === 39);
      });

      Logger.debug(`Found ${filteredSpells.length} always prepared spells for ${classInfo.name}`);
      return filteredSpells;

    } catch (error) {
      Logger.error(`Extract always prepared spells error: ${getErrorMessage(error)}`);
      return [];
    }
  }

  /**
   * Extract always known spells (based on ddb-proxy extractAlwaysKnownSpells)
   */
  public async extractAlwaysKnownSpells(
    classInfo: { id: number; name: string; spellLevelAccess: number; campaignId?: number; backgroundId?: number },
    cobaltIdInput?: string, // Made optional
    includeCantrips: boolean = true,
    spellListIds: number[] = []
  ): Promise<DDBSpell[]> {
    // Ensure API is initialized if not already
    if(!this.initialized) this.init();
    try {
      const tokenToUse = cobaltIdInput || this.bearerToken || this.settings.cobaltToken || process.env.COBALT_TOKEN;
      if (!tokenToUse) {
        throw new Error('Cobalt token (bearer) not available for always known spell fetch.');
      }
      const url = `${this.proxyEndpoint || process.env.PROXY_URL || DEFAULT_PROXY_URL}/proxy/spells/always-known/${classInfo.id}?level=${classInfo.spellLevelAccess}&campaign=${classInfo.campaignId || ''}&background=${classInfo.backgroundId || ''}&spellLists=${spellListIds.join(',')}&cantrips=${includeCantrips}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cobaltIdInput}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Always known spells fetch failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.message ?? 'Invalid always known spell data');
      }

      // Filter cantrips if not wanted
      let filteredSpells = data.data;
      if (!includeCantrips) {
        filteredSpells = filteredSpells.filter((spell: DDBSpell) => spell.definition.level > 0);
      }

      // Apply level and source filtering
      filteredSpells = filteredSpells.filter((spell: DDBSpell) => {
        return spell.definition.level <= classInfo.spellLevelAccess &&
               !spell.definition.sources?.some((source: { sourceId: number }) => source.sourceId === 39);
      });

      Logger.debug(`Found ${filteredSpells.length} always known spells for ${classInfo.name}`);
      return filteredSpells;

    } catch (error) {
      Logger.error(`Extract always known spells error: ${getErrorMessage(error)}`);
      return [];
    }
  }

  /**
   * Test method for development
   * Quick test of API connectivity with existing ddb-proxy
   */
  public async runConnectionTest(): Promise<void> {
    Logger.info('Running Beyond Foundry connection test...');
    if (!this.initialized) this.init(); // Ensure initialized

    // Test 1: Proxy connection
    const proxyTest = await this.testProxyConnection();
    ui.notifications.info(`Proxy connection: ${proxyTest ? 'SUCCESS' : 'FAILED'}`);

    // Test 2: Authentication (if token available)
    try {
      const tokenForAuth = this.settings.cobaltToken || process.env.COBALT_TOKEN;
      if (tokenForAuth) {
        const authResult = await this.authenticate(tokenForAuth);
        ui.notifications.info(`Authentication: ${authResult.success ? 'SUCCESS' : 'FAILED'}`);
        if (!authResult.success) {
          Logger.warn(`Authentication failed: ${authResult.message}`);
        }
      } else {
        ui.notifications.warn('Authentication: SKIPPED (No cobalt token configured)');
        Logger.info('To test authentication, configure your cobalt token in module settings');
      }
    } catch (error) {
      ui.notifications.error(`Authentication test failed: ${getErrorMessage(error)}`);
    }

    // Explain character testing
    Logger.info('\n💡 Character Testing:');
    Logger.info('Character list is not available through ddb-proxy.');
    Logger.info('To test character fetching:');
    Logger.info('1. Get character ID from D&D Beyond URL: dndbeyond.com/characters/{ID}');
    Logger.info('2. Use getCharacter(characterId) to fetch character data');
    Logger.info('3. Use importCharacter(characterId) to import character to Foundry');

    // Example character ID for testing
    const testCharacterId = '123456789';
    Logger.info(`\n📋 Example Test:`);
    Logger.info(`1. Fetch character: api.getCharacter("${testCharacterId}")`);
    Logger.info(`2. Import character: api.importCharacter("${testCharacterId}")`);
  }

  /**
   * Quick diagnostic for troubleshooting
   */
  public async runDiagnostic(): Promise<void> {
    Logger.info('🔍 Beyond Foundry Diagnostic');
    Logger.info('='.repeat(40));
    if (!this.initialized) this.init(); // Ensure initialized

    // Environment info
    Logger.info(`System: ${game.system.id}`);

    // Settings
    Logger.info('\\nSettings (from API instance):');
    Logger.info(`  Proxy URL: ${this.settings.proxyUrl}`);
    Logger.info(`  Has Token (in settings): ${this.settings.cobaltToken ? 'Yes' : 'No'}`);
    Logger.info(`  Has Bearer Token (in API): ${this.bearerToken ? 'Yes' : 'No'}`);
    Logger.info(`  Debug Mode: ${this.settings.debugMode}`);

    // Network test
    Logger.info('\nNetwork Test:');
    const proxyOk = await this.testProxyConnection();
    Logger.info(`  Proxy Connection: ${proxyOk ? '✅ OK' : '❌ FAIL'}`);

    Logger.info('\n💡 Useful Commands:');
    Logger.info('  api.runFullSystemTest() - Complete system test');
    Logger.info('  api.quickTest("token", "characterId") - Quick auth and character test');
    Logger.info('  new CharacterImportDialog().render(true) - Open import dialog');
  }

  /**
   * Check if a D&D class is a spellcasting class
   */
  public isSpellcastingClass(classInfo: { definition?: { name?: string; spellRules?: unknown }; subclass?: { definition?: { name?: string } } }): boolean {
    if (!classInfo.definition) return false;
    
    // Common spellcasting classes
    const spellcastingClasses = [
      'Artificer', 'Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 
      'Sorcerer', 'Warlock', 'Wizard', 'Eldritch Knight', 'Arcane Trickster'
    ];
    
    const className = classInfo.definition?.name || '';
    const subclassName = classInfo.subclass?.definition?.name || '';
    
    return spellcastingClasses.includes(className) || 
           spellcastingClasses.includes(subclassName) ||
           !!classInfo.definition?.spellRules;
  }

  /**
   * Calculate spell level access for a class (based on ddb-proxy patterns)
   */
  public calculateSpellLevelAccess(classInfo: { definition?: { name?: string }; level?: number; subclass?: { definition?: { name?: string } } }): number {
    if (!classInfo.definition || !classInfo.level) return 0;
    
    const classLevel = classInfo.level || 0;
    const className = classInfo.definition?.name || '';
    
    // Full casters (Wizard, Sorcerer, etc.)
    const fullCasters = ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard', 'Warlock'];
    if (fullCasters.includes(className)) {
      if (classLevel >= 17) return 9;
      if (classLevel >= 15) return 8;
      if (classLevel >= 13) return 7;
      if (classLevel >= 11) return 6;
      if (classLevel >= 9) return 5;
      if (classLevel >= 7) return 4;
      if (classLevel >= 5) return 3;
      if (classLevel >= 3) return 2;
      if (classLevel >= 1) return 1;
    }
    
    // Half casters (Paladin, Ranger)
    const halfCasters = ['Paladin', 'Ranger'];
    if (halfCasters.includes(className)) {
      if (classLevel >= 17) return 5;
      if (classLevel >= 13) return 4;
      if (classLevel >= 9) return 3;
      if (classLevel >= 5) return 2;
      if (classLevel >= 2) return 1;
    }
    
    // Third casters (Eldritch Knight, Arcane Trickster)
    const thirdCasters = ['Eldritch Knight', 'Arcane Trickster'];
    const subclassName = classInfo.subclass?.definition?.name || '';
    if (thirdCasters.includes(subclassName)) {
      if (classLevel >= 19) return 4;
      if (classLevel >= 13) return 3;
      if (classLevel >= 7) return 2;
      if (classLevel >= 3) return 1;
    }
    
    // Artificer (unique progression)
    if (className === 'Artificer') {
      if (classLevel >= 17) return 5;
      if (classLevel >= 13) return 4;
      if (classLevel >= 9) return 3;
      if (classLevel >= 5) return 2;
      if (classLevel >= 1) return 1;
    }
    
    return 0;
  }

  /**
   * Bulk import all D&D Beyond spells into a FoundryVTT compendium
   * @param cobaltToken - D&D Beyond session token
   * @param compendiumName - The compendium to populate (default: 'beyondfoundry.spells')
   */
  public async bulkImportSpellsToCompendium(cobaltTokenInput?: string, compendiumName = 'beyondfoundry.spells'): Promise<number> {
    // This method relies on `game` object, so it won't work in test scripts as-is.
    if (typeof game === 'undefined') {
        Logger.warn('Skipping bulkImportSpellsToCompendium in test environment (game object not available).');
        return 0;
    }
    try {
      const tokenToUse = cobaltTokenInput || this.settings.cobaltToken || process.env.COBALT_TOKEN;
      if (!tokenToUse) {
        throw new Error('Cobalt token not available for bulk spell import.');
      }
      Logger.info(`Starting bulk spell import to compendium: ${compendiumName}`);
      const response = await fetch(`${this.proxyEndpoint || process.env.PROXY_URL || DEFAULT_PROXY_URL}/proxy/class/spells`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ className: 'Wizard', cobalt: tokenToUse })
      });
      if (!response.ok) throw new Error(`Failed to fetch spells: ${response.status}`);
      const data = await response.json();
      if (!data.success || !Array.isArray(data.data)) throw new Error('Invalid spell data response');
      const spells: DDBSpell[] = data.data;
      if (!spells.length) throw new Error('No spells returned from proxy');

      const { SpellParser } = await import('../../parsers/spells/SpellParser.js');
      // Use 'as any' for Foundry dynamic API compatibility
      const packs = (game as any).packs;
      let pack = packs.get(compendiumName) as any;
      if (!pack) {
        Logger.info(`Compendium ${compendiumName} not found, creating...`);
        await CompendiumCollection.createCompendium({
          label: 'Beyond Foundry Spells',
          name: compendiumName.split('.')[1] || 'spells',
          type: 'Item',
        });
        pack = packs.get(compendiumName) as any;
      }
      if (!pack) throw new Error(`Failed to access compendium: ${compendiumName}`);

      await pack.getIndex();
      // Build ddbId index by fetching ItemDocuments for flags
      const index: Record<number, string> = {};
      for (const entry of pack.index) {
        if (!entry._id) continue;
        const doc = await pack.getDocument(entry._id);
        // Type assertion for Foundry ItemDocument
        const ddbId = (doc as any)?.getFlag?.('beyond-foundry', 'ddbId');
        if (typeof ddbId === 'number') index[ddbId] = entry._id;
      }

      let imported = 0;
      for (const ddbSpell of spells) {
        const foundrySpell: FoundrySpell = SpellParser.parseSpell(ddbSpell);
        const existingId = index[ddbSpell.definition.id];
        if (existingId) {
          if (typeof pack.updateEntity === 'function') {
            await pack.updateEntity({ _id: existingId, ...foundrySpell });
          } else if (typeof pack.update === 'function') {
            await pack.update({ _id: existingId, ...foundrySpell });
          }
          Logger.debug(`Updated spell in compendium: ${foundrySpell.name}`);
        } else {
          if (typeof pack.createEntity === 'function') {
            await pack.createEntity(foundrySpell);
          } else if (typeof pack.create === 'function') {
            await pack.create(foundrySpell);
          }
          Logger.debug(`Created spell in compendium: ${foundrySpell.name}`);
        }
        imported++;
      }
      Logger.info(`Bulk spell import complete: ${imported} spells processed.`);
      return imported;
    } catch (error) {
      Logger.error(`Bulk spell import failed: ${getErrorMessage(error)}`);
      return 0;
    }
  }

  /**
   * Bulk import all D&D Beyond items into a FoundryVTT compendium
   * @param cobaltToken - D&D Beyond session token
   * @param compendiumName - The compendium to populate (default: 'beyondfoundry.items')
   */
  public async bulkImportItemsToCompendium(cobaltTokenInput?: string, compendiumName = 'beyondfoundry.items'): Promise<number> {
    // This method relies on `game` object, so it won't work in test scripts as-is.
    if (typeof game === 'undefined') {
        Logger.warn('Skipping bulkImportItemsToCompendium in test environment (game object not available).');
        return 0;
    }
    try {
      const tokenToUse = cobaltTokenInput || this.settings.cobaltToken || process.env.COBALT_TOKEN;
      if (!tokenToUse) {
        throw new Error('Cobalt token not available for bulk item import.');
      }
      Logger.info(`Starting bulk item import to compendium: ${compendiumName}`);
      const response = await fetch(`${this.proxyEndpoint || process.env.PROXY_URL || DEFAULT_PROXY_URL}/proxy/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cobalt: tokenToUse })
      });
      if (!response.ok) throw new Error(`Failed to fetch items: ${response.status}`);
      const data = await response.json();
      if (!data.success || !Array.isArray(data.data)) throw new Error('Invalid item data response');
      const items: DDBItem[] = data.data;
      if (!items.length) throw new Error('No items returned from proxy');

      const { ItemParser } = await import('../../parsers/items/ItemParser.js');
      // Use 'as any' for Foundry dynamic API compatibility
      const packs = (game as any).packs;
      let pack = packs.get(compendiumName) as any;
      if (!pack) {
        Logger.info(`Compendium ${compendiumName} not found, creating...`);
        await CompendiumCollection.createCompendium({
          label: 'Beyond Foundry Items',
          name: compendiumName.split('.')[1] || 'items',
          type: 'Item',
        });
        pack = packs.get(compendiumName) as any;
      }
      if (!pack) throw new Error(`Failed to access compendium: ${compendiumName}`);

      await pack.getIndex();
      // Build ddbId index by fetching ItemDocuments for flags
      const index: Record<number, string> = {};
      for (const entry of pack.index) {
        if (!entry._id) continue;
        const doc = await pack.getDocument(entry._id);
        const ddbId = (doc as any)?.getFlag?.('beyond-foundry', 'ddbId');
        if (typeof ddbId === 'number') index[ddbId] = entry._id;
      }

      let imported = 0;
      for (const ddbItem of items) {
        const foundryItem = await ItemParser.parseItem(ddbItem);
        if (!foundryItem) continue;
        const existingId = index[ddbItem.id];
        if (existingId) {
          if (typeof pack.updateEntity === 'function') {
            await pack.updateEntity({ _id: existingId, ...foundryItem });
          } else if (typeof pack.update === 'function') {
            await pack.update({ _id: existingId, ...foundryItem });
          }
          Logger.debug(`Updated item in compendium: ${foundryItem.name}`);
        } else {
          if (typeof pack.createEntity === 'function') {
            await pack.createEntity(foundryItem);
          } else if (typeof pack.create === 'function') {
            await pack.create(foundryItem);
          }
          Logger.debug(`Created item in compendium: ${foundryItem.name}`);
        }
        imported++;
      }
      Logger.info(`Bulk item import complete: ${imported} items processed.`);
      return imported;
    } catch (error) {
      Logger.error(`Bulk item import failed: ${getErrorMessage(error)}`);
      return 0;
    }
  }

  private async addSpellsToActor(
    actor: Actor,
    spells: DDBSpell[],
    options: Partial<ImportOptions>
  ): Promise<number> {
    // This method relies on `game` object, so it won't work in test scripts as-is.
    if (typeof game === 'undefined') {
        Logger.warn('Skipping addSpellsToActor in test environment (game object not available).');
        return 0;
    }
    try {
      const { SpellParser } = await import('../../parsers/spells/SpellParser.js');
      let importedCount = 0;
      const compendiumName = options.spellCompendiumName || 'beyondfoundry.spells';
      // Use 'as any' for Foundry dynamic API compatibility
      const packs = (game as any).packs;
      const pack = packs.get(compendiumName) as any;
      const compendiumIndex: { [ddbId: number]: string } = {};
      if (pack) {
        await pack.getIndex();
        for (const entry of pack.index) {
          if (!entry._id) continue;
          const doc = await pack.getDocument(entry._id);
          const ddbId = (doc as any)?.getFlag?.('beyond-foundry', 'ddbId');
          if (typeof ddbId === 'number') compendiumIndex[ddbId] = entry._id;
        }
      }
      for (const ddbSpell of spells) {
        try {
          let compendiumEntry: { name?: string; id?: string } | null = null;
          const compendiumId = pack && compendiumIndex[ddbSpell.definition.id];
          if (pack && compendiumId) {
            const doc = await pack.getDocument(compendiumId);
            compendiumEntry = doc as { name?: string; id?: string };
          }
          if (compendiumEntry && compendiumEntry.name && compendiumEntry.id) {
            await actor.createEmbeddedDocuments('Item', [{
              name: compendiumEntry.name,
              type: 'spell',
              flags: { 'beyond-foundry': { ddbId: ddbSpell.definition.id, compendiumId: compendiumEntry.id } },
              compendium: compendiumName,
              _id: compendiumEntry.id
            }]);
            Logger.debug(`Linked spell from compendium: ${compendiumEntry.name}`);
          } else {
            const foundrySpell: FoundrySpell = SpellParser.parseSpell(ddbSpell);
            const existingSpell = actor.items.find(
              (item: unknown) => {
                // Type assertion for Foundry ItemDocument
                const i = item as { data?: { type?: string; flags?: Record<string, { ddbId?: number }> } };
                return i.data?.type === 'spell' && i.data?.flags?.['beyond-foundry']?.ddbId === ddbSpell.id;
              }
            );
            if (existingSpell && !options.updateExisting) {
              Logger.debug(`Skipping existing spell: ${foundrySpell.name}`);
              continue;
            }
            foundrySpell.flags = {
              'beyond-foundry': {
                ddbId: ddbSpell.id,
                sourceId: ddbSpell.definition.id,
                prepared: ddbSpell.prepared,
                alwaysPrepared: false,
                usesSpellSlot: ddbSpell.usesSpellSlot,
                castAtLevel: ddbSpell.castAtLevel || null,
                restriction: null
              }
            };
            if (existingSpell && typeof (existingSpell as { update?: Function }).update === 'function') {
              await (existingSpell as { update: Function }).update(foundrySpell);
              Logger.debug(`Updated spell: ${foundrySpell.name}`);
            } else {
              await Item.create(foundrySpell, { parent: actor });
              Logger.debug(`Created spell: ${foundrySpell.name}`);
            }
          }
          importedCount++;
        } catch (spellError) {
          Logger.warn(`Failed to import spell ${ddbSpell.definition?.name}: ${getErrorMessage(spellError)}`);
        }
      }
      return importedCount;
    } catch (error) {
      Logger.error(`Failed to add spells to actor: ${getErrorMessage(error)}`);
      return 0;
    }
  }

  /**
   * Import a class from D&D Beyond to FoundryVTT
   * @param classId - The D&D Beyond class ID
   * @param options - Import options
   */
  public async importClass(
    classId: string,
    options: Partial<ImportOptions> = {} // options used for cobalt token
  ): Promise<Record<string, unknown> | null> {
    try {
      Logger.info(`Starting class import for ID: ${classId}`);
      if (!this.initialized) this.init({ cobaltToken: options.cobaltToken, proxyUrl: options.proxyUrl });

      const tokenToUse = options.cobaltToken || this.settings.cobaltToken || process.env.COBALT_TOKEN;
      if (!tokenToUse) {
        Logger.error('No authentication token available. Please authenticate first.');
        return null;
      }
      // Fetch class data from ddb-proxy
      const response = await fetch(`${this.proxyEndpoint || process.env.PROXY_URL || DEFAULT_PROXY_URL}/proxy/classes/${classId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cobalt: tokenToUse,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.ddb?.class) {
        Logger.warn(`Failed to retrieve class: ${data.message ?? 'Unknown error'}`);
        return null;
      }
      const ddbClass = data.ddb.class as import('../../types/index.js').DDBClass;
      const { ClassParser } = await import('../../parsers/ClassParser.js');
      const foundryClass = ClassParser.parseClass(ddbClass, proxyData);
      // Optionally, create in compendium or as embedded item
      // For now, just return the parsed structure
      Logger.info(`Successfully parsed class: ${foundryClass.name}`);
      return {
        ...foundryClass,
        isLegacy: foundryClass.isLegacy === true, // propagate legacy flag
      };
    } catch (error) {
      Logger.error(`Class import error: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Placeholder for importing class features.
   * @param className - The name of the class.
   * @param options - Import options.
   */
  public async importClassFeatures(
    className: string,
    options: Partial<ImportOptions> = {}
  ): Promise<any[]> { // Return type is any[] for now
    Logger.info(`Placeholder: importClassFeatures called for ${className}`);
    if (!this.initialized) this.init({ cobaltToken: options.cobaltToken, proxyUrl: options.proxyUrl });
    // This should delegate to ContentImportService or a new ClassImportService
    Logger.warn('importClassFeatures actual implementation in ContentImportService is pending.');
    return []; // Placeholder return
  }

  /**
   * Public method to import spells by class name using the ContentImportService.
   * @param className - The name of the class for which to import spells.
   * @param options - Optional import options.
   */
  public async importSpellsByClass(
    className: string,
    options: Partial<ImportOptions> = {}
  ): Promise<{ success: boolean; spells: FoundrySpell[]; errors: string[] }> {
    if (!this.initialized) {
      this.init({ cobaltToken: options.cobaltToken, proxyUrl: options.proxyUrl });
      Logger.warn('BeyondFoundryAPI not initialized. Call init() first.');
      // return { success: false, spells: [], errors: ['API not initialized'] }; // Init now called
    }
    if (!this.contentImportService) {
      Logger.error('ContentImportService is not available.');
      return { success: false, spells: [], errors: ['ContentImportService not available'] };
    }
    // Ensure bearer token is set if required by the service
    // Use token from options, then settings/env
    const tokenToUse = options.cobaltToken || this.settings.cobaltToken || process.env.COBALT_TOKEN;
    if (tokenToUse && this.contentImportService && (!this.contentImportService.hasBearerToken() || !this.contentImportService.isTokenSame(tokenToUse))) {
        this.contentImportService.setBearerToken(tokenToUse);
    }
    return this.contentImportService.importSpells(className, options);
  }

  /**
   * Placeholder for importing all spells.
   * @param options - Import options.
   */
  public async importAllSpells(
    options: Partial<ImportOptions> = {}
  ): Promise<FoundrySpell[]> { // Return type is FoundrySpell[] for now
    Logger.info(`Placeholder: importAllSpells called`);
    if (!this.initialized) this.init({ cobaltToken: options.cobaltToken, proxyUrl: options.proxyUrl });
    // This should delegate to ContentImportService
    // Example: const result = await this.contentImportService.importAllSpells(options);
    // return result.spells; // Assuming importAllSpells returns an object with a spells array
    Logger.warn('importAllSpells actual implementation in ContentImportService is pending.');
    return []; // Placeholder return
  }
}
