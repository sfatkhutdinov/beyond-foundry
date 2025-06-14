import { Logger } from '../../module/utils/logger.js';
import type { DDBSpell, FoundrySpell, SpellParsingOptions } from '../../types/index.js';

/**
 * Comprehensive Spell Parser for D&D Beyond to FoundryVTT D&D 5e system
 *
 * This parser handles:
 * - Complete spell data structure conversion
 * - Spell school mapping and validation
 * - Component parsing (verbal, somatic, material, focus)
 * - Duration, range, and area of effect calculations
 * - Scaling formulas and higher level effects
 * - Ritual and concentration mechanics
 * - Class spell list associations
 * - Custom spell descriptions and effects
 */
export class SpellParser {
  /**
   * Parse a D&D Beyond spell into FoundryVTT spell data
   * @param ddbSpell - The D&D Beyond spell data
   * @param options - Parsing options for customization
   * @returns Foundry spell item data
   */
  public static parseSpell(ddbSpell: DDBSpell, options: SpellParsingOptions = {}): FoundrySpell {
    const definition = ddbSpell.definition;

    if (!definition) {
      Logger.warn(`Spell missing definition: ${ddbSpell.id}`);
      return this.createEmptySpell();
    }

    Logger.debug(`📜 Parsing spell: ${definition.name} (Level ${definition.level})`);

    // 1. Extract restriction logic
    let restriction: string | null = null;
    if (typeof ddbSpell.restriction === 'string') {
      restriction = ddbSpell.restriction;
    } else if (ddbSpell.restriction != null) {
      restriction = String(ddbSpell.restriction);
    }

    const foundrySpell: FoundrySpell = {
      name: definition.name,
      type: 'spell',
      img: this.getSpellIcon(definition),
      system: {
        description: {
          value: this.parseDescription(definition),
          chat: this.parseChatDescription(definition),
          unidentified: '',
        },
        source: this.parseSource(definition),
        activation: this.parseActivation(definition),
        duration: this.parseDuration(definition),
        target: this.parseTarget(definition),
        range: this.parseRange(definition),
        uses: this.parseUses(ddbSpell),
        consume: this.parseConsume(definition),
        ability: this.parseAbility(ddbSpell),
        actionType: this.parseActionType(definition),
        attackBonus: this.parseAttackBonus(definition),
        chatFlavor: '',
        critical: this.parseCritical(definition),
        damage: this.parseDamage(definition),
        formula: this.parseFormula(definition),
        save: this.parseSave(definition),
        level: definition.level,
        school: this.parseSchool(definition.school),
        components: this.parseComponents(definition),
        materials: this.parseMaterials(definition),
        preparation: this.parsePreparation(ddbSpell, options),
        scaling: this.parseScaling(definition),
        properties: this.parseProperties(definition),
      },
      effects: this.parseActiveEffects(definition),
      flags: {
        'beyond-foundry': {
          ddbId: definition.id,
          sourceId: ddbSpell.id,
          ...(typeof ddbSpell.spellListId === 'number' ? { spellListId: ddbSpell.spellListId } : {}),
          prepared: !!ddbSpell.prepared,
          alwaysPrepared: typeof ddbSpell.alwaysPrepared === 'boolean' ? ddbSpell.alwaysPrepared : false,
          usesSpellSlot: ddbSpell.usesSpellSlot !== false,
          castAtLevel: typeof ddbSpell.castAtLevel === 'number' ? ddbSpell.castAtLevel : null,
          restriction,
        },
      },
    };

    return foundrySpell;
  }

  /**
   * Parse spell description with enhanced formatting
   */
  private static parseDescription(definition: DDBSpellDefinitionExtended): string {
    let description = definition.description ?? '';

    // Add spell tags for better organization
    const tags = [];
    if (definition.ritual) tags.push('Ritual');
    if (definition.concentration) tags.push('Concentration');
    if (definition.components?.material) tags.push('Material Component');
    if (definition.componentsDescription) tags.push('Focus');

    if (tags.length > 0) {
      description = `<p><strong>Tags:</strong> ${tags.join(', ')}</p>${description}`;
    }

    // Add higher level information if available
    if (definition.higherLevelDescription) {
      description += `<h3>At Higher Levels</h3><p>${definition.higherLevelDescription}</p>`;
    }

    return description;
  }

  /**
   * Parse chat description for spell card display
   */
  private static parseChatDescription(definition: DDBSpellDefinitionExtended): string {
    // Create a shorter version for chat display
    const desc = definition.description ?? '';
    const sentences = desc.split('.').slice(0, 2); // First two sentences
    return sentences.join('.') + (sentences.length < desc.split('.').length ? '...' : '');
  }

  /**
   * Parse spell source information
   */
  private static parseSource(definition: DDBSpellDefinitionExtended): string {
    if (definition.sources && definition.sources.length > 0) {
      const source = definition.sources[0];
      return `${source.sourceType === 1 ? 'PHB' : 'Supplement'} ${source.pageNumber ?? ''}`.trim();
    }
    return '';
  }

  /**
   * Parse spell activation details
   */
  private static parseActivation(definition: DDBSpellDefinitionExtended): { type: string; cost: number; condition: string } {
    const activation = definition.activation ?? {};

    const typeMap: Record<number, string> = {
      1: 'action', // Action
      2: 'bonus', // Bonus Action
      3: 'reaction', // Reaction
      4: 'minute', // Minute
      5: 'hour', // Hour
      6: 'minute', // Special (often represents longer casting times)
      7: 'day', // Day
    };

    return {
      type: typeMap[activation.activationType] || 'action',
      cost: activation.activationTime ?? 1,
      condition: activation.activationCondition ?? '',
    };
  }

  /**
   * Parse spell duration
   */
  private static parseDuration(definition: DDBSpellDefinitionExtended): { value: number | null; units: string } {
    const duration = (definition.duration && typeof definition.duration === 'object') ? definition.duration : {};
    const durationUnit = ('durationType' in duration && typeof (duration as { durationType?: unknown }).durationType === 'string')
      ? (duration as { durationType: string }).durationType
      : 'Instantaneous';
    const durationInterval = ('durationInterval' in duration && typeof (duration as { durationInterval?: unknown }).durationInterval === 'number')
      ? (duration as { durationInterval: number }).durationInterval
      : null;
    const unitMap: Record<string, string> = {
      Instantaneous: 'inst',
      Round: 'round',
      Minute: 'minute',
      Hour: 'hour',
      Day: 'day',
      Week: 'week',
      Month: 'month',
      Year: 'year',
      Permanent: 'perm',
      Special: 'spec',
      Time: 'minute',
      Concentration: 'minute',
      'Until Dispelled': 'perm',
      'Until Dispelled or Triggered': 'perm',
    };
    const mappedUnit = typeof durationUnit === 'string' && unitMap[durationUnit] ? unitMap[durationUnit] : 'inst';
    return {
      value: durationInterval,
      units: mappedUnit,
    };
  }

  /**
   * Parse spell target information
   */
  private static parseTarget(definition: DDBSpellDefinitionExtended): { value: number | null; width: null; units: string; type: string } {
    const range = (definition.range && typeof definition.range === 'object') ? definition.range : {};
    const typeMap: Record<string, string> = {
      Self: 'self',
      Touch: 'touch',
      Ranged: 'creature',
      Point: 'space',
      Line: 'line',
      Cone: 'cone',
      Cube: 'cube',
      Cylinder: 'cylinder',
      Sphere: 'sphere',
      Square: 'square',
    };
    const aoeValue = ('aoeValue' in range && typeof (range as { aoeValue?: unknown }).aoeValue === 'number')
      ? (range as { aoeValue: number }).aoeValue
      : null;
    const aoeType = ('aoeType' in range && typeof (range as { aoeType?: unknown }).aoeType === 'string')
      ? (range as { aoeType: string }).aoeType
      : undefined;
    const origin = ('origin' in range && typeof (range as { origin?: unknown }).origin === 'string')
      ? (range as { origin: string }).origin
      : undefined;
    const typeKey = aoeType ?? origin ?? '';
    return {
      value: aoeValue,
      width: null,
      units: 'ft',
      type: typeof typeKey === 'string' && typeMap[typeKey] ? typeMap[typeKey] : 'creature',
    };
  }

  /**
   * Parse spell range
   */
  private static parseRange(definition: DDBSpellDefinitionExtended): { value: number | null; long: null; units: string } {
    const range = (definition.range && typeof definition.range === 'object') ? definition.range : {};
    const unitMap: Record<string, string> = {
      Self: 'self',
      Touch: 'touch',
      Ranged: 'ft',
      Sight: 'spec',
      Unlimited: 'any',
    };
    const rangeValue = ('rangeValue' in range && typeof (range as { rangeValue?: unknown }).rangeValue === 'number')
      ? (range as { rangeValue: number }).rangeValue
      : null;
    const origin = ('origin' in range && typeof (range as { origin?: unknown }).origin === 'string')
      ? (range as { origin: string }).origin
      : '';
    return {
      value: rangeValue,
      long: null,
      units: unitMap[origin] || 'ft',
    };
  }

  /**
   * Parse spell uses and limitations
   */
  private static parseUses(ddbSpell: DDBSpell): { value: number | null; max: string; per: string | null; recovery: string } {
    const limitedUse = ddbSpell.limitedUse;

    if (!limitedUse || typeof limitedUse !== 'object') {
      return {
        value: null,
        max: '',
        per: null,
        recovery: '',
      };
    }

    const recoveryMap: Record<number, string> = {
      1: 'sr', // Short rest
      2: 'lr', // Long rest
      3: 'day', // Per day
      4: 'charges', // Charges
    };

    const maxUses = ('maxUses' in limitedUse && typeof (limitedUse as { maxUses?: unknown }).maxUses === 'number')
      ? (limitedUse as { maxUses: number }).maxUses
      : null;
    const resetType = ('resetType' in limitedUse && typeof (limitedUse as { resetType?: unknown }).resetType === 'number')
      ? (limitedUse as { resetType: number }).resetType
      : undefined;

    return {
      value: maxUses,
      max: maxUses !== null ? maxUses.toString() : '',
      per: resetType !== undefined && recoveryMap[resetType] ? recoveryMap[resetType] : null,
      recovery: '',
    };
  }

  /**
   * Parse spell properties/flags
   */
  private static parseProperties(definition: DDBSpellDefinitionExtended): string[] {
    const properties: string[] = [];

    if (definition.ritual) properties.push('ritual');
    if (definition.concentration) properties.push('concentration');
    if (definition.components?.verbal) properties.push('vocal');
    if (definition.components?.somatic) properties.push('somatic');
    if (definition.components?.material) properties.push('material');

    return properties;
  }

  /**
   * Parse spell resource consumption
   */
  private static parseConsume(_definition: DDBSpellDefinitionExtended): { type: string; target: string; amount: number; scale: boolean } {
    // Provide default values for Foundry schema
    return { type: '', target: '', amount: 0, scale: false };
  }

  /**
   * Parse spellcasting ability
   */
  private static parseAbility(ddbSpell: DDBSpell): string | null {
    const abilityId = typeof ddbSpell.spellCastingAbilityId === 'number' ? ddbSpell.spellCastingAbilityId : null;
    return abilityId !== null ? this.mapAbilityId(abilityId) : null;
  }

  /**
   * Parse spell action type
   */
  private static parseActionType(definition: DDBSpellDefinitionExtended): string {
    if (definition.attackType === 1) return 'mwak'; // Melee weapon attack
    if (definition.attackType === 2) return 'rwak'; // Ranged weapon attack
    if (definition.attackType === 3) return 'msak'; // Melee spell attack
    if (definition.attackType === 4) return 'rsak'; // Ranged spell attack
    if (definition.saveType) return 'save'; // Saving throw
    if (definition.healingTypes && definition.healingTypes.length > 0) return 'heal';
    return 'other';
  }

  /**
   * Parse attack bonus for spell attacks
   */
  private static parseAttackBonus(_definition: DDBSpellDefinitionExtended): string {
    // Attack bonus is typically calculated from spellcasting ability + proficiency
    // Return empty string to use character's calculated bonus
    return '';
  }

  /**
   * Parse critical hit information
   */
  private static parseCritical(_definition: DDBSpellDefinitionExtended): { threshold: number; damage: string } {
    return { threshold: 20, damage: '' };
  }

  /**
   * Parse spell damage
   */
  private static parseDamage(definition: DDBSpellDefinitionExtended): { parts: [string, string][]; versatile: string; value: string } {
    const parts: [string, string][] = [];

    if (Array.isArray(definition.damageTypes) && definition.damageTypes.length > 0) {
      definition.damageTypes.forEach((damageType: string, index: number) => {
        if (definition.dice?.[index]) {
          const dice = definition.dice[index];
          const diceCount = dice.diceCount ?? 1;
          const diceValue = dice.diceValue ?? 6;
          const fixedValue = dice.fixedValue ? ` + ${dice.fixedValue}` : '';
          const formula = `${diceCount}d${diceValue}${fixedValue}`;
          parts.push([formula, damageType.toLowerCase()]);
        }
      });
    }

    return {
      parts,
      versatile: '',
      value: '',
    };
  }

  /**
   * Parse additional formula (like healing)
   */
  private static parseFormula(definition: DDBSpellDefinitionExtended): string {
    if (definition.healingTypes && definition.healingTypes.length > 0 && definition.dice) {
      const dice = definition.dice[0];
      if (dice) {
        const diceCount = dice.diceCount ?? 1;
        const diceValue = dice.diceValue ?? 6;
        const fixedValue = dice.fixedValue ? ` + ${dice.fixedValue}` : '';
        const formula = `${diceCount}d${diceValue}${fixedValue}`;
        return formula;
      }
    }
    return '';
  }

  /**
   * Parse saving throw information
   */
  private static parseSave(_definition: DDBSpellDefinitionExtended): { ability: string; dc: number; scaling: string } {
    return { ability: '', dc: 0, scaling: '' };
  }

  /**
   * Parse spell school
   */
  private static parseSchool(school: string): string {
    const schoolMap: Record<string, string> = {
      Abjuration: 'abj',
      Conjuration: 'con',
      Divination: 'div',
      Enchantment: 'enc',
      Evocation: 'evo',
      Illusion: 'ill',
      Necromancy: 'nec',
      Transmutation: 'trs',
    };

    // Handle both capitalized and lowercase school names
    const normalizedSchool = school
      ? school.charAt(0).toUpperCase() + school.slice(1).toLowerCase()
      : '';
    return schoolMap[normalizedSchool] || 'evo';
  }

  /**
   * Parse spell components
   */
  private static parseComponents(definition: DDBSpellDefinitionExtended): { vocal: boolean; somatic: boolean; material: boolean; ritual: boolean; concentration: boolean } {
    const components = definition.components ?? { verbal: false, somatic: false, material: false };
    let hasVerbal = false, hasSomatic = false, hasMaterial = false;
    if (Array.isArray(components)) {
      hasVerbal = components.includes(1);
      hasSomatic = components.includes(2);
      hasMaterial = components.includes(3);
    } else {
      hasVerbal = 'verbal' in components ? !!components.verbal : false;
      hasSomatic = 'somatic' in components ? !!components.somatic : false;
      hasMaterial = 'material' in components ? !!components.material : false;
    }
    return {
      vocal: hasVerbal,
      somatic: hasSomatic,
      material: hasMaterial,
      ritual: definition.ritual ?? false,
      concentration: definition.concentration ?? false,
    };
  }

  /**
   * Parse material components
   */
  private static parseMaterials(definition: DDBSpellDefinitionExtended): { value: string; consumed: boolean; cost: number; supply: number } {
    return { value: definition.componentsDescription ?? '', consumed: false, cost: 0, supply: 0 };
  }

  /**
   * Parse spell preparation mode and status
   */
  private static parsePreparation(ddbSpell: DDBSpell, options: SpellParsingOptions): { mode: string; prepared: boolean } {
    const mode = options.preparationMode || 'prepared';

    return {
      mode,
      prepared: ddbSpell.prepared ?? false,
    };
  }

  /**
   * Parse spell scaling (higher level effects)
   */
  private static parseScaling(_definition: DDBSpellDefinitionExtended): { mode: string; formula: string } {
    return { mode: 'none', formula: '' };
  }

  /**
   * Create empty spell for error cases
   */
  private static createEmptySpell(): FoundrySpell {
    // Always return a fully constructed system property matching FoundrySpell schema
    return {
      name: 'Unknown Spell',
      type: 'spell',
      img: 'icons/svg/mystery-man.svg',
      system: {
        description: { value: '', chat: '', unidentified: '' },
        source: '',
        activation: { type: 'action', cost: 1, condition: '' },
        duration: { value: null, units: 'inst' },
        target: { value: null, width: null, units: 'ft', type: 'creature' },
        range: { value: null, long: null, units: 'ft' },
        uses: { value: null, max: '', per: null, recovery: '' },
        consume: { type: '', target: '', amount: 0, scale: false },
        ability: null,
        actionType: 'other',
        attackBonus: '',
        chatFlavor: '',
        critical: { threshold: 20, damage: '' },
        damage: { parts: [], versatile: '', value: '' },
        formula: '',
        save: { ability: '', dc: 0, scaling: '' },
        level: 0,
        school: 'evo',
        components: { vocal: false, somatic: false, material: false, ritual: false, concentration: false },
        materials: { value: '', consumed: false, cost: 0, supply: 0 },
        preparation: { mode: 'prepared', prepared: false },
        scaling: { mode: 'none', formula: '' },
        properties: [],
      },
      effects: [],
      flags: {},
    };
  }

  /**
   * Map DDB ability ID to Foundry ability key
   */
  private static mapAbilityId(abilityId: number): string {
    const abilityMap: Record<number, string> = {
      1: 'str',
      2: 'dex',
      3: 'con',
      4: 'int',
      5: 'wis',
      6: 'cha',
    };

    return abilityMap[abilityId] || 'int';
  }

  /**
   * Extract cost from material component description
   */
  private static extractCost(materials: string): number {
    const costMatch = /\(\d+\)\s*gp/i.exec(materials);
    return costMatch?.[1] ? parseInt(costMatch[1]) : 0;
  }

  /**
   * Extract scaling formula from higher level description
   */
  private static extractScalingFormula(description: string): string {
    // Look for patterns like "increases by 1d6" or "an additional 1d8"
    const patterns = [
      /increases by (\d+d\d+)/i,
      /additional (\d+d\d+)/i,
      /extra (\d+d\d+)/i,
      /(\d+d\d+) additional/i,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(description);
      if (match?.[1]) {
        return match[1];
      }
    }

    return '';
  }

  /**
   * Parse multiple spells from character spell list
   */
  public static parseCharacterSpells(
    ddbCharacter: { spells: Record<string, DDBSpell[]> },
    options: SpellParsingOptions = {}
  ): FoundrySpell[] {
    const spells: FoundrySpell[] = [];

    if (!ddbCharacter.spells) {
      return spells;
    }

    // Process all spell categories
    Object.values(ddbCharacter.spells).forEach((spellArray: DDBSpell[]) => {
      spellArray.forEach((ddbSpell: DDBSpell) => {
        try {
          const foundrySpell = this.parseSpell(ddbSpell, options);
          spells.push(foundrySpell);
        } catch (error) {
          Logger.error(
            `Failed to parse spell ${ddbSpell.definition?.name ?? 'Unknown'}: ${error}`
          );
        }
      });
    });

    Logger.info(`📚 Parsed ${spells.length} spells`);
    return spells;
  }

  /**
   * Get appropriate icon for spell
   */
  private static getSpellIcon(definition: DDBSpellDefinitionExtended): string {
    const schoolIcons: Record<string, string> = {
      Abjuration: 'icons/magic/defensive/shield-barrier-blue.webp',
      Conjuration: 'icons/magic/symbols/elements-air-earth-fire-water.webp',
      Divination: 'icons/magic/perception/eye-ringed-glow-yellow.webp',
      Enchantment: 'icons/magic/control/hypnosis-mesmerism-swirl.webp',
      Evocation: 'icons/magic/lightning/bolt-strike-blue.webp',
      Illusion: 'icons/magic/perception/silhouette-stealth-shadow.webp',
      Necromancy: 'icons/magic/death/skull-horned-goat-pentagram-red.webp',
      Transmutation: 'icons/magic/symbols/question-stone-yellow.webp',
    };
    return schoolIcons[definition.school] || 'icons/magic/symbols/rune-sigil-black-pink.webp';
  }

  /**
   * Parse active effects (for automation)
   */
  private static parseActiveEffects(_definition: DDBSpellDefinitionExtended): unknown[] {
    // This would be expanded for spell automation
    // For now, return empty array
    return [];
  }
}

/**
 * Refine DDBSpellDefinitionExtended to match required/optional properties
 */
// Fix DDBSpellDefinitionExtended sources property to only allow string for sourceType
interface DDBSpellDefinitionExtended extends Omit<DDBSpellDefinition, 'ritual' | 'concentration' | 'sources'> {
  ritual?: boolean;
  concentration?: boolean;
  componentsDescription?: string;
  activation?: {
    activationType?: number;
    activationTime?: number;
    activationCondition?: string;
  };
  durationType?: string;
  durationInterval?: number;
  aoeValue?: number;
  aoeType?: string;
  origin?: string;
  rangeValue?: number;
  dice?: Array<{
    diceCount?: number;
    diceValue?: number;
    fixedValue?: number;
  }>;
  damageTypes?: string[];
  healingTypes?: string[];
  fixedValue?: number;
  attackType?: number;
  saveType?: string;
  saveDc?: number;
  spellCastingAbilityId?: number;
  materialComponent?: string;
  sources?: Array<{
    sourceId: number;
    pageNumber?: number;
    sourceType?: string;
  }>;
}

// Move this to the top of the file, before interface extension
type DDBSpellDefinition = import('../../types/index.js').DDBSpell['definition'];
