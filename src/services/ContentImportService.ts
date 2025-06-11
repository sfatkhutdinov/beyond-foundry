import type {
  DDBSpell,
  DDBItem,
  DDBMonster,
  FoundrySpell,
  FoundryItemData,
  ImportOptions,
} from '../types/index.js';
import { Logger, getErrorMessage } from '../module/utils/logger.js';

/**
 * Scraping-Based Content Import Service
 * 
 * This service handles content imports (spells, items, monsters) using scraping/parsing
 * for maximum data quality and completeness.
 * 
 * Architecture Philosophy:
 * - Content imports are scraping-based for full data quality
 * - Each content type (spell, item, monster) gets rich, complete data
 * - Completely separate from character imports
 * - Character imports should NOT rely on embedded content data from character API
 * - When users want high-quality content, they import it separately through this service
 * 
 * Examples:
 * - Character has "Fireball" spell from character API (basic info)
 * - User wants full Fireball details -> use this service to scrape/parse complete spell data
 * - This ensures maximum quality for content while keeping character import API-first
 */
export class ContentImportService {
  private proxyEndpoint: string;
  private bearerToken: string | null = null;

  constructor(proxyEndpoint: string) {
    this.proxyEndpoint = proxyEndpoint;
  }

  /**
   * Set the bearer token for authenticated requests
   */
  public setBearerToken(token: string): void {
    this.bearerToken = token;
  }

  /**
   * Import spells using scraping-based approach for maximum data quality
   * This provides the richest, most complete spell data available
   */
  public async importSpells(
    spellIds: number[] | string,
    options: Partial<ImportOptions> = {}
  ): Promise<{ success: boolean; spells: FoundrySpell[]; errors: string[] }> {
    try {
      Logger.info(`🪄 High-Quality Spell Import: ${Array.isArray(spellIds) ? spellIds.length : 'class-based'}`);

      const { SpellParser } = await import('../parsers/spells/SpellParser.js');
      const spells: FoundrySpell[] = [];
      const errors: string[] = [];

      if (Array.isArray(spellIds)) {
        // Import specific spells by ID
        for (const spellId of spellIds) {
          try {
            const ddbSpell = await this.fetchSpellData(spellId);
            if (ddbSpell) {
              const foundrySpell = SpellParser.parseSpell(ddbSpell);
              spells.push(foundrySpell);
            } else {
              errors.push(`Failed to fetch spell ID: ${spellId}`);
            }
          } catch (error) {
            errors.push(`Error importing spell ${spellId}: ${getErrorMessage(error)}`);
          }
        }
      } else {
        // Import spells by class or category
        const classSpells = await this.fetchClassSpells(spellIds, options);
        for (const ddbSpell of classSpells) {
          try {
            const foundrySpell = SpellParser.parseSpell(ddbSpell);
            spells.push(foundrySpell);
          } catch (error) {
            errors.push(`Error parsing spell ${ddbSpell.definition?.name}: ${getErrorMessage(error)}`);
          }
        }
      }

      Logger.info(`✅ High-Quality Spell Import Complete: ${spells.length} spells, ${errors.length} errors`);

      return {
        success: errors.length === 0,
        spells,
        errors,
      };

    } catch (error) {
      Logger.error(`Spell import service error: ${getErrorMessage(error)}`);
      return {
        success: false,
        spells: [],
        errors: [`Spell import service error: ${getErrorMessage(error)}`],
      };
    }
  }

  /**
   * Import items using scraping-based approach for maximum data quality
   * This provides the richest, most complete item data available
   */
  public async importItems(
    itemIds: number[],
    options: Partial<ImportOptions> = {}
  ): Promise<{ success: boolean; items: FoundryItemData[]; errors: string[] }> {
    try {
      Logger.info(`⚔️ High-Quality Item Import: ${itemIds.length} items`);

      const { ItemParser } = await import('../parsers/items/ItemParser.js');
      const items: FoundryItemData[] = [];
      const errors: string[] = [];

      for (const itemId of itemIds) {
        try {
          const ddbItem = await this.fetchItemData(itemId);
          if (ddbItem) {
            const foundryItem = await ItemParser.parseItem(ddbItem);
            if (foundryItem) {
              items.push(foundryItem);
            } else {
              errors.push(`Failed to parse item ID: ${itemId}`);
            }
          } else {
            errors.push(`Failed to fetch item ID: ${itemId}`);
          }
        } catch (error) {
          errors.push(`Error importing item ${itemId}: ${getErrorMessage(error)}`);
        }
      }

      Logger.info(`✅ High-Quality Item Import Complete: ${items.length} items, ${errors.length} errors`);

      return {
        success: errors.length === 0,
        items,
        errors,
      };

    } catch (error) {
      Logger.error(`Item import service error: ${getErrorMessage(error)}`);
      return {
        success: false,
        items: [],
        errors: [`Item import service error: ${getErrorMessage(error)}`],
      };
    }
  }

  /**
   * Import monsters using scraping-based approach for maximum data quality
   * This provides the richest, most complete monster data available
   */
  public async importMonsters(
    monsterIds: number[],
    options: Partial<ImportOptions> = {}
  ): Promise<{ success: boolean; monsters: any[]; errors: string[] }> {
    try {
      Logger.info(`🐉 High-Quality Monster Import: ${monsterIds.length} monsters`);

      const { MonsterParser } = await import('../parsers/MonsterParser.js');
      const monsters: any[] = [];
      const errors: string[] = [];

      for (const monsterId of monsterIds) {
        try {
          const ddbMonster = await this.fetchMonsterData(monsterId);
          if (ddbMonster) {
            const foundryMonster = MonsterParser.parseMonster(ddbMonster);
            monsters.push(foundryMonster);
          } else {
            errors.push(`Failed to fetch monster ID: ${monsterId}`);
          }
        } catch (error) {
          errors.push(`Error importing monster ${monsterId}: ${getErrorMessage(error)}`);
        }
      }

      Logger.info(`✅ High-Quality Monster Import Complete: ${monsters.length} monsters, ${errors.length} errors`);

      return {
        success: errors.length === 0,
        monsters,
        errors,
      };

    } catch (error) {
      Logger.error(`Monster import service error: ${getErrorMessage(error)}`);
      return {
        success: false,
        monsters: [],
        errors: [`Monster import service error: ${getErrorMessage(error)}`],
      };
    }
  }

  /**
   * Bulk import all spells to compendium using high-quality scraping
   */
  public async bulkImportSpellsToCompendium(
    cobaltToken: string,
    compendiumName = 'beyondfoundry.spells'
  ): Promise<number> {
    try {
      Logger.info(`📚 Bulk High-Quality Spell Import to: ${compendiumName}`);

      const response = await fetch(`${this.proxyEndpoint}/proxy/class/spells`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ className: 'Wizard', cobalt: cobaltToken })
      });

      if (!response.ok) throw new Error(`Failed to fetch spells: ${response.status}`);
      
      const data = await response.json();
      if (!data.success || !Array.isArray(data.data)) throw new Error('Invalid spell data response');
      
      const spells: DDBSpell[] = data.data;
      if (!spells.length) throw new Error('No spells returned from proxy');

      const { SpellParser } = await import('../parsers/spells/SpellParser.js');
      
      // Use 'as any' for Foundry dynamic API compatibility
      const packs = (game as any).packs as any;
      let pack = packs.get(compendiumName) as any;
      
      if (!pack) {
        Logger.info(`Compendium ${compendiumName} not found, creating...`);
        await CompendiumCollection.createCompendium({
          label: 'Beyond Foundry Spells (High Quality)',
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
        const ddbId = (doc as any)?.getFlag?.('beyond-foundry', 'ddbId');
        if (typeof ddbId === 'number') index[ddbId] = entry._id;
      }

      let imported = 0;
      for (const ddbSpell of spells) {
        const foundrySpell: FoundrySpell = SpellParser.parseSpell(ddbSpell);
        
        // Mark as high-quality content import
        foundrySpell.flags = {
          ...foundrySpell.flags,
          'beyond-foundry': {
            ...foundrySpell.flags?.['beyond-foundry'],
            ddbId: ddbSpell.definition.id,
            importMethod: 'scraping-based',
            contentQuality: 'high',
            importedAt: Date.now(),
          },
        };
        
        const existingId = index[ddbSpell.definition.id];
        if (existingId) {
          if (typeof pack.updateEntity === 'function') {
            await pack.updateEntity({ _id: existingId, ...foundrySpell });
          } else if (typeof pack.update === 'function') {
            await pack.update({ _id: existingId, ...foundrySpell });
          }
          Logger.debug(`Updated high-quality spell in compendium: ${foundrySpell.name}`);
        } else {
          if (typeof pack.createEntity === 'function') {
            await pack.createEntity(foundrySpell);
          } else if (typeof pack.create === 'function') {
            await pack.create(foundrySpell);
          }
          Logger.debug(`Created high-quality spell in compendium: ${foundrySpell.name}`);
        }
        imported++;
      }

      Logger.info(`✅ Bulk High-Quality Spell Import Complete: ${imported} spells processed.`);
      return imported;

    } catch (error) {
      Logger.error(`Bulk spell import failed: ${getErrorMessage(error)}`);
      return 0;
    }
  }

  /**
   * Fetch spell data using scraping/proxy for maximum quality
   */
  private async fetchSpellData(spellId: number): Promise<DDBSpell | null> {
    try {
      // Implementation would use scraping or proxy endpoints
      // This is a placeholder for the scraping-based approach
      Logger.debug(`Fetching high-quality spell data: ${spellId}`);
      
      // TODO: Implement actual scraping/proxy call for individual spell
      // This would provide the richest possible spell data
      
      return null; // Placeholder
    } catch (error) {
      Logger.error(`Failed to fetch spell ${spellId}: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Fetch item data using scraping/proxy for maximum quality
   */
  private async fetchItemData(itemId: number): Promise<DDBItem | null> {
    try {
      // Implementation would use scraping or proxy endpoints
      Logger.debug(`Fetching high-quality item data: ${itemId}`);
      
      // TODO: Implement actual scraping/proxy call for individual item
      // This would provide the richest possible item data
      
      return null; // Placeholder
    } catch (error) {
      Logger.error(`Failed to fetch item ${itemId}: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Fetch monster data using scraping/proxy for maximum quality
   */
  private async fetchMonsterData(monsterId: number): Promise<DDBMonster | null> {
    try {
      // Implementation would use scraping or proxy endpoints
      Logger.debug(`Fetching high-quality monster data: ${monsterId}`);
      
      // TODO: Implement actual scraping/proxy call for individual monster
      // This would provide the richest possible monster data
      
      return null; // Placeholder
    } catch (error) {
      Logger.error(`Failed to fetch monster ${monsterId}: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Fetch class spells using existing proxy endpoints
   */
  private async fetchClassSpells(className: string, options: Partial<ImportOptions>): Promise<DDBSpell[]> {
    try {
      Logger.debug(`Fetching class spells for: ${className}`);
      
      const response = await fetch(`${this.proxyEndpoint}/proxy/class/spells`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          className, 
          cobalt: this.bearerToken 
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch class spells: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error('Invalid class spell data response');
      }

      return data.data;
    } catch (error) {
      Logger.error(`Failed to fetch class spells for ${className}: ${getErrorMessage(error)}`);
      return [];
    }
  }
}
