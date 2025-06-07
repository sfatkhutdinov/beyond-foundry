import type { DDBCharacter, DDBFeature } from '../../types/index.js';
import { Logger, getErrorMessage } from '../../module/utils/logger.js';

/**
 * Parser for D&D Beyond character features, feats, and abilities
 */
export class FeatureParser {
  
  /**
   * Parse all character features from D&D Beyond data
   */
  static async parseCharacterFeatures(ddbCharacter: DDBCharacter): Promise<FoundryItem[]> {
    try {
      const features: FoundryItem[] = [];
      
      // Parse class features
      if (ddbCharacter.classFeatures) {
        const classFeatures = await this.parseClassFeatures(ddbCharacter.classFeatures, ddbCharacter);
        features.push(...classFeatures);
      }

      // Parse racial features
      if (ddbCharacter.race?.racialTraits) {
        const raceFeatures = await this.parseRacialFeatures(ddbCharacter.race.racialTraits, ddbCharacter);
        features.push(...raceFeatures);
      }

      // Parse feats
      if (ddbCharacter.feats) {
        const feats = await this.parseFeats(ddbCharacter.feats, ddbCharacter);
        features.push(...feats);
      }

      // Parse background features
      if (ddbCharacter.background?.customBackground?.featuresBackground) {
        const backgroundFeatures = await this.parseBackgroundFeatures(
          ddbCharacter.background.customBackground.featuresBackground, 
          ddbCharacter
        );
        features.push(...backgroundFeatures);
      }

      Logger.info(`Parsed ${features.length} features from character`);
      return features;

    } catch (error) {
      Logger.error(`Character features parsing error: ${getErrorMessage(error)}`);
      return [];
    }
  }

  /**
   * Parse class features
   */
  static async parseClassFeatures(classFeatures: any[], character: DDBCharacter): Promise<FoundryItem[]> {
    const features: FoundryItem[] = [];

    for (const feature of classFeatures) {
      try {
        const foundryFeature = this.parseFeature(feature, 'class', character);
        if (foundryFeature) {
          features.push(foundryFeature);
        }
      } catch (error) {
        Logger.warn(`Failed to parse class feature ${feature.definition?.name}: ${getErrorMessage(error)}`);
      }
    }

    return features;
  }

  /**
   * Parse racial features
   */
  static async parseRacialFeatures(racialTraits: any[], character: DDBCharacter): Promise<FoundryItem[]> {
    const features: FoundryItem[] = [];

    for (const trait of racialTraits) {
      try {
        const foundryFeature = this.parseFeature(trait, 'race', character);
        if (foundryFeature) {
          features.push(foundryFeature);
        }
      } catch (error) {
        Logger.warn(`Failed to parse racial trait ${trait.definition?.name}: ${getErrorMessage(error)}`);
      }
    }

    return features;
  }

  /**
   * Parse feats
   */
  static async parseFeats(feats: any[], character: DDBCharacter): Promise<FoundryItem[]> {
    const features: FoundryItem[] = [];

    for (const feat of feats) {
      try {
        const foundryFeature = this.parseFeature(feat, 'feat', character);
        if (foundryFeature) {
          features.push(foundryFeature);
        }
      } catch (error) {
        Logger.warn(`Failed to parse feat ${feat.definition?.name}: ${getErrorMessage(error)}`);
      }
    }

    return features;
  }

  /**
   * Parse background features
   */
  static async parseBackgroundFeatures(backgroundFeatures: any[], character: DDBCharacter): Promise<FoundryItem[]> {
    const features: FoundryItem[] = [];

    for (const feature of backgroundFeatures) {
      try {
        const foundryFeature = this.parseFeature(feature, 'background', character);
        if (foundryFeature) {
          features.push(foundryFeature);
        }
      } catch (error) {
        Logger.warn(`Failed to parse background feature ${feature.definition?.name}: ${getErrorMessage(error)}`);
      }
    }

    return features;
  }

  /**
   * Parse a single feature to Foundry format
   */
  static parseFeature(ddbFeature: DDBFeature, type: string, character: DDBCharacter): FoundryItem | null {
    try {
      if (!ddbFeature.definition) {
        Logger.warn('Feature has no definition, skipping');
        return null;
      }

      const definition = ddbFeature.definition;
      
      return {
        name: definition.name || 'Unknown Feature',
        type: 'feat',
        img: this.getFeatureIcon(type, definition),
        system: {
          type: {
            value: type,
            subtype: this.getFeatureSubtype(ddbFeature, type)
          },
          description: {
            value: this.parseDescription(definition),
            chat: this.parseChatDescription(definition),
            unidentified: ''
          },
          source: this.parseSource(definition),
          activation: this.parseActivation(definition),
          duration: this.parseDuration(definition),
          target: this.parseTarget(definition),
          range: this.parseRange(definition),
          uses: this.parseUses(definition, ddbFeature),
          consume: this.parseConsume(definition),
          ability: this.parseAbility(definition),
          actionType: this.parseActionType(definition),
          attackBonus: this.parseAttackBonus(definition),
          chatFlavor: definition.snippet || '',
          critical: {
            threshold: null,
            damage: ''
          },
          damage: this.parseDamage(definition),
          formula: this.parseFormula(definition),
          save: this.parseSave(definition),
          requirements: this.parseRequirements(definition, character),
          recharge: this.parseRecharge(definition)
        },
        flags: {
          'beyond-foundry': {
            ddbId: definition.id,
            type: type,
            sourceType: definition.sourceType || null,
            sourceId: definition.sourceId || null,
            entityTypeId: definition.entityTypeId || null,
            levelScale: ddbFeature.levelScale || null,
            classId: ddbFeature.classId || null,
            componentId: ddbFeature.componentId || null,
            componentTypeId: ddbFeature.componentTypeId || null
          }
        },
        effects: this.parseActiveEffects(definition, ddbFeature)
      };

    } catch (error) {
      Logger.error(`Feature parsing error: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Get appropriate icon for feature type
   */
  static getFeatureIcon(type: string, definition: any): string {
    const iconMap: Record<string, string> = {
      'class': 'icons/skills/melee/blade-tips-triple-steel.webp',
      'race': 'icons/environment/people/group.webp',
      'feat': 'icons/skills/trades/academics-study-reading.webp',
      'background': 'icons/skills/social/diplomacy-handshake.webp'
    };

    return iconMap[type] || 'icons/skills/trades/academics-study-reading.webp';
  }

  /**
   * Get feature subtype
   */
  static getFeatureSubtype(ddbFeature: any, type: string): string {
    if (type === 'class') {
      return ddbFeature.classId ? `class-${ddbFeature.classId}` : 'class';
    }
    return type;
  }

  /**
   * Parse feature description
   */
  static parseDescription(definition: any): string {
    let description = definition.description || definition.snippet || '';
    
    // Clean up HTML and formatting
    description = description.replace(/<[^>]*>/g, '');
    description = description.replace(/\n\s*\n/g, '\n');
    
    return description.trim();
  }

  /**
   * Parse chat description
   */
  static parseChatDescription(definition: any): string {
    return definition.snippet || this.parseDescription(definition).slice(0, 200) + '...';
  }

  /**
   * Parse source information
   */
  static parseSource(definition: any): string {
    return definition.sources?.[0]?.sourceBook || 'D&D Beyond';
  }

  /**
   * Parse activation requirements
   */
  static parseActivation(definition: any): any {
    return {
      type: this.getActivationType(definition),
      cost: this.getActivationCost(definition),
      condition: definition.activationCondition || ''
    };
  }

  /**
   * Get activation type
   */
  static getActivationType(definition: any): string {
    if (definition.activation?.activationType) {
      const typeMap: Record<number, string> = {
        1: 'action',
        2: 'bonus',
        3: 'reaction',
        4: 'minute',
        5: 'hour',
        6: 'day'
      };
      return typeMap[definition.activation.activationType] || 'none';
    }
    return 'none';
  }

  /**
   * Get activation cost
   */
  static getActivationCost(definition: any): number {
    return definition.activation?.activationTime || 1;
  }

  /**
   * Parse duration
   */
  static parseDuration(definition: any): any {
    return {
      value: definition.duration?.durationInterval || null,
      units: this.getDurationUnits(definition.duration?.durationType),
      concentration: definition.concentration || false
    };
  }

  /**
   * Get duration units
   */
  static getDurationUnits(durationType: number): string {
    const unitMap: Record<number, string> = {
      1: 'inst',
      2: 'turn',
      3: 'round',
      4: 'minute',
      5: 'hour',
      6: 'day'
    };
    return unitMap[durationType] || 'inst';
  }

  /**
   * Parse target information
   */
  static parseTarget(definition: any): any {
    return {
      value: definition.range?.aoeType || null,
      width: null,
      units: '',
      type: this.getTargetType(definition)
    };
  }

  /**
   * Get target type
   */
  static getTargetType(definition: any): string {
    if (definition.range?.aoeType) {
      const typeMap: Record<number, string> = {
        1: 'self',
        2: 'creature',
        3: 'ally',
        4: 'enemy'
      };
      return typeMap[definition.range.aoeType] || 'self';
    }
    return 'self';
  }

  /**
   * Parse range information
   */
  static parseRange(definition: any): any {
    return {
      value: definition.range?.range || null,
      long: definition.range?.longRange || null,
      units: definition.range?.origin === 1 ? 'self' : 'ft'
    };
  }

  /**
   * Parse uses/resources
   */
  static parseUses(definition: any, ddbFeature: any): any {
    const limitedUse = definition.limitedUse;
    if (!limitedUse) {
      return {
        value: null,
        max: '',
        per: null,
        recovery: ''
      };
    }

    return {
      value: limitedUse.maxUses || null,
      max: limitedUse.maxUses || '',
      per: this.getUsePeriod(limitedUse.resetType),
      recovery: ''
    };
  }

  /**
   * Get use period
   */
  static getUsePeriod(resetType: number): string {
    const periodMap: Record<number, string> = {
      1: 'sr',   // Short rest
      2: 'lr',   // Long rest
      3: 'day',  // Daily
      4: 'charges' // Charges
    };
    return periodMap[resetType] || '';
  }

  /**
   * Parse consume resources
   */
  static parseConsume(definition: any): any {
    return {
      type: '',
      target: '',
      amount: null
    };
  }

  /**
   * Parse ability modifier
   */
  static parseAbility(definition: any): string | null {
    return definition.spellCastingAbilityId ? this.getAbilityFromId(definition.spellCastingAbilityId) : null;
  }

  /**
   * Get ability from ID
   */
  static getAbilityFromId(abilityId: number): string {
    const abilityMap: Record<number, string> = {
      1: 'str',
      2: 'dex', 
      3: 'con',
      4: 'int',
      5: 'wis',
      6: 'cha'
    };
    return abilityMap[abilityId] || 'str';
  }

  /**
   * Parse action type
   */
  static parseActionType(definition: any): string {
    if (definition.attackType) {
      return definition.attackType === 1 ? 'mwak' : 'rwak';
    }
    if (definition.saveType) {
      return 'save';
    }
    return 'other';
  }

  /**
   * Parse attack bonus
   */
  static parseAttackBonus(definition: any): string {
    return definition.attackBonus?.toString() || '';
  }

  /**
   * Parse damage information
   */
  static parseDamage(definition: any): any {
    const parts: string[][] = [];
    
    if (definition.damage) {
      for (const damage of definition.damage) {
        const diceString = this.buildDiceString(damage);
        const damageType = this.getDamageType(damage.damageTypeId);
        if (diceString) {
          parts.push([diceString, damageType]);
        }
      }
    }

    return {
      parts,
      versatile: ''
    };
  }

  /**
   * Build dice string from damage data
   */
  static buildDiceString(damage: any): string {
    let diceString = '';
    
    if (damage.diceCount && damage.diceValue) {
      diceString += `${damage.diceCount}d${damage.diceValue}`;
    }
    
    if (damage.fixedValue) {
      if (diceString) {
        diceString += damage.fixedValue >= 0 ? ` + ${damage.fixedValue}` : ` - ${Math.abs(damage.fixedValue)}`;
      } else {
        diceString = damage.fixedValue.toString();
      }
    }
    
    return diceString;
  }

  /**
   * Get damage type from ID
   */
  static getDamageType(damageTypeId: number): string {
    const damageMap: Record<number, string> = {
      1: 'acid',
      2: 'bludgeoning',
      3: 'cold',
      4: 'fire',
      5: 'force',
      6: 'lightning',
      7: 'necrotic',
      8: 'piercing',
      9: 'poison',
      10: 'psychic',
      11: 'radiant',
      12: 'slashing',
      13: 'thunder'
    };
    return damageMap[damageTypeId] || 'bludgeoning';
  }

  /**
   * Parse formula for other calculations
   */
  static parseFormula(definition: any): string {
    return definition.formula || '';
  }

  /**
   * Parse saving throw information
   */
  static parseSave(definition: any): any {
    if (!definition.saveType) {
      return {
        ability: '',
        dc: null,
        scaling: 'spell'
      };
    }

    return {
      ability: this.getAbilityFromId(definition.saveType),
      dc: definition.saveDc || null,
      scaling: 'spell'
    };
  }

  /**
   * Parse requirements
   */
  static parseRequirements(definition: any, character: DDBCharacter): string {
    const requirements: string[] = [];
    
    if (definition.prerequisite) {
      requirements.push(definition.prerequisite);
    }
    
    return requirements.join(', ');
  }

  /**
   * Parse recharge information
   */
  static parseRecharge(definition: any): any {
    return {
      value: null,
      charged: true
    };
  }

  /**
   * Parse active effects
   */
  static parseActiveEffects(definition: any, ddbFeature: any): any[] {
    const effects: any[] = [];
    
    // TODO: Implement active effects parsing based on feature modifiers
    // This would parse things like ability score improvements, skill bonuses, etc.
    
    return effects;
  }
}

// Type definitions for Foundry items
interface FoundryItem {
  name: string;
  type: string;
  img: string;
  system: any;
  flags: any;
  effects: any[];
}
