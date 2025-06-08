import type { DDBCharacter, DDBItem } from '../../types/index.js';
import { Logger, getErrorMessage } from '../../module/utils/logger.js';

/**
 * Parser for D&D Beyond items and equipment
 */
export class ItemParser {
  
  /**
   * Parse an array of D&D Beyond items to Foundry format
   */
  static async parseItemArray(ddbItems: DDBItem[]): Promise<FoundryItem[]> {
    const items: FoundryItem[] = [];
    for (const ddbItem of ddbItems) {
      try {
        const foundryItem = this.parseItem(ddbItem);
        if (foundryItem) {
          items.push(foundryItem);
        }
      } catch (error) {
        Logger.warn(`Failed to parse item ${ddbItem.definition?.name}: ${getErrorMessage(error)}`);
      }
    }
    Logger.info(`Parsed ${items.length} items from array`);
    return items;
  }

  /**
   * @deprecated Use parseItemArray instead. This method will be removed in a future release.
   */
  static async parseCharacterItems(ddbCharacter: DDBCharacter): Promise<FoundryItem[]> {
    if (!ddbCharacter.inventory) {
      Logger.warn('No inventory found for character');
      return [];
    }
    return this.parseItemArray(ddbCharacter.inventory);
  }

  /**
   * Parse a single D&D Beyond item to Foundry format
   */
  static parseItem(ddbItem: DDBItem): FoundryItem | null {
    try {
      if (!ddbItem.definition) {
        Logger.warn('Item has no definition, skipping');
        return null;
      }

      const itemType = this.getFoundryItemType(ddbItem);
      const foundryItem: FoundryItem = {
        name: ddbItem.definition.name,
        type: itemType,
        img: this.getItemImage(ddbItem),
        system: this.parseItemSystem(ddbItem, itemType),
        effects: [],
        flags: {
          'beyond-foundry': {
            ddbId: ddbItem.id,
            sourceId: ddbItem.definition.id,
            origin: 'D&D Beyond',
            itemType: ddbItem.definition.type
          }
        }
      };

      return foundryItem;

    } catch (error) {
      Logger.error(`Item parsing error: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Determine Foundry item type from D&D Beyond item
   */
  private static getFoundryItemType(ddbItem: DDBItem): string {
    const ddbType = ddbItem.definition?.type?.toLowerCase();
    
    switch (ddbType) {
      case 'weapon':
        return 'weapon';
      case 'armor':
        return 'equipment';
      case 'shield':
        return 'equipment';
      case 'ammunition':
        return 'consumable';
      case 'potion':
      case 'scroll':
        return 'consumable';
      case 'wondrous item':
      case 'ring':
      case 'rod':
      case 'staff':
      case 'wand':
        return 'equipment';
      case 'adventuring gear':
        return 'loot';
      case 'tool':
        return 'tool';
      case 'mount':
      case 'vehicle':
        return 'loot';
      default:
        return 'loot';
    }
  }

  /**
   * Parse item system data based on type
   */
  private static parseItemSystem(ddbItem: DDBItem, itemType: string): Record<string, unknown> {
    const baseSystem = {
      description: {
        value: ddbItem.definition?.description || '',
        chat: '',
        unidentified: ''
      },
      source: ddbItem.definition?.sourceBook || '',
      quantity: ddbItem.quantity || 1,
      weight: ddbItem.definition?.weight || 0,
      price: {
        value: (ddbItem.definition?.cost?.quantity || 0) / 100, // DDB stores in copper
        denomination: 'gp'
      },
      attunement: this.parseAttunement(ddbItem),
      equipped: ddbItem.equipped || false,
      rarity: this.parseRarity(ddbItem),
      identified: true
    };

    switch (itemType) {
      case 'weapon':
        return { ...baseSystem, ...this.parseWeaponSystem(ddbItem) };
      case 'equipment':
        return { ...baseSystem, ...this.parseEquipmentSystem(ddbItem) };
      case 'tool':
        return { ...baseSystem, ...this.parseToolSystem(ddbItem) };
      case 'consumable':
        return { ...baseSystem, ...this.parseConsumableSystem(ddbItem) };
      default:
        return baseSystem;
    }
  }

  /**
   * Parse weapon-specific system data
   */
  private static parseWeaponSystem(ddbItem: DDBItem): Record<string, unknown> {
    const weaponData = ddbItem.definition;
    return {
      type: {
        value: ItemParser.getWeaponType(weaponData),
        baseItem: weaponData?.baseItem || ''
      },
      properties: ItemParser.parseWeaponProperties(weaponData),
      proficient: true, // Assume proficient for now
      damage: ItemParser.parseWeaponDamage(weaponData),
      range: ItemParser.parseWeaponRange(weaponData),
      actionType: weaponData?.attackType === 1 ? 'mwak' : 'rwak'
    };
  }

  /**
   * Parse equipment-specific system data
   */
  private static parseEquipmentSystem(ddbItem: DDBItem): Record<string, unknown> {
    const equipData = ddbItem.definition;
    return {
      type: {
        value: ItemParser.getEquipmentType(equipData),
        baseItem: equipData?.baseItem || ''
      },
      armor: ItemParser.parseArmorData(equipData),
      proficient: true
    };
  }

  /**
   * Parse tool-specific system data
   */
  private static parseToolSystem(_ddbItem: DDBItem): Record<string, unknown> {
    return {
      type: {
        value: 'tool',
        baseItem: ''
      },
      proficient: 0, // 0 = not proficient, 1 = proficient, 2 = expert
      ability: 'int' // Default ability
    };
  }

  /**
   * Parse consumable-specific system data
   */
  private static parseConsumableSystem(ddbItem: DDBItem): Record<string, unknown> {
    return {
      type: {
        value: ItemParser.getConsumableType(ddbItem),
        subtype: ''
      },
      uses: {
        value: ddbItem.quantity || 1,
        max: ddbItem.quantity || 1,
        per: null,
        autoDestroy: true
      }
    };
  }

  /**
   * TODO: Parse magic item attunement and advanced attunement states
   */
  private static parseAdvancedAttunement(_ddbItem: DDBItem): number {
    // TODO: Implement advanced attunement logic (ddb-importer parity)
    return 0;
  }

  /**
   * TODO: Parse container relationships (e.g., bags, packs, parent-child)
   */
  private static parseContainerInfo(_ddbItem: DDBItem): Record<string, unknown> {
    // TODO: Implement container relationship parsing
    return {};
  }

  /**
   * TODO: Parse homebrew and custom item flags
   */
  private static parseHomebrewFlags(_ddbItem: DDBItem): Record<string, unknown> {
    // TODO: Implement homebrew/custom item detection and flagging
    return {};
  }

  /**
   * TODO: Enhanced property parsing (weapon/armor/tool/consumable types, filterType, etc.)
   */
  private static parseEnhancedProperties(_ddbItem: DDBItem): Record<string, unknown> {
    // TODO: Implement enhanced property parsing for ddb-importer parity
    return {};
  }

  /**
   * TODO: Add support for weight multipliers, default icons, and additional Foundry flags
   */
  private static parseAdditionalSystemFields(_ddbItem: DDBItem): Record<string, unknown> {
    // TODO: Implement additional system fields (weightMultiplier, defaultIcon, etc.)
    return {};
  }

  // Helper methods for parsing specific data
  private static getItemImage(ddbItem: DDBItem): string {
    return ddbItem.definition?.avatarUrl || 
           ddbItem.definition?.largeAvatarUrl || 
           'icons/svg/item-bag.svg';
  }
  private static getWeaponType(_weaponData: unknown): string {
    return 'simpleM';
  }
  private static parseWeaponProperties(_weaponData: unknown): Record<string, boolean> {
    return {};
  }
  private static parseWeaponDamage(_weaponData: unknown): Record<string, unknown> {
    return {
      parts: [],
      versatile: ''
    };
  }
  private static parseWeaponRange(_weaponData: unknown): Record<string, unknown> {
    return {
      value: 5,
      long: null,
      units: 'ft'
    };
  }
  private static getEquipmentType(_equipData: unknown): string {
    return 'clothing';
  }
  private static parseArmorData(_equipData: unknown): Record<string, unknown> {
    return {
      type: 'clothing',
      value: 10,
      dex: null
    };
  }
  private static parseAttunement(ddbItem: DDBItem): number {
    if (ddbItem.definition?.requiresAttunement) {
      return ddbItem.isAttuned ? 2 : 1;
    }
    return 0;
  }
  private static parseRarity(ddbItem: DDBItem): string {
    const rarity = ddbItem.definition?.rarity?.toLowerCase();
    switch (rarity) {
      case 'common': return 'common';
      case 'uncommon': return 'uncommon';
      case 'rare': return 'rare';
      case 'very rare': return 'veryRare';
      case 'legendary': return 'legendary';
      case 'artifact': return 'artifact';
      default: return 'common';
    }
  }
  private static getConsumableType(ddbItem: DDBItem): string {
    const type = ddbItem.definition?.type?.toLowerCase();
    switch (type) {
      case 'potion': return 'potion';
      case 'scroll': return 'scroll';
      case 'ammunition': return 'ammo';
      default: return 'trinket';
    }
  }
}

// Foundry Item interface
interface FoundryItem {
  name: string;
  type: string;
  img: string;
  system: Record<string, unknown>;
  effects: unknown[];
  flags: Record<string, unknown>;
}
