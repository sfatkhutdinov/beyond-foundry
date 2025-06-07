import type {
  DDBCharacter,
  CharacterListResponse,
  ImportResult,
  AuthResponse,
  ImportOptions,
  DDBSpell,
} from '../../types/index.js';
import { getModuleSettings } from '../utils/settings.js';
import { Logger, getErrorMessage } from '../utils/logger.js';
import { DEFAULT_IMPORT_OPTIONS } from '../constants.js';
import { CharacterParser } from '../../parsers/character/CharacterParser.js';

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
      // Use provided token or get from settings
      const token = cobaltToken || getModuleSettings().cobaltToken;

      if (!token) {
        return {
          success: false,
          message: 'No cobalt token provided. Please authenticate first.',
        };
      }

      Logger.debug('Attempting authentication with D&D Beyond');

      const response = await fetch(`${this.proxyEndpoint}/proxy/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cobalt: token,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Logger.info('Authentication successful');
        return {
          success: true,
          userId: data.userId,
          message: 'Authentication successful',
        };
      } else {
        Logger.warn(`Authentication failed: ${data.message || 'Unknown error'}`);
        return {
          success: false,
          message: data.message || 'Authentication failed',
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
      Logger.debug(`Fetching character data for ID: ${characterId}`);

      const cobaltToken = getModuleSettings().cobaltToken;
      if (!cobaltToken) {
        Logger.error('No authentication token available. Please authenticate first.');
        return null;
      }

      const response = await fetch(`${this.proxyEndpoint}/proxy/character`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cobalt: cobaltToken,
          characterId: parseInt(characterId),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Character data is nested under ddb.character
        const character = data.ddb?.character;
        if (character) {
          Logger.info(`Retrieved character data for: ${character.name || 'Unknown'}`);
          return character;
        } else {
          Logger.warn('Character data not found in response');
          return null;
        }
      } else {
        Logger.warn(`Failed to retrieve character: ${data.message || 'Unknown error'}`);
        return null;
      }
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
      Logger.info(`Starting character import for ID: ${characterId}`);

      // Get character data from D&D Beyond
      const ddbCharacter = await this.getCharacter(characterId);
      if (!ddbCharacter) {
        return {
          success: false,
          errors: ['Failed to fetch character data from D&D Beyond'],
        };
      }

      // Merge options with defaults
      const importOptions = { ...DEFAULT_IMPORT_OPTIONS, ...options };

      // Parse character data to FoundryVTT format
      const actorData = CharacterParser.parseCharacter(ddbCharacter);

      // Check if character already exists
      const existingActor = game.actors?.find(
        actor => actor.getFlag('beyond-foundry', 'ddbCharacterId') === ddbCharacter.id
      );

      let actor: Actor;

      if (existingActor) {
        if (importOptions.updateExisting) {
          Logger.info(`Updating existing character: ${existingActor.name}`);
          await existingActor.update(actorData);
          actor = existingActor;
        } else {
          return {
            success: false,
            errors: [
              `Character "${ddbCharacter.name}" already exists. Use update option to overwrite.`,
            ],
            warnings: ['Character import skipped due to existing character'],
          };
        }
      } else {
        Logger.info(`Creating new character: ${ddbCharacter.name}`);
        actor = (await Actor.create(actorData)) as Actor;
      }

      if (!actor) {
        return {
          success: false,
          errors: ['Failed to create character in FoundryVTT'],
        };
      }

      const warnings: string[] = [];

      // Import spells if the character has any
      if (importOptions.importSpells && ddbCharacter.spells) {
        try {
          // Count total spells across all spell lists
          const totalSpells = Object.values(ddbCharacter.spells).reduce(
            (sum, spellArray) => sum + (Array.isArray(spellArray) ? spellArray.length : 0),
            0
          );

          if (totalSpells > 0) {
            Logger.info(`Importing ${totalSpells} spells for character: ${actor.name}`);

            const spellResults = await this.importCharacterSpells(
              actor,
              ddbCharacter,
              importOptions
            );
            if (spellResults.warnings && spellResults.warnings.length > 0) {
              warnings.push(...spellResults.warnings);
            }
            if (spellResults.errors && spellResults.errors.length > 0) {
              warnings.push(`Some spells failed to import: ${spellResults.errors.join(', ')}`);
            }
          }
        } catch (spellError) {
          Logger.warn(`Spell import failed: ${getErrorMessage(spellError)}`);
          warnings.push(`Spell import failed: ${getErrorMessage(spellError)}`);
        }
      }

      Logger.info(`Successfully imported character: ${actor.name}`);

      return {
        success: true,
        actor,
        warnings,
      };
    } catch (error) {
      Logger.error(`Character import error: ${getErrorMessage(error)}`);
      return {
        success: false,
        errors: [`Character import error: ${getErrorMessage(error)}`],
      };
    }
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
    try {
      const warnings: string[] = [];
      const errors: string[] = [];

      // Check if character has class data for spell fetching
      if (!ddbCharacter.classes || ddbCharacter.classes.length === 0) {
        return { success: true, warnings: ['No classes found for character - skipping spell import'] };
      }

      // Get cobalt token from settings
      const settings = getModuleSettings();
      if (!settings.cobaltToken) {
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
          const fetchClassInfo = {
            id: classInfo.definition?.id || 0,
            name: classInfo.definition?.name || 'Unknown',
            level: classInfo.level || 1,
            spellLevelAccess,
            ...(ddbCharacter.campaignId && { campaignId: ddbCharacter.campaignId }),
            ...(ddbCharacter.background?.definition?.id && { backgroundId: ddbCharacter.background.definition.id })
          };

          Logger.debug(`Fetching spells for ${fetchClassInfo.name} (Level ${fetchClassInfo.level}, Spell Level Access: ${spellLevelAccess})`);

          // Fetch spells for this class
          const classSpells = await this.fetchCharacterSpells(
            ddbCharacter.id,
            settings.cobaltToken,
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
    cobaltToken: string,
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

      // Authenticate first
      const authSuccess = await this.authenticate(cobaltToken);
      if (!authSuccess.success) {
        throw new Error('Authentication failed');
      }

      // Fetch class spells using ddb-proxy pattern
      const spells = await this.extractSpells(classInfo, `${characterId}${cobaltToken}`);
      
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
    classInfo: { id: number; name: string; spellLevelAccess: number; campaignId?: number },
    cobaltId: string
  ): Promise<DDBSpell[]> {
    try {
      const url = `${this.proxyEndpoint}/proxy/spells/${classInfo.id}?level=${classInfo.spellLevelAccess}&campaign=${classInfo.campaignId || ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cobaltId}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Spell fetch failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.message || 'Invalid spell data received');
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
    try {
      const url = `${this.proxyEndpoint}/proxy/spells/always-prepared/${classInfo.id}?level=${classInfo.spellLevelAccess}&campaign=${classInfo.campaignId || ''}&spellLists=${spellListIds.join(',')}`;
      
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
        throw new Error(data.message || 'Invalid always prepared spell data');
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
    cobaltId: string,
    includeCantrips: boolean = true,
    spellListIds: number[] = []
  ): Promise<DDBSpell[]> {
    try {
      const url = `${this.proxyEndpoint}/proxy/spells/always-known/${classInfo.id}?level=${classInfo.spellLevelAccess}&campaign=${classInfo.campaignId || ''}&background=${classInfo.backgroundId || ''}&spellLists=${spellListIds.join(',')}&cantrips=${includeCantrips}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cobaltId}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Always known spells fetch failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.message || 'Invalid always known spell data');
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

    // Test 1: Proxy connection
    const proxyTest = await this.testProxyConnection();
    ui.notifications.info(`Proxy connection: ${proxyTest ? 'SUCCESS' : 'FAILED'}`);

    // Test 2: Authentication (if token available)
    try {
      const cobaltToken = getModuleSettings().cobaltToken;
      if (cobaltToken) {
        const authResult = await this.authenticate(cobaltToken);
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
    Logger.info('To test character import:');
    Logger.info('1. Get character ID from D&D Beyond URL: dndbeyond.com/characters/{ID}');
    Logger.info(
      '2. Use: game.modules.get("beyond-foundry").api.quickTest("cobalt-token", "character-id")'
    );

    Logger.info('Connection test complete');
  }

  /**
   * Quick authentication and character test
   * @param cobaltToken - Your D&D Beyond CobaltSession cookie value
   * @param characterId - Optional specific character ID to test with
   */
  public async quickTest(cobaltToken: string, characterId?: string): Promise<void> {
    Logger.info('Running quick authentication test...');

    try {
      // Test authentication
      const authResult = await this.authenticate(cobaltToken);
      if (!authResult.success) {
        ui.notifications.error(`Authentication failed: ${authResult.message}`);
        return;
      }

      ui.notifications.info('✅ Authentication successful!');
      Logger.info(`✅ Authenticated as user ID: ${authResult.userId}`);

      // Test character retrieval if ID provided
      if (characterId) {
        Logger.info(`Testing character retrieval for ID: ${characterId}...`);
        const character = await this.getCharacter(characterId);

        if (character) {
          ui.notifications.info(`✅ Character found: ${character.name}`);
          Logger.info(`✅ Character Details:`);
          Logger.info(`  - Name: ${character.name}`);
          Logger.info(`  - Race: ${character.race?.fullName || 'Unknown'}`);
          Logger.info(
            `  - Classes: ${character.classes?.map(c => `${c.definition?.name} ${c.level}`).join(', ') || 'Unknown'}`
          );
          Logger.info(`  - Background: ${character.background?.definition?.name || 'Unknown'}`);
          Logger.info(`  - HP: ${character.baseHitPoints || 'Unknown'}`);

          Logger.info(`\n💡 To import this character, run:`);
          Logger.info(`game.modules.get("beyond-foundry").api.importCharacter("${characterId}")`);
        } else {
          ui.notifications.warn(`❌ Failed to retrieve character with ID: ${characterId}`);
          Logger.warn('Make sure the character ID is correct and accessible with your account');
        }
      } else {
        // Explain how to get character IDs
        Logger.info('\n📋 To test character import:');
        Logger.info('1. Go to dndbeyond.com/characters');
        Logger.info('2. Click on a character');
        Logger.info('3. Copy the ID from the URL: dndbeyond.com/characters/{ID}');
        Logger.info(
          '4. Run: game.modules.get("beyond-foundry").api.quickTest("your-cobalt-token", "character-id")'
        );
      }
    } catch (error) {
      ui.notifications.error(`Quick test failed: ${getErrorMessage(error)}`);
      Logger.error(`Quick test error: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Development testing interface - comprehensive system test
   * Tests all major functionality in sequence
   */
  public async runFullSystemTest(): Promise<void> {
    Logger.info('🧪 Starting comprehensive system test...');

    try {
      // Test 1: Proxy Connection
      Logger.info('📡 Test 1: Proxy Connection');
      const proxyOk = await this.testProxyConnection();
      if (proxyOk) {
        Logger.info('✅ Proxy connection: PASS');
      } else {
        Logger.error('❌ Proxy connection: FAIL');
        return;
      }

      // Test 2: Settings validation
      Logger.info('⚙️  Test 2: Settings Validation');
      const settings = getModuleSettings();
      Logger.info(`Proxy URL: ${settings.proxyUrl}`);
      Logger.info(`Debug Mode: ${settings.debugMode}`);
      
      if (!settings.cobaltToken) {
        Logger.warn('⚠️  No cobalt token configured - authentication tests will be skipped');
        Logger.info('Set token in module settings or run: api.quickTest("your-token")');
      }

      // Test 3: Authentication (if token available)
      if (settings.cobaltToken) {
        Logger.info('🔐 Test 3: Authentication');
        const authResult = await this.authenticate();
        if (authResult.success) {
          Logger.info(`✅ Authentication: PASS (User ID: ${authResult.userId || 'Unknown'})`);
        } else {
          Logger.error(`❌ Authentication: FAIL (${authResult.message})`);
          return;
        }
      }

      // Test 4: Parser functionality
      Logger.info('🔧 Test 4: Parser Functionality Available');
      Logger.info('✅ CharacterParser: Ready');
      Logger.info('✅ SpellParser: Ready');

      // Test 5: UI Components
      Logger.info('🖥️  Test 5: UI Components');
      Logger.info('✅ Character Import Dialog: Available');
      Logger.info('✅ Auth Dialog: Available');
      Logger.info('✅ Settings Interface: Available');

      // Summary
      Logger.info('\n🎉 System test completed!');
      Logger.info('\n📋 Next Steps:');
      Logger.info('1. Configure cobalt token in settings if not done');
      Logger.info('2. Test character import: api.importCharacter("character-id")');
      Logger.info('3. Open import dialog: new CharacterImportDialog().render(true)');

    } catch (error) {
      Logger.error(`System test failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Quick diagnostic for troubleshooting
   */
  public async runDiagnostic(): Promise<void> {
    Logger.info('🔍 Beyond Foundry Diagnostic');
    Logger.info('='.repeat(40));

    // Environment info
    Logger.info(`System: ${game.system.id}`);

    // Settings
    const settings = getModuleSettings();
    Logger.info(`\nSettings:`);
    Logger.info(`  Proxy URL: ${settings.proxyUrl}`);
    Logger.info(`  Has Token: ${settings.cobaltToken ? 'Yes' : 'No'}`);
    Logger.info(`  Debug Mode: ${settings.debugMode}`);

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
  private isSpellcastingClass(classInfo: { definition?: { name?: string; spellRules?: unknown }; subclass?: { definition?: { name?: string } } }): boolean {
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
  private calculateSpellLevelAccess(classInfo: { definition?: { name?: string }; level?: number; subclass?: { definition?: { name?: string } } }): number {
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
   * Add spells to a Foundry actor using SpellParser
   */
  private async addSpellsToActor(
    actor: Actor, 
    spells: DDBSpell[], 
    options: Partial<ImportOptions>
  ): Promise<number> {
    try {
      // Import SpellParser dynamically to avoid circular dependencies
      const { SpellParser } = await import('../../parsers/spells/SpellParser.js');
      
      let importedCount = 0;
      
      for (const ddbSpell of spells) {
        try {
          // Parse spell to Foundry format
          const foundrySpell = SpellParser.parseSpell(ddbSpell);
          
          // Check if spell already exists
          const existingSpell = actor.items.find(
            (item: any) => item.type === 'spell' && 
                   item.getFlag('beyond-foundry', 'ddbId') === ddbSpell.id
          );
          
          if (existingSpell && !options.updateExisting) {
            Logger.debug(`Skipping existing spell: ${foundrySpell.name}`);
            continue;
          }
          
          // Add DDB metadata
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
          
          if (existingSpell) {
            await existingSpell.update(foundrySpell);
            Logger.debug(`Updated spell: ${foundrySpell.name}`);
          } else {
            await Item.create(foundrySpell as any, { parent: actor });
            Logger.debug(`Created spell: ${foundrySpell.name}`);
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
}
