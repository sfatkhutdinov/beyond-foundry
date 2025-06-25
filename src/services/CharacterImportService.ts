import type {
  DDBCharacter,
  FoundryActor,
  ImportResult,
  ImportOptions,
} from '../types/index.js';
import { Logger, getErrorMessage } from '../module/utils/logger.js';
import { CharacterParser } from '../parsers/character/CharacterParser.js';

/**
 * API-First Character Import Service
 * 
 * This service handles character imports using D&D Beyond's rich character API endpoint:
 * character-service.dndbeyond.com/character/v5/character/{id}
 * 
 * Architecture Philosophy:
 * - Character import is API-first (95% complete from rich endpoint)
 * - Character data comes from comprehensive API response
 * - Only minimal augmentation needed (5%)
 * - Completely separate from content imports (spells, items, monsters)
 * - Content imports remain scraping-based for full data quality
 * 
 * This separation ensures:
 * - Character import utilizes rich API data fully
 * - Content imports maintain highest quality through scraping
 * - Clear separation of concerns
 * - No mixing of character construction vs content construction patterns
 */
export class CharacterImportService {
  private proxyEndpoint: string;
  private bearerToken: string | null = null;

  constructor(proxyEndpoint: string) {
    this.proxyEndpoint = proxyEndpoint;
  }

  /**
   * Check if the service has a bearer token.
   */
  public hasBearerToken(): boolean {
    return !!this.bearerToken;
  }

  /**
   * Check if the provided token is the same as the currently stored one.
   * @param token The token to compare.
   * @returns True if the tokens are the same, false otherwise.
   */
  public isTokenSame(token: string): boolean {
    return this.bearerToken === token;
  }

  /**
   * Set the bearer token for authenticated requests
   */
  public setBearerToken(token: string): void {
    this.bearerToken = token;
  }

  /**
   * Import character using API-first approach
   * Uses the rich character API endpoint for comprehensive data
   * 
   * @param characterId - D&D Beyond character ID
   * @param options - Import options
   * @returns Import result with character actor
   */
  public async importCharacter(
    characterId: string,
    options: Partial<ImportOptions> = {}
  ): Promise<ImportResult> {
    try {
      Logger.info(`🎭 API-First Character Import: ${characterId}`);

      // Ensure bearer token is available for the service.
      // It might have been set by BeyondFoundryAPI.init or an explicit authenticate call.
      // If options contain a cobaltToken, and it's different, BeyondFoundryAPI should have re-authed
      // and updated this service's token via setBearerToken.
      if (!this.bearerToken && options.cobaltToken) {
        // This case implies BeyondFoundryAPI didn't correctly set the token from options
        // or an auth call failed silently. For robustness, we could try to use it,
        // but ideally, the API class manages token state for services.
        Logger.warn('CharacterImportService: Bearer token not set, but cobaltToken found in options. This might indicate an issue in token propagation.');
        // For now, we rely on BeyondFoundryAPI to have called setBearerToken if auth was successful.
      }
      
      if (!this.bearerToken) {
        return {
          success: false,
          errors: ['Authentication token not available in CharacterImportService. Ensure API is authenticated.'],
          endpoint: 'CharacterImportService.importCharacter',
        };
      }

      // Step 1: Get comprehensive character data from rich API endpoint
      const ddbCharacter = await this.fetchCharacterFromAPI(characterId);
      if (!ddbCharacter) {
        return {
          success: false,
          errors: ['Failed to fetch character data from D&D Beyond API'],
          endpoint: 'CharacterImportService.importCharacter',
        };
      }

      Logger.info(`✅ Retrieved rich character data: ${ddbCharacter.name}`);

      // Step 2: Parse character using API-first approach (95% complete from API)
      const actorData = await this.parseCharacterFromAPI(ddbCharacter);

      // Step 3: Check for existing character
      // This part uses `game.actors` and will not work in test scripts.
      // Conditional execution for test environment.
      let existingActor: Actor | undefined = undefined;
      if (typeof game !== 'undefined' && game.actors) {
        existingActor = game.actors?.find(
          (actor: Actor) => actor.getFlag('beyond-foundry', 'ddbCharacterId') === ddbCharacter.id
        );
      } else {
        Logger.debug('Skipping existing actor check in test environment (game object not available).');
      }
      

      let actor: Actor | undefined = undefined; // Type as Actor | undefined

      if (existingActor) {
        if (options.updateExisting) {
          Logger.info(`🔄 Updating existing character: ${existingActor.name}`);
          await existingActor.update(actorData);
          actor = existingActor;
        } else {
          return {
            success: false,
            errors: [
              `Character "${ddbCharacter.name}" already exists. Use update option to overwrite.`,
            ],
            warnings: ['Character import skipped due to existing character'],
            endpoint: 'CharacterImportService.importCharacter',
          };
        }
      } else {
        Logger.info(`🆕 Creating new character: ${ddbCharacter.name}`);
        if (typeof Actor !== 'undefined' && typeof Actor.create === 'function') {
            actor = (await Actor.create(actorData)) as Actor;
        } else {
            Logger.warn('Actor.create not available in this environment. Character will not be created in Foundry.');
            // For testing purposes, we can consider the parsing successful if actorData is generated.
            // The test script will save the parsed actorData.
        }
      }

      // If actor is still undefined (e.g. in test env or creation failed)
      // but parsing was successful, we can still return success for the parsing part.
      if (!actor && typeof game !== 'undefined') { // Only error if in Foundry and actor creation failed
        return {
          success: false,
          errors: ['Failed to create character in FoundryVTT'],
          endpoint: 'CharacterImportService.importCharacter',
        };
      }

      // Step 4: Optional augmentation (5% - only what's missing from API)
      // This also might depend on Foundry specifics.
      let warnings: string[] = [];
      if (actor) { // Only augment if actor exists (i.e., in Foundry)
        warnings = await this.augmentCharacterIfNeeded(actor, ddbCharacter, options);
      } else {
        warnings.push('Skipped character augmentation (actor not created/available).');
      }

      Logger.info(`🎉 API-First Character Import Processed: ${ddbCharacter.name}`);

      return {
        success: true, // Parsing was successful
        actor: actor as unknown as FoundryActor, // This will be undefined in tests, which is fine
        parsedData: actorData, // Include parsed data for tests to verify
        warnings,
        endpoint: 'CharacterImportService.importCharacter',
      };

    } catch (error) {
      Logger.error(`Character import error: ${getErrorMessage(error)}`);
      return {
        success: false,
        errors: [`Character import error: ${getErrorMessage(error)}`],
        endpoint: 'CharacterImportService.importCharacter',
      };
    }
  }

  /**
   * Fetch character data from D&D Beyond's rich character API
   * This endpoint provides comprehensive character data in a single call
   */
  private async fetchCharacterFromAPI(characterId: string): Promise<DDBCharacter | null> {
    try {
      if (!this.bearerToken) {
        Logger.warn('No Bearer token available for character API call');
        return null;
      }

      const response = await fetch(`${this.proxyEndpoint}/proxy/character/${characterId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-cobalt-id': this.bearerToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data) {
          Logger.debug(`📊 Rich API Data Retrieved: ${data.name ?? 'Unknown'}`);
          Logger.debug(`  • Classes: ${data.classes?.length ?? 0}`);
          Logger.debug(`  • Items: ${data.inventory?.length ?? 0}`);
          Logger.debug(`  • Spells: ${Object.keys(data.spells || {}).length}`);
          Logger.debug(`  • Features: ${data.features?.length ?? 0}`);
          return data;
        } else {
          Logger.warn('Character data not found in API response');
          return null;
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        Logger.warn(`API call failed: ${response.status} - ${errorData?.message ?? errorData?.error ?? 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      Logger.error(`Character API fetch error: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Parse character using API-first approach
   * The rich API provides 95% of what we need directly
   */
  private async parseCharacterFromAPI(ddbCharacter: DDBCharacter): Promise<FoundryActor> {
    Logger.debug(`🔮 Parsing character from rich API data: ${ddbCharacter.name}`);
    
    // Use the existing CharacterParser but emphasize it's working with rich API data
    const actorData = await CharacterParser.parseCharacter(ddbCharacter);
    
    // Mark this as API-first import in flags
    actorData.flags = {
      ...actorData.flags,
      'beyond-foundry': {
        ...actorData.flags?.['beyond-foundry'],
        importMethod: 'api-first',
        apiVersion: 'v5',
        importedAt: Date.now(),
        richAPIData: true,
        parsingVersion: '3.0.0-api-first',
      },
    };

    Logger.debug(`✅ API-First parsing complete: ${actorData.name}`);
    return actorData;
  }

  /**
   * Optional augmentation for character data (5% - only what's missing from API)
   * This is where we can add any data that the rich API doesn't provide
   * but we can get from other sources if needed
   */
  private async augmentCharacterIfNeeded(
    actor: Actor,
    _ddbCharacter: DDBCharacter, // Added underscore
    _options: Partial<ImportOptions> // Added underscore
  ): Promise<string[]> {
    const warnings: string[] = [];
    
    try {
      Logger.debug(`🔧 Checking if augmentation needed for: ${actor.name}`);

      // Example augmentation: Check if any critical data is missing from API
      // and needs to be fetched from other sources
      
      // Note: Most augmentation should be minimal since the API is comprehensive
      // This is mainly for edge cases or future enhancements

      Logger.debug(`✅ Augmentation check complete. Warnings: ${warnings.length}`);
      
    } catch (error) {
      Logger.warn(`Augmentation error: ${getErrorMessage(error)}`);
      warnings.push(`Character augmentation had issues: ${getErrorMessage(error)}`);
    }

    return warnings;
  }

  /**
   * Validate that we received comprehensive data from the API
   */
  private validateAPIData(ddbCharacter: DDBCharacter): { isComplete: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    // Check for essential character data
    if (!ddbCharacter.name) missingFields.push('name');
    if (!ddbCharacter.race) missingFields.push('race');
    if (!ddbCharacter.classes || ddbCharacter.classes.length === 0) missingFields.push('classes');
    if (!ddbCharacter.stats) missingFields.push('stats');

    // Check for common optional data
    if (!ddbCharacter.inventory) missingFields.push('inventory');
    if (!ddbCharacter.spells) missingFields.push('spells');

    return {
      isComplete: missingFields.length === 0,
      missingFields,
    };
  }

  /**
   * Get character data directly from API (without importing to Foundry)
   * Useful for validation, preview, or external integrations
   */
  public async getCharacterData(characterId: string): Promise<DDBCharacter | null> {
    Logger.info(`📊 Fetching character data only: ${characterId}`);
    return this.fetchCharacterFromAPI(characterId);
  }
}
