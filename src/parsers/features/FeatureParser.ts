import type { DDBCharacter, DDBFeature } from '../../types/index.js';
import { Logger, getErrorMessage } from '../../module/utils/logger.js';
import type { FoundryItem, FoundryItemSystemData } from '../../types/index.js';

export class FeatureParser {
  /**
   * Utility: Convert array of objects with 'definition' to DDBFeature[]
   */
  private static toDDBFeatureArray(arr: Record<string, unknown>[]): DDBFeature[] {
    return (arr || []).map((obj) => {
      if (obj && typeof obj === 'object' && 'definition' in obj && obj.definition && typeof obj.definition === 'object') {
        return {
          ...obj,
          id: (obj.definition as { id?: number }).id,
        } as DDBFeature;
      }
      return undefined;
    }).filter(Boolean) as DDBFeature[];
  }

  /**
   * Parse all character features from D&D Beyond data
   */
  static async parseCharacterFeatures(ddbCharacter: DDBCharacter): Promise<FoundryItem[]> {
    try {
      const features: FoundryItem[] = [];
      // Parse class features
      if (Array.isArray(ddbCharacter.classFeatures) && ddbCharacter.classFeatures.length > 0) {
        const classFeatures = FeatureParser.toDDBFeatureArray(ddbCharacter.classFeatures as Record<string, unknown>[]);
        features.push(...(await this.parseClassFeatures(classFeatures)));
      }
      if (Array.isArray(ddbCharacter.race?.racialTraits) && ddbCharacter.race.racialTraits.length > 0) {
        const raceFeatures = FeatureParser.toDDBFeatureArray(ddbCharacter.race.racialTraits as Record<string, unknown>[]);
        features.push(...(await this.parseRacialFeatures(raceFeatures)));
      }
      if (Array.isArray(ddbCharacter.feats) && ddbCharacter.feats.length > 0) {
        const feats = FeatureParser.toDDBFeatureArray(ddbCharacter.feats as Record<string, unknown>[]);
        features.push(...(await this.parseFeats(feats)));
      }
      if (Array.isArray(ddbCharacter.background?.customBackground?.featuresBackground) && ddbCharacter.background.customBackground.featuresBackground.length > 0) {
        const backgroundFeatures = FeatureParser.toDDBFeatureArray(ddbCharacter.background.customBackground.featuresBackground as Record<string, unknown>[]);
        features.push(...(await this.parseBackgroundFeatures(backgroundFeatures)));
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
  static async parseClassFeatures(classFeatures: DDBFeature[]): Promise<FoundryItem[]> {
    const features: FoundryItem[] = [];

    for (const feature of classFeatures) {
      try {
        const foundryFeature = this.parseFeature(feature, 'class');
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
  static async parseRacialFeatures(racialTraits: DDBFeature[]): Promise<FoundryItem[]> {
    const features: FoundryItem[] = [];

    for (const trait of racialTraits) {
      try {
        const foundryFeature = this.parseFeature(trait, 'race');
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
  static async parseFeats(feats: DDBFeature[]): Promise<FoundryItem[]> {
    const features: FoundryItem[] = [];

    for (const feat of feats) {
      try {
        const foundryFeature = this.parseFeature(feat, 'feat');
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
  static async parseBackgroundFeatures(backgroundFeatures: DDBFeature[]): Promise<FoundryItem[]> {
    const features: FoundryItem[] = [];

    for (const feature of backgroundFeatures) {
      try {
        const foundryFeature = this.parseFeature(feature, 'background');
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
  static parseFeature(ddbFeature: DDBFeature, type: string): FoundryItem | null {
    try {
      if (!ddbFeature.definition) {
        Logger.warn('Feature has no definition, skipping');
        return null;
      }
      const definition = ddbFeature.definition;
      // Ensure a unique id for the FoundryItem (required by FoundryFeature)
      const id = definition.id ? String(definition.id) : `${type}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        id,
        name: definition.name || 'Unknown Feature',
        type,
        img: this.getFeatureIcon(type) || '',
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
          activation: this.parseActivation(definition) ?? { type: '', cost: 0, condition: '' },
          duration: this.parseDuration(definition) ?? { value: null, units: '' },
          target: this.parseTarget(definition) ?? { value: null, width: null, units: '', type: '' },
          range: this.parseRange(definition) ?? { value: null, long: null, units: '' },
          uses: this.parseUses(definition, ddbFeature) ?? { value: null, max: '', per: null, recovery: '' },
          consume: { type: '', target: '', amount: 0 },
          ability: this.parseAbility(definition),
          actionType: this.parseActionType(definition),
          attackBonus: this.parseAttackBonus(definition),
          chatFlavor: definition.snippet || '',
          critical: {
            threshold: null,
            damage: ''
          },
          damage: this.parseDamage(definition) ?? { parts: [], versatile: '' },
          formula: this.parseFormula(definition),
          save: this.parseSave(definition) ?? { ability: '', dc: null, scaling: 'spell' },
          requirements: this.parseRequirements(definition),
          recharge: this.parseRecharge() ?? { value: null, charged: true },
        },
        flags: {
          'beyond-foundry': {
            ddbId: definition.id,
            type,
            sourceType: definition.sourceType || null,
            sourceId: definition.sourceId || null,
            entityTypeId: definition.entityTypeId || null,
            levelScale: ddbFeature.levelScale || null,
            classId: ddbFeature.classId || null,
            componentId: ddbFeature.componentId || null,
            componentTypeId: ddbFeature.componentTypeId || null
          }
        },
        toObject() {
          // Return a plain object representation for FoundryItemData
          return {
            id: this.id,
            name: this.name,
            type: this.type,
            img: this.img || '',
            system: this.system,
            flags: this.flags || {}
          };
        }
      };
    } catch (error) {
      Logger.error(`Feature parsing error: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Get appropriate icon for feature type
   */
  static getFeatureIcon(type: string): string {
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
  static getFeatureSubtype(ddbFeature: DDBFeature, type: string): string {
    if (type === 'class') {
      return ddbFeature.classId ? `class-${ddbFeature.classId}` : 'class';
    }
    return type;
  }

  /**
   * Parse feature description
   */
  static parseDescription(definition: DDBFeature['definition']): string {
    let description = definition.description || definition.snippet || '';
    
    // Clean up HTML and formatting
    description = description.replace(/<[^>]*>/g, '');
    description = description.replace(/\n\s*\n/g, '\n');
    
    return description.trim();
  }

  /**
   * Parse chat description
   */
  static parseChatDescription(definition: DDBFeature['definition']): string {
    return definition.snippet || this.parseDescription(definition).slice(0, 200) + '...';
  }

  /**
   * Parse source information
   */
  static parseSource(definition: DDBFeature['definition']): string {
    return definition.sources?.[0]?.sourceBook || 'D&D Beyond';
  }

  /**
   * Parse activation requirements
   */
  static parseActivation(definition: DDBFeature['definition']): FoundryItemSystemData['activation'] | undefined {
    if (!definition.activation) return undefined;
    return {
      type: this.getActivationType(definition),
      cost: this.getActivationCost(definition),
      condition: (definition as { activationCondition?: string }).activationCondition || ''
    };
  }

  /**
   * Get activation type
   */
  static getActivationType(definition: DDBFeature['definition']): string {
    if (definition.activation?.activationType !== undefined) {
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
  static getActivationCost(definition: DDBFeature['definition']): number {
    return definition.activation?.activationTime ?? 1;
  }

  /**
   * Parse duration
   */
  static parseDuration(definition: DDBFeature['definition']): (FoundryItemSystemData['duration'] & { concentration?: boolean }) | undefined {
    if (!definition.duration) return undefined;
    return {
      value: definition.duration.durationInterval ?? null,
      units: this.getDurationUnits(definition.duration.durationType),
      concentration: definition.concentration || false
    };
  }

  /**
   * Get duration units
   */
  static getDurationUnits(durationType?: number): string {
    if (durationType === undefined) return 'inst';
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
  static parseTarget(definition: DDBFeature['definition']): FoundryItemSystemData['target'] | undefined {
    if (!definition.range) return undefined;
    return {
      value: definition.range.aoeType ?? null,
      width: null,
      units: '',
      type: this.getTargetType(definition)
    };
  }

  /**
   * Get target type
   */
  static getTargetType(definition: DDBFeature['definition']): string {
    if (definition.range?.aoeType !== undefined) {
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
  static parseRange(definition: DDBFeature['definition']): FoundryItemSystemData['range'] | undefined {
    if (!definition.range) return undefined;
    return {
      value: definition.range.range ?? null,
      long: definition.range.longRange ?? null,
      units: definition.range.origin === 1 ? 'self' : 'ft'
    };
  }

  /**
   * Parse uses/resources
   */
  static parseUses(definition: DDBFeature['definition'], _ddbFeature: DDBFeature): FoundryItemSystemData['uses'] | undefined {
    // Remove unused parameter warning
    void _ddbFeature;
    const limitedUse = definition.limitedUse;
    if (!limitedUse) {
      return undefined;
    }
    return {
      value: limitedUse.maxUses ?? null,
      max: limitedUse.maxUses ?? '',
      per: this.getUsePeriod(limitedUse.resetType),
      recovery: ''
    };
  }

  /**
   * Get use period
   */
  static getUsePeriod(resetType?: number): string {
    if (resetType === undefined) return '';
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
  static parseConsume(): FoundryItemSystemData['consume'] {
    return {
      type: '',
      target: '',
      amount: 0
    };
  }

  /**
   * Parse ability modifier
   */
  static parseAbility(definition: DDBFeature['definition']): string | null {
    return definition.spellCastingAbilityId ? this.getAbilityFromId(definition.spellCastingAbilityId) : null;
  }

  /**
   * Get ability from ID
   */
  static getAbilityFromId(abilityId?: number): string {
    if (abilityId === undefined) return 'str';
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
  static parseActionType(definition: DDBFeature['definition']): string {
    if (definition.attackType !== undefined) {
      return definition.attackType === 1 ? 'mwak' : 'rwak';
    }
    if (definition.saveType !== undefined) {
      return 'save';
    }
    return 'other';
  }

  /**
   * Parse attack bonus
   */
  static parseAttackBonus(definition: DDBFeature['definition']): string {
    return definition.attackBonus !== undefined ? String(definition.attackBonus) : '';
  }

  /**
   * Parse damage information
   */
  static parseDamage(definition: DDBFeature['definition']): FoundryItemSystemData['damage'] {
    const parts: [string, string][] = [];
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
  static buildDiceString(damage: { diceCount?: number; diceValue?: number; fixedValue?: number }): string {
    let diceString = '';
    if (damage.diceCount && damage.diceValue) {
      diceString += `${damage.diceCount}d${damage.diceValue}`;
    }
    if (damage.fixedValue !== undefined) {
      if (diceString) {
        diceString += damage.fixedValue >= 0 ? ` + ${damage.fixedValue}` : ` - ${Math.abs(damage.fixedValue)}`;
      } else {
        diceString = String(damage.fixedValue);
      }
    }
    return diceString;
  }

  /**
   * Get damage type from ID
   */
  static getDamageType(damageTypeId?: number): string {
    if (damageTypeId === undefined) return 'bludgeoning';
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
  static parseFormula(definition: DDBFeature['definition']): string {
    return definition.formula || '';
  }

  /**
   * Parse saving throw information
   */
  static parseSave(definition: DDBFeature['definition']): FoundryItemSystemData['save'] {
    if (!definition.saveType) {
      return {
        ability: '',
        dc: null,
        scaling: 'spell'
      };
    }
    return {
      ability: this.getAbilityFromId(definition.saveType),
      dc: definition.saveDc ?? null,
      scaling: 'spell'
    };
  }

  /**
   * Parse requirements
   */
  static parseRequirements(definition: DDBFeature['definition']): string {
    const requirements: string[] = [];
    if (definition.prerequisite) {
      requirements.push(definition.prerequisite);
    }
    return requirements.join(', ');
  }

  /**
   * Parse recharge information
   */
  static parseRecharge(): FoundryItemSystemData['recharge'] {
    // Always return a valid recharge object, never undefined
    return {
      value: null,
      charged: true
    };
  }

  /**
   * Parse active effects
   */
  static parseActiveEffects(): never[] {
    return [];
  }
}
// No local FoundryItem interface, use imported type
