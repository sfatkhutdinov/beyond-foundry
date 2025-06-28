import type { DDBCharacter, DDBItem, FoundryItemData } from '../../types/index.js'; // Added FoundryItemData
import { Logger, getErrorMessage } from '../../module/utils/logger.ts';

/**
 * Parser for D&D Beyond items and equipment
 */
export class ItemParser {
  
  /**
   * Parse an array of D&D Beyond items to Foundry format
   */
  static async parseItemArray(ddbItems: DDBItem[]): Promise<FoundryItemData[]> {
    const items: FoundryItemData[] = [];
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
  static async parseCharacterItems(ddbCharacter: DDBCharacter): Promise<FoundryItemData[]> {
    if (!ddbCharacter.inventory) {
      Logger.warn('No inventory found for character');
      return [];
    }
    return this.parseItemArray(ddbCharacter.inventory);
  }

  /**
   * Parse a single D&D Beyond item to Foundry format
   */
  static parseItem(ddbItem: DDBItem): FoundryItemData | null {
    try {
      if (!ddbItem.definition) {
        Logger.warn('Item has no definition, skipping');
        return null;
      }

      const itemType = this.getFoundryItemType(ddbItem);
      const system = this.parseItemSystem(ddbItem, itemType);
      // Add Foundry Activity System stub for weapons and consumables
      if (itemType === 'weapon') {
        system.activities = {
          attack: {
            _id: 'attack',
            type: 'attack',
            name: ddbItem.definition.name,
            sort: 0,
            activation: { type: 'action', value: 1, condition: '' },
            range: this.parseWeaponRange(ddbItem.definition),
            damage: this.parseWeaponDamage(ddbItem.definition),
            attack: {
              ability: 'str', // TODO: infer from weapon/finesse
              bonus: '',
              critical: { threshold: null },
              flat: false,
              type: { value: ddbItem.definition.attackType === 1 ? 'melee' : 'ranged', classification: 'weapon' }
            }
          }
        };
      } else if (itemType === 'consumable') {
        system.activities = {
          use: {
            _id: 'use',
            type: 'utility',
            name: ddbItem.definition.name,
            sort: 0,
            activation: { type: 'action', value: 1, condition: '' },
            uses: { value: ddbItem.quantity || 1, max: ddbItem.quantity || 1 },
            // TODO: Add effect/healing/buff logic here
          }
        };
      }
      const foundryItem: FoundryItemData = {
        name: ddbItem.definition.name,
        type: itemType,
        img: this.getItemImage(ddbItem),
        system,
        effects: [],
        flags: {
          'beyond-foundry': {
            ddbId: ddbItem.id,
            sourceId: ddbItem.definition.id,
            origin: 'D&D Beyond',
            itemType: ddbItem.definition.type,
            container: this.parseContainerInfo(ddbItem)
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
  private static parseToolSystem(ddbItem: DDBItem): Record<string, unknown> {
    // Parse tool proficiency and ability
    let proficient = 0; // 0 = not proficient, 1 = proficient, 2 = expert
    let ability = 'int';
    // Check for tool proficiency fields (future extension)
    if (ddbItem.proficient === true) proficient = 1;
    if (ddbItem.expert === true) proficient = 2;
    if (ddbItem.ability) ability = ddbItem.ability;
    return {
      type: {
        value: 'tool',
        baseItem: ''
      },
      proficient,
      ability
    };
  }

  /**
   * Parse consumable-specific system data
   */
  private static parseConsumableSystem(ddbItem: DDBItem): Record<string, unknown> {
    // Parse uses and add stub for effect parsing
    const uses = {
      value: ddbItem.quantity || 1,
      max: ddbItem.quantity || 1,
      per: null,
      autoDestroy: true
    };
    // TODO: Parse effects (healing, buffs, etc.) from DDB definition
    return {
      type: {
        value: ItemParser.getConsumableType(ddbItem),
        subtype: ''
      },
      uses
      // effects: [] // Future: parse and attach effects
    };
  }

  /**
   * Parse magic item attunement and advanced attunement states (ddb-importer parity)
   * 0 = not attunable, 1 = attunable (not attuned), 2 = attuned
   */
  private static parseAttunement(ddbItem: DDBItem): number {
    const requiresAttunement = ddbItem.definition?.requiresAttunement || false;
    if (requiresAttunement) {
      if (ddbItem.isAttuned) return 2; // Attuned
      return 1; // Attunable, not attuned
    }
    return 0; // Not attunable
  }

  /**
   * TODO: Parse magic item attunement and advanced attunement states
   */
  private static parseAdvancedAttunement(_ddbItem: DDBItem): number { void _ddbItem; return 0; }

  /**
   * Parse container relationships (bags, packs, parent-child)
   * Returns an object with parentId if the item is inside a container
   */
  private static parseContainerInfo(ddbItem: DDBItem): Record<string, unknown> {
    // Implement full container logic: if ddbItem.containerId exists, return { parentId: ddbItem.containerId }
    if ('containerId' in ddbItem && typeof ddbItem.containerId === 'number') {
      return { parentId: ddbItem.containerId };
    }
    return {};
  }

  /**
   * Parse homebrew and custom item flags
   */
  private static parseHomebrewFlags(ddbItem: DDBItem): Record<string, unknown> {
    // DDB items may have isHomebrew or similar flags
    // Use type-safe access (isHomebrew is not always present)
    return { isHomebrew: Boolean(ddbItem.definition && 'isHomebrew' in ddbItem.definition ? (ddbItem.definition as { isHomebrew?: boolean }).isHomebrew : false) };
  }

  /**
   * TODO: Enhanced property parsing (weapon/armor/tool/consumable types, filterType, etc.)
   */
  private static parseEnhancedProperties(_ddbItem: DDBItem): Record<string, unknown> { void _ddbItem; return {}; }

  /**
   * TODO: Add support for weight multipliers, default icons, and additional Foundry flags
   */
  private static parseAdditionalSystemFields(_ddbItem: DDBItem): Record<string, unknown> { void _ddbItem; return {}; }

  // Helper methods for parsing specific data
  private static getItemImage(ddbItem: DDBItem): string {
    return ddbItem.definition?.avatarUrl || 
           ddbItem.definition?.largeAvatarUrl || 
           'icons/svg/item-bag.svg';
  }
  private static getWeaponType(_weaponData: unknown): string { void _weaponData; return 'simpleM'; }
  private static parseWeaponProperties(weaponData: any): Record<string, boolean> {
    // DDB weapon properties are an array of property objects or strings
    // Map to Foundry flags: finesse, heavy, light, loading, reach, thrown, twoHanded, versatile, ammunition, etc.
    const foundryProps: Record<string, boolean> = {};
    if (Array.isArray(weaponData?.properties)) {
      for (const prop of weaponData.properties) {
        const key = typeof prop === 'string' ? prop.toLowerCase() : (prop.name || prop.label || '').toLowerCase();
        switch (key) {
          case 'finesse': foundryProps.finesse = true; break;
          case 'heavy': foundryProps.heavy = true; break;
          case 'light': foundryProps.light = true; break;
          case 'loading': foundryProps.loading = true; break;
          case 'reach': foundryProps.reach = true; break;
          case 'thrown': foundryProps.thrown = true; break;
          case 'two-handed': case 'twohanded': foundryProps.twoHanded = true; break;
          case 'versatile': foundryProps.versatile = true; break;
          case 'ammunition': foundryProps.ammunition = true; break;
          // Add more as needed
        }
      }
    }
    return foundryProps;
  }
  private static parseWeaponDamage(weaponData: any): Record<string, unknown> {
    // Try to extract damage dice and type from weaponData
    // DDB may not provide this directly, so fallback to empty/defaults
    if (weaponData?.damage && typeof weaponData.damage === 'object') {
      // Example: { diceCount: 1, diceValue: 8, damageType: 'slashing' }
      const { diceCount, diceValue, damageType } = weaponData.damage;
      return {
        parts: [[`${diceCount || 1}d${diceValue || 6}`, damageType || 'bludgeoning']],
        versatile: weaponData.versatileDamage ? `${weaponData.versatileDamage}` : '',
      };
    }
    // Fallback: try to infer from baseItem or leave empty
    return { parts: [], versatile: '' };
  }
  private static parseWeaponRange(weaponData: any): Record<string, unknown> {
    // DDB may provide range as { value: 5, long: 20, units: 'ft' }
    if (weaponData?.range && typeof weaponData.range === 'object') {
      const { value, long, units } = weaponData.range;
      return { value: value || 5, long: long || null, units: units || 'ft' };
    }
    // Fallback: melee = 5 ft, ranged = 20/60 ft, etc.
    if (weaponData?.attackType === 1) return { value: 5, long: null, units: 'ft' };
    if (weaponData?.attackType === 2) return { value: 20, long: 60, units: 'ft' };
    return { value: 5, long: null, units: 'ft' };
  }
  private static getEquipmentType(_equipData: unknown): string { void _equipData; return 'clothing'; }
  private static parseArmorData(equipData: any): Record<string, unknown> {
    // Extract AC, armor type, dex cap, and other fields from DDBItem.definition
    // DDB may provide ac, armorType, dexBonus, etc.
    const ac = equipData?.armorClass || 10;
    const type = (equipData?.armorType || '').toLowerCase();
    let foundryType = 'clothing';
    let dex = null;
    switch (type) {
      case 'light':
        foundryType = 'light';
        dex = null; // No cap
        break;
      case 'medium':
        foundryType = 'medium';
        dex = 2;
        break;
      case 'heavy':
        foundryType = 'heavy';
        dex = 0;
        break;
      case 'shield':
        foundryType = 'shield';
        dex = null;
        break;
      default:
        foundryType = 'clothing';
        dex = null;
    }
    return {
      type: foundryType,
      value: ac,
      dex: dex
    };
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
}

// Foundry Item interface
// interface FoundryItem { // Commented out or remove if not used elsewhere
//   name: string;
//   type: string;
//   img: string;
//   system: Record<string, unknown>;
//   effects: unknown[];
//   flags: Record<string, unknown>;
// }

// Ensure FoundryItemData is defined in src/types/index.ts if not already
// For example:
// export interface FoundryItemData {
//   name: string;
//   type: string;
//   img?: string;
//   system: Record<string, unknown>; // Or a more specific system type
//   effects?: unknown[];
//   flags?: Record<string, unknown>;
//   [key: string]: unknown; // If additional properties are expected
// }
