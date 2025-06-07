import type {
  ImportResult,
  ImportOptions,
  CharacterEndpointResponse,
  ItemEndpointResponse,
  SpellEndpointResponse,
  FeatureEndpointResponse,
  ActionsEndpointResponse,
  CurrencyEndpointResponse,
  StoryEndpointResponse,
  DebugStatusResponse,
  ExportResponse,
  DDBCharacter,
  DDBSpell,
  DDBItem,
  DDBCurrency,
  FoundryItemData,
  FoundrySpell,
  ItemCategory,
  EncumbranceData,
  CharacterAction,
  CharacterStory,
  JournalEntry,
  FileData
} from '../../types/index.js';
import { BeyondFoundryAPI } from './BeyondFoundryAPI.js';
import { CharacterParser } from '../../parsers/character/CharacterParser.js';
import { ItemParser } from '../../parsers/items/ItemParser.js';
import { FeatureParser } from '../../parsers/features/FeatureParser.js';
import { SpellParser } from '../../parsers/spells/SpellParser.js';
import { Logger, getErrorMessage } from '../utils/logger.js';

/**
 * Route Handler for Beyond Foundry API Endpoints
 * Provides structured endpoints for D&D Beyond content conversion
 */
export class RouteHandler {
  private api: BeyondFoundryAPI;

  constructor() {
    this.api = BeyondFoundryAPI.getInstance();
  }

  /**
   * Main character conversion endpoint
   * GET /import/character/:id
   */
  async getCharacter(characterId: string, _options: Partial<ImportOptions> = {}): Promise<CharacterEndpointResponse> {
    try {
      Logger.info(`🧍 Character endpoint called for ID: ${characterId}`);

      const ddbCharacter = await this.api.getCharacter(characterId);
      if (!ddbCharacter) {
        return {
          success: false,
          endpoint: '/import/character',
          error: 'Failed to fetch character data from D&D Beyond',
          characterId
        };
      }

      // Parse to Foundry format
      const foundryData = CharacterParser.parseCharacter(ddbCharacter);

      return {
        success: true,
        endpoint: '/import/character',
        characterId,
        data: {
          ddbCharacter,
          foundryActor: foundryData,
          metadata: {
            sourceId: `ddb:character:${characterId}`,
            importedAt: new Date().toISOString(),
            version: game.modules.get('beyond-foundry')?.version || '1.0.0'
          }
        },
        totalItems: this.getItemCount(ddbCharacter),
        totalSpells: this.getSpellCount(ddbCharacter),
        totalFeatures: this.getFeatureCount(ddbCharacter)
      };

    } catch (error) {
      Logger.error(`Character endpoint error: ${getErrorMessage(error)}`);
      return {
        success: false,
        endpoint: '/import/character',
        characterId,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Items & Equipment endpoint
   * GET /import/character/:id/items
   */
  async getCharacterItems(characterId: string): Promise<ItemEndpointResponse> {
    try {
      Logger.info(`⚔️ Items endpoint called for character: ${characterId}`);

      const ddbCharacter = await this.api.getCharacter(characterId);
      if (!ddbCharacter) {
        return {
          success: false,
          endpoint: '/import/character/items',
          characterId,
          error: 'Failed to fetch character data from D&D Beyond'
        };
      }

      // Parse all items using ItemParser
      const items = await ItemParser.parseCharacterItems(ddbCharacter);

      return {
        success: true,
        endpoint: '/import/character/items',
        characterId,
        data: {
          items: items.map(item => ({
            ...item,
            flags: {
              'beyond-foundry': {
                sourceId: `ddb:character:${characterId}`,
                origin: 'D&D Beyond',
                importedAt: Date.now()
              }
            }
          })),
          categories: this.categorizeItems(items),
          summary: {
            totalItems: items.length,
            equipped: items.filter(item => item.system?.equipped).length,
            magical: items.filter(item => item.system?.rarity && item.system.rarity !== 'common').length
          }
        }
      };

    } catch (error) {
      Logger.error(`Items endpoint error: ${getErrorMessage(error)}`);
      return {
        success: false,
        endpoint: '/import/character/items',
        characterId,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Features & Feats endpoint
   * GET /import/character/:id/features
   */
  async getCharacterFeatures(characterId: string): Promise<FeatureEndpointResponse> {
    try {
      Logger.info(`🧠 Features endpoint called for character: ${characterId}`);

      const ddbCharacter = await this.api.getCharacter(characterId);
      if (!ddbCharacter) {
        return {
          success: false,
          endpoint: '/import/character/features',
          characterId,
          error: 'Failed to fetch character data from D&D Beyond'
        };
      }

      // Parse features using FeatureParser
      const features = await FeatureParser.parseCharacterFeatures(ddbCharacter);

      return {
        success: true,
        endpoint: '/import/character/features',
        characterId,
        data: {
          features: features.map(feature => ({
            ...feature,
            flags: {
              'beyond-foundry': {
                sourceId: `ddb:character:${characterId}`,
                origin: 'D&D Beyond',
                importedAt: Date.now()
              }
            }
          })),
          categories: {
            classFeatures: features.filter(f => f.system?.type?.value === 'class'),
            raceFeatures: features.filter(f => f.system?.type?.value === 'race'),
            feats: features.filter(f => f.system?.type?.value === 'feat'),
            backgroundFeatures: features.filter(f => f.system?.type?.value === 'background')
          },
          summary: {
            totalFeatures: features.length,
            withUses: features.filter(f => f.system?.uses?.max).length,
            passive: features.filter(f => !f.system?.activation?.type).length
          }
        }
      };

    } catch (error) {
      Logger.error(`Features endpoint error: ${getErrorMessage(error)}`);
      return {
        success: false,
        endpoint: '/import/character/features',
        characterId,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Spells endpoint
   * GET /import/character/:id/spells
   */
  async getCharacterSpells(characterId: string): Promise<SpellEndpointResponse> {
    try {
      Logger.info(`🪄 Spells endpoint called for character: ${characterId}`);

      const ddbCharacter = await this.api.getCharacter(characterId);
      if (!ddbCharacter) {
        return {
          success: false,
          endpoint: '/import/character/spells',
          characterId,
          error: 'Failed to fetch character data from D&D Beyond'
        };
      }

      // Use the existing spell fetching functionality
      const spells = [];
      const spellsByLevel: Record<number, FoundrySpell[]> = {};

      if (ddbCharacter.classes) {
        for (const classInfo of ddbCharacter.classes) {
          if (this.api.isSpellcastingClass(classInfo)) {
            try {
              const classSpells = await this.api.fetchCharacterSpells(
                ddbCharacter.id,
                game.settings.get('beyond-foundry', 'cobaltToken'),
                {
                  id: classInfo.definition?.id || 0,
                  name: classInfo.definition?.name || 'Unknown',
                  level: classInfo.level || 1,
                  spellLevelAccess: this.api.calculateSpellLevelAccess(classInfo)
                }
              );
              spells.push(...classSpells);
            } catch (error) {
              Logger.warn(`Failed to fetch spells for class ${classInfo.definition?.name}: ${getErrorMessage(error)}`);
            }
          }
        }
      }

      // Group spells by level
      for (const spell of spells) {
        const level = spell.definition?.level || 0;
        if (!spellsByLevel[level]) spellsByLevel[level] = [];
        spellsByLevel[level].push(spell);
      }

      return {
        success: true,
        endpoint: '/import/character/spells',
        characterId,
        data: {
          spells: spells.map(spell => ({
            ...spell,
            flags: {
              'beyond-foundry': {
                sourceId: `ddb:character:${characterId}`,
                origin: 'D&D Beyond',
                importedAt: Date.now(),
                ddbId: spell.id
              }
            }
          })),
          spellsByLevel,
          summary: {
            totalSpells: spells.length,
            preparedSpells: spells.filter(s => s.prepared).length,
            knownSpells: spells.filter(s => !s.prepared).length,
            cantrips: spellsByLevel[0]?.length || 0,
            highestLevel: Math.max(...Object.keys(spellsByLevel).map(Number))
          }
        }
      };

    } catch (error) {
      Logger.error(`Spells endpoint error: ${getErrorMessage(error)}`);
      return {
        success: false,
        endpoint: '/import/character/spells',
        characterId,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Inventory organization endpoint
   * GET /import/character/:id/inventory
   */
  async getCharacterInventory(characterId: string): Promise<ItemEndpointResponse> {
    try {
      Logger.info(`🎒 Inventory endpoint called for character: ${characterId}`);

      // Get items and organize them differently than the general items endpoint
      const itemsResult = await this.getCharacterItems(characterId);
      
      if (!itemsResult.success) {
        return {
          ...itemsResult,
          endpoint: '/import/character/inventory'
        };
      }

      const items = itemsResult.data?.items || [];

      return {
        success: true,
        endpoint: '/import/character/inventory',
        characterId,
        data: {
          items,
          containers: items.filter(item => item.type === 'container'),
          inventory: {
            equipped: items.filter(item => item.system?.equipped),
            backpack: items.filter(item => !item.system?.equipped && item.type !== 'container'),
            containers: items.filter(item => item.type === 'container')
          },
          encumbrance: this.calculateEncumbrance(items),
          summary: {
            totalWeight: items.reduce((sum, item) => sum + (item.system?.weight || 0) * (item.system?.quantity || 1), 0),
            totalValue: items.reduce((sum, item) => sum + (item.system?.price?.value || 0) * (item.system?.quantity || 1), 0)
          }
        }
      };

    } catch (error) {
      Logger.error(`Inventory endpoint error: ${getErrorMessage(error)}`);
      return {
        success: false,
        endpoint: '/import/character/inventory',
        characterId,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Actions & Attacks endpoint
   * GET /import/character/:id/actions
   */
  async getCharacterActions(characterId: string): Promise<ActionsEndpointResponse> {
    try {
      Logger.info(`🏹 Actions endpoint called for character: ${characterId}`);

      const ddbCharacter = await this.api.getCharacter(characterId);
      if (!ddbCharacter) {
        return {
          success: false,
          endpoint: '/import/character/actions',
          characterId,
          error: 'Failed to fetch character data from D&D Beyond'
        };
      }

      // Parse actions from character data
      const actions = await this.parseCharacterActions(ddbCharacter);

      return {
        success: true,
        endpoint: '/import/character/actions',
        characterId,
        data: {
          actions: actions.map(action => ({
            ...action,
            flags: {
              'beyond-foundry': {
                sourceId: `ddb:character:${characterId}`,
                origin: 'D&D Beyond',
                importedAt: Date.now()
              }
            }
          })),
          categories: {
            attacks: actions.filter(a => a.system?.actionType === 'mwak' || a.system?.actionType === 'rwak'),
            spellAttacks: actions.filter(a => a.system?.actionType === 'msak' || a.system?.actionType === 'rsak'),
            other: actions.filter(a => a.system?.actionType === 'other' || !a.system?.actionType)
          },
          summary: {
            totalActions: actions.length,
            weaponAttacks: actions.filter(a => a.system?.actionType === 'mwak' || a.system?.actionType === 'rwak').length,
            spellAttacks: actions.filter(a => a.system?.actionType === 'msak' || a.system?.actionType === 'rsak').length
          }
        }
      };

    } catch (error) {
      Logger.error(`Actions endpoint error: ${getErrorMessage(error)}`);
      return {
        success: false,
        endpoint: '/import/character/actions',
        characterId,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Currency endpoint
   * GET /import/character/:id/currency
   */
  async getCharacterCurrency(characterId: string): Promise<CurrencyEndpointResponse> {
    try {
      Logger.info(`🪙 Currency endpoint called for character: ${characterId}`);

      const ddbCharacter = await this.api.getCharacter(characterId);
      if (!ddbCharacter) {
        return {
          success: false,
          endpoint: '/import/character/currency',
          characterId,
          error: 'Failed to fetch character data from D&D Beyond'
        };
      }

      const currencies = ddbCharacter.currencies || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
      const foundryFormat = this.convertCurrencyObjectToFoundryFormat(currencies);

      return {
        success: true,
        endpoint: '/import/character/currency',
        characterId,
        data: {
          raw: currencies,
          foundryFormat,
          summary: {
            totalGoldValue: this.calculateTotalGoldValue(foundryFormat),
            currencies: Object.keys(foundryFormat).length
          }
        }
      };

    } catch (error) {
      Logger.error(`Currency endpoint error: ${getErrorMessage(error)}`);
      return {
        success: false,
        endpoint: '/import/character/currency',
        characterId,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Story & Background endpoint
   * GET /import/character/:id/story
   */
  async getCharacterStory(characterId: string): Promise<StoryEndpointResponse> {
    try {
      Logger.info(`📘 Story endpoint called for character: ${characterId}`);

      const ddbCharacter = await this.api.getCharacter(characterId);
      if (!ddbCharacter) {
        return {
          success: false,
          endpoint: '/import/character/story',
          characterId,
          error: 'Failed to fetch character data from D&D Beyond'
        };
      }

      const story = this.parseCharacterStory(ddbCharacter);

      return {
        success: true,
        endpoint: '/import/character/story',
        characterId,
        data: {
          background: story.background,
          personality: story.personality,
          biography: story.biography,
          notes: story.notes,
          foundryJournalEntry: await this.createStoryJournalEntry(story, characterId)
        }
      };

    } catch (error) {
      Logger.error(`Story endpoint error: ${getErrorMessage(error)}`);
      return {
        success: false,
        endpoint: '/import/character/story',
        characterId,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Debug status endpoint
   * GET /debug/status
   */
  async getDebugStatus(): Promise<DebugStatusResponse> {
    try {
      const settings = game.settings.get('beyond-foundry', 'proxyUrl');
      const proxyStatus = await this.testProxyConnection();
      
      return {
        success: true,
        endpoint: '/debug/status',
        data: {
          module: {
            id: 'beyond-foundry',
            version: game.modules.get('beyond-foundry')?.version || '1.0.0',
            active: game.modules.get('beyond-foundry')?.active || false
          },
          proxy: {
            url: settings,
            connected: proxyStatus.success,
            lastTest: new Date().toISOString()
          },
          foundry: {
            version: game.version || 'unknown',
            system: game.system.id,
            world: game.world?.id || 'unknown'
          },
          authentication: {
            hasToken: !!game.settings.get('beyond-foundry', 'cobaltToken'),
            tokenValid: false // TODO: Add token validation
          }
        }
      };

    } catch (error) {
      Logger.error(`Debug status error: ${getErrorMessage(error)}`);
      return {
        success: false,
        endpoint: '/debug/status',
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Full character sync endpoint
   * POST /import/character/:id/full
   */
  async importCharacterFull(
    characterId: string, 
    options: Partial<ImportOptions> = {}
  ): Promise<ImportResult> {
    try {
      Logger.info(`🔁 Full import endpoint called for character: ${characterId}`);

      // Use the existing full import functionality
      const result = await this.api.importCharacter(characterId, {
        ...options,
        importSpells: true,
        importItems: true,
        createCompendiumItems: false
      });

      return {
        ...result,
        endpoint: '/import/character/full'
      };

    } catch (error) {
      Logger.error(`Full import endpoint error: ${getErrorMessage(error)}`);
      return {
        success: false,
        endpoint: '/import/character/full',
        errors: [getErrorMessage(error)]
      };
    }
  }

  /**
   * Export character endpoint
   * GET /export/character/:id
   */
  async exportCharacter(characterId: string): Promise<ExportResponse> {
    try {
      Logger.info(`💾 Export endpoint called for character: ${characterId}`);

      // Get character from FoundryVTT
      const actor = game.actors?.find(
        a => a.getFlag('beyond-foundry', 'ddbCharacterId') === parseInt(characterId)
      );

      if (!actor) {
        return {
          success: false,
          endpoint: '/export/character',
          characterId,
          error: 'Character not found in FoundryVTT world'
        };
      }

      const exportData = {
        actor: actor.toObject(),
        items: actor.items.map((item: any) => item.toObject()),
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: game.user?.name || 'Unknown',
          version: game.modules.get('beyond-foundry')?.version || '1.0.0',
          foundryVersion: game.version || 'unknown',
          systemVersion: game.system.version || 'unknown'
        }
      };

      return {
        success: true,
        endpoint: '/export/character',
        characterId,
        data: exportData,
        downloadUrl: await this.createDownloadFile(exportData, actor.name || 'character')
      };

    } catch (error) {
      Logger.error(`Export endpoint error: ${getErrorMessage(error)}`);
      return {
        success: false,
        endpoint: '/export/character',
        characterId,
        error: getErrorMessage(error)
      };
    }
  }

  // Helper methods for data processing
  private getItemCount(character: DDBCharacter): number {
    return (character.inventory || []).length;
  }

  private getSpellCount(character: DDBCharacter): number {
    if (!character.spells) return 0;
    return Object.values(character.spells).reduce(
      (sum, spellArray) => sum + (Array.isArray(spellArray) ? spellArray.length : 0),
      0
    );
  }

  private getFeatureCount(character: DDBCharacter): number {
    return (character.classFeatures || []).length + 
           (character.raceFeatures || []).length + 
           (character.feats || []).length;
  }

  private categorizeItems(items: FoundryItemData[]): ItemCategory {
    return {
      weapons: items.filter(item => item.type === 'weapon'),
      armor: items.filter(item => item.type === 'equipment' && item.system?.armor),
      equipment: items.filter(item => item.type === 'equipment' && !item.system?.armor),
      consumables: items.filter(item => item.type === 'consumable'),
      tools: items.filter(item => item.type === 'tool'),
      containers: items.filter(item => item.type === 'container'),
      loot: items.filter(item => item.type === 'loot')
    };
  }

  private calculateEncumbrance(items: any[]): any {
    const totalWeight = items.reduce((sum, item) => 
      sum + (item.system?.weight || 0) * (item.system?.quantity || 1), 0
    );
    
    // TODO: Calculate based on character strength
    return {
      current: totalWeight,
      max: 150, // Placeholder - should be calculated from character stats
      encumbered: totalWeight > 150
    };
  }

  private async parseCharacterActions(character: DDBCharacter): Promise<any[]> {
    const actions = [];
    
    // Parse weapon attacks from inventory
    if (character.inventory) {
      for (const item of character.inventory) {
        if (item.definition?.type === 'Weapon') {
          actions.push({
            name: item.definition.name,
            type: 'weapon',
            system: {
              actionType: item.definition.attackType === 1 ? 'mwak' : 'rwak',
              damage: this.parseWeaponDamage(item),
              range: this.parseWeaponRange(item),
              properties: item.definition.properties || []
            }
          });
        }
      }
    }

    return actions;
  }

  private parseWeaponDamage(weapon: any): any {
    // TODO: Implement weapon damage parsing
    return {
      parts: [],
      versatile: ''
    };
  }

  private parseWeaponRange(weapon: any): any {
    // TODO: Implement weapon range parsing
    return {
      value: weapon.definition?.range || 5,
      long: weapon.definition?.longRange || null,
      units: 'ft'
    };
  }

  private parseCurrency(currencies: any[]): Record<string, number> {
    const foundryFormat: Record<string, number> = {
      pp: 0, gp: 0, ep: 0, sp: 0, cp: 0
    };

    for (const currency of currencies) {
      const type = this.mapCurrencyType(currency.type);
      if (type) {
        foundryFormat[type] = currency.quantity || 0;
      }
    }

    return foundryFormat;
  }

  private mapCurrencyType(ddbType: string): string | null {
    const map: Record<string, string> = {
      'Platinum Piece': 'pp',
      'Gold Piece': 'gp', 
      'Electrum Piece': 'ep',
      'Silver Piece': 'sp',
      'Copper Piece': 'cp'
    };
    return map[ddbType] || null;
  }

  /**
   * Convert D&D Beyond currency object to Foundry format
   */
  private convertCurrencyObjectToFoundryFormat(currencies: { cp?: number; sp?: number; ep?: number; gp?: number; pp?: number }): Record<string, number> {
    return {
      pp: currencies.pp || 0,
      gp: currencies.gp || 0,
      ep: currencies.ep || 0,
      sp: currencies.sp || 0,
      cp: currencies.cp || 0
    };
  }

  /**
   * Calculate total gold value from currency object
   */
  private calculateTotalGoldValue(currencies: Record<string, number>): number {
    return (currencies.pp || 0) * 10 + (currencies.gp || 0) + (currencies.ep || 0) * 0.5 + 
           (currencies.sp || 0) * 0.1 + (currencies.cp || 0) * 0.01;
  }

  /**
   * Calculate gold value from D&D Beyond currency object
   */
  private calculateGoldValue(currencies: { cp?: number; sp?: number; ep?: number; gp?: number; pp?: number }): number {
    return ((currencies.pp || 0) * 10) + (currencies.gp || 0) + ((currencies.ep || 0) * 0.5) +
           ((currencies.sp || 0) * 0.1) + ((currencies.cp || 0) * 0.01);
  }

  private parseCharacterStory(character: DDBCharacter): any {
    return {
      background: {
        name: character.background?.definition?.name || '',
        description: character.background?.definition?.description || '',
        feature: character.background?.definition?.featureName || '',
        featureDescription: character.background?.definition?.featureDescription || ''
      },
      personality: {
        traits: character.traits || [],
        ideals: character.ideals || [],
        bonds: character.bonds || [],
        flaws: character.flaws || []
      },
      biography: {
        appearance: character.hair || '',
        backstory: character.backstory || '',
        allies: character.allies || ''
      },
      notes: character.notes || ''
    };
  }

  private async createStoryJournalEntry(story: any, characterId: string): Promise<any> {
    const content = `
      <h1>${story.background.name}</h1>
      <h2>Background Feature: ${story.background.feature}</h2>
      <p>${story.background.featureDescription}</p>
      
      <h2>Personality Traits</h2>
      <p>${story.personality.traits.join(', ')}</p>
      
      <h2>Ideals</h2>
      <p>${story.personality.ideals.join(', ')}</p>
      
      <h2>Bonds</h2>
      <p>${story.personality.bonds.join(', ')}</p>
      
      <h2>Flaws</h2>
      <p>${story.personality.flaws.join(', ')}</p>
      
      <h2>Backstory</h2>
      <p>${story.biography.backstory}</p>
    `;

    return {
      name: `Character Story - ${characterId}`,
      content,
      flags: {
        'beyond-foundry': {
          sourceId: `ddb:character:${characterId}`,
          type: 'character-story',
          importedAt: Date.now()
        }
      }
    };
  }

  private async createDownloadFile(data: any, filename: string): Promise<string> {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-export.json`;
    
    return url;
  }

  private async testProxyConnection(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.api.proxyEndpoint}/ping`);
      return { success: response.ok };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    }
  }
}
