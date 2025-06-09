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
          restriction: typeof ddbSpell.restriction === 'string' ? ddbSpell.restriction : (ddbSpell.restriction == null ? null : String(ddbSpell.restriction)),
        },
      },
    };

    return foundrySpell;
  }

  /**
   * Parse spell description with enhanced formatting
   */
  private static parseDescription(definition: any): string {
    let description = definition.description || '';

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
  private static parseChatDescription(definition: any): string {
    // Create a shorter version for chat display
    const desc = definition.description || '';
    const sentences = desc.split('.').slice(0, 2); // First two sentences
    return sentences.join('.') + (sentences.length < desc.split('.').length ? '...' : '');
  }

  /**
   * Parse spell source information
   */
  private static parseSource(definition: any): string {
    if (definition.sources && definition.sources.length > 0) {
      const source = definition.sources[0];
      return `${source.sourceType === 1 ? 'PHB' : 'Supplement'} ${source.pageNumber || ''}`.trim();
    }
    return '';
  }

  /**
   * Parse spell activation details
   */
  private static parseActivation(definition: any): any {
    const activation = definition.activation || {};

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
      cost: activation.activationTime || 1,
      condition: activation.activationCondition || '',
    };
  }

  /**
   * Parse spell duration
   */
  private static parseDuration(definition: any): any {
    const duration = definition.duration || {};

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
      Time: 'minute', // D&D Beyond uses "Time" for various durations
      Concentration: 'minute', // Concentration spells usually have minute duration
      'Until Dispelled': 'perm',
      'Until Dispelled or Triggered': 'perm',
    };

    const durationUnit = duration.durationType || 'Instantaneous';
    const mappedUnit = unitMap[durationUnit];

    return {
      value: duration.durationInterval || null,
      units: mappedUnit || 'inst',
    };
  }

  /**
   * Parse spell target information
   */
  private static parseTarget(definition: any): any {
    const range = definition.range || {};

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

    return {
      value: range.aoeValue || null,
      width: null,
      units: 'ft',
      type: typeMap[range.aoeType || range.origin] || 'creature',
    };
  }

  /**
   * Parse spell range
   */
  private static parseRange(definition: any): any {
    const range = definition.range || {};

    const unitMap: Record<string, string> = {
      Self: 'self',
      Touch: 'touch',
      Ranged: 'ft',
      Sight: 'spec',
      Unlimited: 'any',
    };

    return {
      value: range.rangeValue || null,
      long: null,
      units: unitMap[range.origin] || 'ft',
    };
  }

  /**
   * Parse spell uses and limitations
   */
  private static parseUses(ddbSpell: any): any {
    const limitedUse = ddbSpell.limitedUse;

    if (!limitedUse) {
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

    return {
      value: limitedUse.maxUses || null,
      max: limitedUse.maxUses?.toString() || '',
      per: recoveryMap[limitedUse.resetType] || null,
      recovery: '',
    };
  }

  /**
   * Parse spell resource consumption
   */
  private static parseConsume(definition: any): any {
    return {
      type: 'slots',
      target: `spell${definition.level || 1}`,
      amount: 1,
      scale: false,
    };
  }

  /**
   * Parse spellcasting ability
   */
  private static parseAbility(ddbSpell: any): string | null {
    // This would typically come from the character's class
    // For now, return null to use character's default
    return ddbSpell.spellCastingAbilityId
      ? this.mapAbilityId(ddbSpell.spellCastingAbilityId)
      : null;
  }

  /**
   * Parse spell action type
   */
  private static parseActionType(definition: any): string {
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
  private static parseAttackBonus(definition: any): string {
    // Attack bonus is typically calculated from spellcasting ability + proficiency
    // Return empty string to use character's calculated bonus
    return '';
  }

  /**
   * Parse critical hit information
   */
  private static parseCritical(definition: any): any {
    return {
      threshold: null,
      damage: '',
    };
  }

  /**
   * Parse spell damage
   */
  private static parseDamage(definition: any): any {
    const parts: [string, string][] = [];

    if (definition.damageTypes && definition.damageTypes.length > 0) {
      definition.damageTypes.forEach((damageType: any, index: number) => {
        if (definition.dice && definition.dice[index]) {
          const dice = definition.dice[index];
          const formula = `${dice.diceCount || 1}d${dice.diceValue || 6}${dice.fixedValue ? ` + ${dice.fixedValue}` : ''}`;
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
  private static parseFormula(definition: any): string {
    if (definition.healingTypes && definition.healingTypes.length > 0 && definition.dice) {
      const dice = definition.dice[0];
      if (dice) {
        return `${dice.diceCount || 1}d${dice.diceValue || 6}${dice.fixedValue ? ` + ${dice.fixedValue}` : ''}`;
      }
    }
    return '';
  }

  /**
   * Parse saving throw information
   */
  private static parseSave(definition: any): any {
    if (!definition.saveType) {
      return {
        ability: '',
        dc: null,
        scaling: 'spell',
      };
    }

    const abilityMap: Record<number, string> = {
      1: 'str',
      2: 'dex',
      3: 'con',
      4: 'int',
      5: 'wis',
      6: 'cha',
    };

    return {
      ability: abilityMap[definition.saveType] || '',
      dc: null, // Will be calculated from character's spell DC
      scaling: 'spell',
    };
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
  private static parseComponents(definition: any): any {
    const components = definition.components || [];

    // D&D Beyond uses numbers: 1=verbal, 2=somatic, 3=material
    const hasVerbal = components.includes(1);
    const hasSomatic = components.includes(2);
    const hasMaterial = components.includes(3);

    return {
      vocal: hasVerbal,
      somatic: hasSomatic,
      material: hasMaterial,
      ritual: definition.ritual || false,
      concentration: definition.concentration || false,
    };
  }

  /**
   * Parse material components
   */
  private static parseMaterials(definition: any): any {
    const materialComponent = definition.componentsDescription || '';
    const cost = this.extractCost(materialComponent);

    return {
      value: materialComponent,
      consumed: false,
      cost: cost,
      supply: 0,
    };
  }

  /**
   * Parse spell preparation mode and status
   */
  private static parsePreparation(ddbSpell: any, options: SpellParsingOptions): any {
    const mode = options.preparationMode || 'prepared';

    return {
      mode,
      prepared: ddbSpell.prepared || false,
    };
  }

  /**
   * Parse spell scaling (higher level effects)
   */
  private static parseScaling(definition: any): any {
    if (!definition.higherLevelDescription) {
      return {
        mode: 'none',
        formula: '',
      };
    }

    // Try to extract scaling formula from higher level description
    const scalingFormula = this.extractScalingFormula(definition.higherLevelDescription);

    return {
      mode: scalingFormula ? 'level' : 'none',
      formula: scalingFormula,
    };
  }

  /**
   * Parse spell properties/flags
   */
  private static parseProperties(definition: any): string[] {
    const properties: string[] = [];

    if (definition.ritual) properties.push('ritual');
    if (definition.concentration) properties.push('concentration');
    if (definition.components?.vocal) properties.push('vocal');
    if (definition.components?.somatic) properties.push('somatic');
    if (definition.components?.material) properties.push('material');

    return properties;
  }

  /**
   * Parse active effects (for automation)
   */
  private static parseActiveEffects(definition: any): any[] {
    // This would be expanded for spell automation
    // For now, return empty array
    return [];
  }

  /**
   * Get appropriate icon for spell
   */
  private static getSpellIcon(definition: any): string {
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
   * Create empty spell for error cases
   */
  private static createEmptySpell(): FoundrySpell {
    return {
      name: 'Unknown Spell',
      type: 'spell',
      img: 'icons/svg/mystery-man.svg',
      system: {} as any,
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
    const costMatch = materials.match(/(\d+)\s*gp/i);
    return costMatch && costMatch[1] ? parseInt(costMatch[1]) : 0;
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
      const match = description.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return '';
  }

  /**
   * Parse multiple spells from character spell list
   */
  public static parseCharacterSpells(
    ddbCharacter: any,
    options: SpellParsingOptions = {}
  ): FoundrySpell[] {
    const spells: FoundrySpell[] = [];

    if (!ddbCharacter.spells) {
      return spells;
    }

    // Process all spell categories
    Object.values(ddbCharacter.spells).forEach((spellArray: any) => {
      if (Array.isArray(spellArray)) {
        spellArray.forEach((ddbSpell: any) => {
          try {
            const foundrySpell = this.parseSpell(ddbSpell, options);
            spells.push(foundrySpell);
          } catch (error) {
            Logger.error(
              `Failed to parse spell ${ddbSpell.definition?.name || 'Unknown'}: ${error}`
            );
          }
        });
      }
    });

    Logger.info(`📚 Parsed ${spells.length} spells`);
    return spells;
  }
}
