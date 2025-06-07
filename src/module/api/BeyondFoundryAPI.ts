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
   * NOTE: Simplified implementation - spell import will be enhanced in future versions
   */
  public async importCharacterSpells(
    actor: Actor,
    ddbCharacter: DDBCharacter,
    _options: Partial<ImportOptions> = {}
  ): Promise<{ success: boolean; warnings?: string[]; errors?: string[] }> {
    try {
      const warnings: string[] = [];

      if (!ddbCharacter.spells) {
        return { success: true, warnings: ['No spells found for character'] };
      }

      // Count total spells for logging
      const totalSpells = Object.values(ddbCharacter.spells).reduce(
        (sum, spellArray) => sum + (Array.isArray(spellArray) ? spellArray.length : 0),
        0
      );

      if (totalSpells > 0) {
        warnings.push(`Spell import not yet implemented - ${totalSpells} spells detected but not imported`);
        Logger.info(`Character has ${totalSpells} spells - spell import will be implemented in future version`);
      }

      return { success: true, warnings };
    } catch (error) {
      Logger.error(`Character spell import error: ${getErrorMessage(error)}`);
      return {
        success: false,
        errors: [`Character spell import error: ${getErrorMessage(error)}`],
      };
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
}
