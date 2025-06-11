/**
 * Enhanced Spell Parser Implementation Prototype
 * 
 * This file demonstrates how to upgrade the SpellParser to leverage
 * FoundryVTT D&D 5e's modern Activity System for full spell automation.
 */

import { Logger } from '../../module/utils/logger.js';
import type { DDBSpell, FoundrySpell, SpellParsingOptions } from '../../types/index.js';

/**
 * Activity data types for FoundryVTT D&D 5e system
 */
interface BaseActivityData {
  _id: string;
  type: 'attack' | 'damage' | 'heal' | 'save' | 'check' | 'utility' | 'cast' | 'enchant';
  name?: string;
  img?: string;
  sort: number;
  activation?: unknown;
  consumption?: unknown;
  description?: unknown;
  duration?: unknown;
  effects?: unknown[];
  range?: unknown;
  target?: unknown;
  uses?: unknown;
}

interface AttackActivityData extends BaseActivityData {
  type: 'attack';
  attack: {
    ability: string;
    bonus: string;
    critical: { threshold: number | null };
    flat: boolean;
    type: {
      value: 'melee' | 'ranged';
      classification: 'spell' | 'weapon' | 'unarmed';
    };
  };
  damage: {
    critical: { bonus: string };
    includeBase: boolean;
    parts: Array<{
      formula: string;
      types: Set<string>;
      scaling?: {
        mode: 'level' | 'none';
        formula: string;
      };
    }>;
  };
}

interface SaveActivityData extends BaseActivityData {
  type: 'save';
  save: {
    ability: Set<string>;
    dc: {
      calculation: string;
      formula: string;
    };
  };
  damage: {
    onSave: 'half' | 'none' | 'full';
    parts: Array<{
      formula: string;
      types: Set<string>;
    }>;
  };
  effects: Array<{
    _id: string;
    onSave: boolean;
  }>;
}

interface UtilityActivityData extends BaseActivityData {
  type: 'utility';
  roll?: {
    formula: string;
    ability: string;
    dc?: number;
  };
}

/**
 * Enhanced Spell Parser with Activity System support
 */
export class EnhancedSpellParser {
  
  /**
   * Parse a D&D Beyond spell into FoundryVTT spell data with modern Activities
   */
  public static parseSpell(ddbSpell: DDBSpell, options: SpellParsingOptions = {}): FoundrySpell {
    const definition = ddbSpell.definition;

    if (!definition) {
      Logger.warn(`Spell missing definition: ${ddbSpell.id}`);
      return this.createEmptySpell();
    }

    Logger.debug(`📜 Parsing spell with activities: ${definition.name} (Level ${definition.level})`);

    // Generate base spell data (existing logic)
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
        level: definition.level,
        school: this.parseSchool(definition.school),
        components: this.parseComponents(definition),
        materials: this.parseMaterials(definition),
        preparation: this.parsePreparation(ddbSpell, options),
        scaling: this.parseScaling(definition),
        properties: this.parseProperties(definition),
        
        // NEW: Add activities for automation
        activities: this.generateActivities(definition)
      },
      effects: this.generateActiveEffects(definition),
      flags: {
        'beyond-foundry': {
          ddbId: definition.id,
          sourceId: ddbSpell.id,
          prepared: !!ddbSpell.prepared,
          alwaysPrepared: typeof ddbSpell.alwaysPrepared === 'boolean' ? ddbSpell.alwaysPrepared : false,
          usesSpellSlot: ddbSpell.usesSpellSlot !== false,
          castAtLevel: typeof ddbSpell.castAtLevel === 'number' ? ddbSpell.castAtLevel : null,
          restriction: typeof ddbSpell.restriction === 'string' ? ddbSpell.restriction : null,
        },
      },
    };

    return foundrySpell;
  }

  /**
   * Generate Activities based on spell mechanics
   */
  private static generateActivities(definition: unknown): Record<string, FoundryActivity> {
    const activities: Record<string, FoundryActivity> = {};
    const def = definition as Record<string, unknown>;
    let sortIndex = 0;

    // Attack spell (e.g., Fire Bolt, Eldritch Blast, Spiritual Weapon)
    if (def.requiresAttackRoll || def.attackType) {
      const attackActivity = this.generateAttackActivity(def, sortIndex++);
      activities[attackActivity._id] = attackActivity;
      Logger.debug(`Generated attack activity for ${def.name}`);
    }

    // Save spell (e.g., Fireball, Hold Person, Counterspell)
    if (def.requiresSavingThrow || def.saveDcAbilityId) {
      const saveActivity = this.generateSaveActivity(def, sortIndex++);
      activities[saveActivity._id] = saveActivity;
      Logger.debug(`Generated save activity for ${def.name}`);
    }

    // Healing spell (e.g., Cure Wounds, Healing Word)
    if (def.healing || (Array.isArray(def.healingDice) && def.healingDice.length > 0)) {
      const healActivity = this.generateHealingActivity(def, sortIndex++);
      activities[healActivity._id] = healActivity;
      Logger.debug(`Generated healing activity for ${def.name}`);
    }

    // Utility spell (e.g., most other spells without attacks/saves)
    if (!def.requiresAttackRoll && !def.requiresSavingThrow && !def.healing && !def.attackType && !def.saveDcAbilityId) {
      const utilityActivity = this.generateUtilityActivity(def, sortIndex++);
      activities[utilityActivity._id] = utilityActivity;
      Logger.debug(`Generated utility activity for ${def.name}`);
    }

    return activities;
  }

  /**
   * Generate attack activity for spell attacks
   */
  private static generateAttackActivity(definition: any, sort: number): AttackActivityData {
    const activityId = `${definition.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-attack`;
    
    return {
      _id: activityId,
      type: 'attack',
      name: `${definition.name} Attack`,
      sort: sort * 100000,
      attack: {
        ability: '', // Use spellcasting ability
        bonus: '', // Use character's spell attack bonus
        critical: { threshold: null },
        flat: false,
        type: {
          value: definition.attackType === 1 ? 'melee' : 'ranged',
          classification: 'spell'
        }
      },
      damage: {
        critical: { bonus: '' },
        includeBase: true,
        parts: this.parseDamageParts(definition)
      }
    };
  }

  /**
   * Generate save activity for saving throw spells
   */
  private static generateSaveActivity(definition: any, sort: number): SaveActivityData {
    const activityId = `${definition.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-save`;
    
    return {
      _id: activityId,
      type: 'save',
      name: `${definition.name} Save`,
      sort: sort * 100000,
      save: {
        ability: new Set([this.mapSaveAbility(definition.saveDcAbilityId)]),
        dc: {
          calculation: 'spellcasting',
          formula: ''
        }
      },
      damage: {
        onSave: this.determineSaveEffect(definition),
        parts: this.parseDamageParts(definition)
      },
      effects: this.parseEffectApplications(definition)
    };
  }

  /**
   * Generate healing activity for healing spells
   */
  private static generateHealingActivity(definition: any, sort: number): UtilityActivityData {
    const activityId = `${definition.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-heal`;
    
    const healingFormula = this.parseHealingFormula(definition);
    
    return {
      _id: activityId,
      type: 'utility',
      name: `${definition.name} Healing`,
      sort: sort * 100000,
      roll: {
        formula: healingFormula,
        ability: '',
      }
    };
  }

  /**
   * Generate utility activity for other spells
   */
  private static generateUtilityActivity(definition: any, sort: number): UtilityActivityData {
    const activityId = `${definition.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-utility`;
    
    return {
      _id: activityId,
      type: 'utility',
      name: definition.name,
      sort: sort * 100000
    };
  }

  /**
   * Parse damage parts from D&D Beyond modifiers
   */
  private static parseDamageParts(definition: any): Array<{ formula: string; types: Set<string>; scaling?: any }> {
    const parts: Array<{ formula: string; types: Set<string>; scaling?: any }> = [];
    
    // Extract from modifiers array
    if (definition.modifiers) {
      for (const modifier of definition.modifiers) {
        if (modifier.type === 'damage' && modifier.die) {
          const formula = `${modifier.die.diceCount || 1}d${modifier.die.diceValue || 6}${modifier.die.fixedValue ? ` + ${modifier.die.fixedValue}` : ''}`;
          const damageType = this.mapDamageType(modifier.subType);
          
          const part = {
            formula,
            types: new Set([damageType])
          };

          // Add scaling if spell can be cast at higher levels
          if (definition.canCastAtHigherLevel) {
            part.scaling = {
              mode: 'level' as const,
              formula: this.extractScalingFormula(definition)
            };
          }
          
          parts.push(part);
        }
      }
    }

    // Fallback: try to extract from description if no modifiers
    if (parts.length === 0) {
      const extractedDamage = this.extractDamageFromDescription(definition.description);
      if (extractedDamage) {
        parts.push(extractedDamage);
      }
    }

    return parts;
  }

  /**
   * Generate Active Effects from D&D Beyond conditions
   */
  private static generateActiveEffects(definition: any): any[] {
    const effects: any[] = [];

    if (definition.conditions) {
      for (const condition of definition.conditions) {
        const effect = this.mapConditionToActiveEffect(condition, definition);
        if (effect) {
          effects.push(effect);
        }
      }
    }

    return effects;
  }

  /**
   * Map D&D Beyond condition to FoundryVTT Active Effect
   */
  private static mapConditionToActiveEffect(condition: any, definition: any): any | null {
    const conditionMap: { [key: number]: string } = {
      1: 'blinded',
      2: 'charmed',
      3: 'deafened',
      4: 'frightened',
      5: 'grappled',
      6: 'incapacitated',
      7: 'invisible',
      8: 'paralyzed',
      9: 'petrified',
      10: 'poisoned',
      11: 'prone',
      12: 'restrained',
      13: 'stunned',
      14: 'unconscious',
      15: 'exhaustion'
    };

    const status = conditionMap[condition.conditionId];
    if (!status) return null;

    return {
      name: `${definition.name} - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      statuses: [status],
      icon: `icons/svg/aura.svg`,
      origin: null,
      duration: this.parseEffectDuration(condition, definition),
      changes: this.getConditionChanges(status),
      flags: {
        'beyond-foundry': {
          conditionId: condition.conditionId,
          source: 'spell'
        }
      }
    };
  }

  /**
   * Helper methods (implementations would need to be added)
   */
  private static mapSaveAbility(abilityId: number | null): string {
    const abilityMap: { [key: number]: string } = {
      1: 'str', 2: 'dex', 3: 'con', 4: 'int', 5: 'wis', 6: 'cha'
    };
    return abilityId ? abilityMap[abilityId] || 'wis' : 'wis';
  }

  private static determineSaveEffect(definition: any): 'half' | 'none' | 'full' {
    // Analyze spell description to determine save effect
    // Default to 'half' for damage spells, 'none' for condition spells
    if (definition.modifiers?.some((m: any) => m.type === 'damage')) {
      return 'half';
    }
    return 'none';
  }

  private static parseHealingFormula(definition: unknown): string {
    const def = definition as Record<string, unknown>;
    
    if (Array.isArray(def.healingDice) && def.healingDice.length > 0) {
      const dice = def.healingDice[0] as Record<string, unknown>;
      const diceCount = dice.diceCount ?? 1;
      const diceValue = dice.diceValue ?? 6;
      const fixedValue = dice.fixedValue ? ` + ${dice.fixedValue}` : '';
      return `${diceCount}d${diceValue}${fixedValue}`;
    }
    
    // Fallback: extract from modifiers
    if (Array.isArray(def.modifiers)) {
      for (const modifier of def.modifiers) {
        const mod = modifier as Record<string, unknown>;
        if (mod.type === 'bonus' && mod.subType === 'hit-points' && mod.die) {
          const die = mod.die as Record<string, unknown>;
          const diceCount = die.diceCount ?? 1;
          const diceValue = die.diceValue ?? 6;
          const fixedValue = die.fixedValue ? ` + ${die.fixedValue}` : '';
          return `${diceCount}d${diceValue}${fixedValue}`;
        }
      }
    }
    
    return '1d4'; // Default healing
  }

  private static parseEffectApplications(definition: any): Array<{ _id: string; onSave: boolean }> {
    const effects: Array<{ _id: string; onSave: boolean }> = [];
    
    if (definition.conditions) {
      for (const condition of definition.conditions) {
        effects.push({
          _id: `condition-${condition.conditionId}`,
          onSave: false // Apply effect regardless of save unless specified otherwise
        });
      }
    }
    
    return effects;
  }

  private static mapDamageType(subType: number): string {
    const damageTypeMap: { [key: number]: string } = {
      1: 'acid',
      2: 'cold',
      3: 'fire',
      4: 'force',
      5: 'lightning',
      6: 'necrotic',
      7: 'poison',
      8: 'psychic',
      9: 'radiant',
      10: 'thunder',
      11: 'bludgeoning',
      12: 'piercing',
      13: 'slashing'
    };
    return damageTypeMap[subType] || 'force';
  }

  private static extractDamageFromDescription(description: string): { formula: string; types: Set<string> } | null {
    // Regex to extract damage dice from description
    const damageRegex = /(\d+d\d+(?:\s*[+\-]\s*\d+)?)\s*(\w+)\s*damage/i;
    const match = description.match(damageRegex);
    
    if (match) {
      return {
        formula: match[1],
        types: new Set([match[2].toLowerCase()])
      };
    }
    
    return null;
  }

  private static extractScalingFormula(definition: any): string {
    if (definition.atHigherLevels?.higherLevelDefinitions?.length > 0) {
      const higherLevel = definition.atHigherLevels.higherLevelDefinitions[0];
      if (higherLevel.dice?.length > 0) {
        const dice = higherLevel.dice[0];
        return `${dice.diceCount || 1}d${dice.diceValue || 6}`;
      }
    }
    
    // Fallback: extract from higher level description
    if (definition.higherLevelDescription) {
      const scalingMatch = definition.higherLevelDescription.match(/(\d+d\d+)/);
      if (scalingMatch) {
        return scalingMatch[1];
      }
    }
    
    return '1d6'; // Default scaling
  }

  private static parseEffectDuration(condition: any, definition: any): any {
    // Parse duration from spell definition
    const duration = definition.duration || {};
    
    return {
      value: duration.durationInterval || 1,
      units: this.mapDurationUnit(duration.durationType),
      startTime: null,
      startRound: null,
      startTurn: null
    };
  }

  private static mapDurationUnit(durationType: number): string {
    const durationMap: { [key: number]: string } = {
      1: 'inst',     // Instantaneous
      2: 'round',    // Round
      3: 'minute',   // Minute
      4: 'hour',     // Hour
      5: 'day',      // Day
      6: 'spec',     // Special
      7: 'perm',     // Permanent
      8: 'round',    // Until end of turn
      9: 'round'     // Until start of turn
    };
    return durationMap[durationType] || 'inst';
  }

  private static getConditionChanges(status: string): any[] {
    // Define stat changes for different conditions
    const conditionChanges: { [key: string]: any[] } = {
      blinded: [
        { key: 'system.attributes.ac.bonus', mode: 2, value: '-2' }
      ],
      charmed: [],
      frightened: [
        { key: 'system.attributes.ac.bonus', mode: 2, value: '-1' }
      ],
      paralyzed: [
        { key: 'system.attributes.ac.value', mode: 4, value: '0' },
        { key: 'system.abilities.dex.save', mode: 4, value: '0' },
        { key: 'system.abilities.str.save', mode: 4, value: '0' }
      ],
      poisoned: [
        { key: 'system.bonuses.abilities.save', mode: 2, value: '-1d4' }
      ],
      stunned: [
        { key: 'system.attributes.ac.value', mode: 4, value: '0' }
      ]
    };
    
    return conditionChanges[status] || [];
  }

  // Import all existing methods from SpellParser
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

  private static parseChatDescription(definition: any): string {
    const desc = definition.description || '';
    const sentences = desc.split('.').slice(0, 2);
    return sentences.join('.') + (sentences.length < desc.split('.').length ? '...' : '');
  }

  private static parseSource(definition: any): string {
    if (definition.sources && definition.sources.length > 0) {
      const source = definition.sources[0];
      return `${source.sourceType === 1 ? 'PHB' : 'Supplement'} ${source.pageNumber || ''}`.trim();
    }
    return '';
  }

  private static parseActivation(definition: any): any {
    const activation = definition.activation || {};
    const typeMap: Record<number, string> = {
      1: 'action', 2: 'bonus', 3: 'reaction', 4: 'minute', 
      5: 'hour', 6: 'minute', 7: 'day'
    };

    return {
      type: typeMap[activation.activationType] || 'action',
      cost: activation.activationTime || 1,
      condition: activation.activationCondition || '',
    };
  }

  private static parseDuration(definition: any): any {
    const duration = definition.duration || {};
    const unitMap: Record<number, string> = {
      1: 'inst', 2: 'round', 3: 'minute', 4: 'hour', 
      5: 'day', 6: 'spec', 7: 'perm'
    };

    return {
      value: duration.durationInterval || null,
      units: unitMap[duration.durationType] || 'inst',
    };
  }

  private static parseTarget(definition: any): any {
    const range = definition.range || {};
    const typeMap: Record<string, string> = {
      Self: 'self', Touch: 'touch', Ranged: 'creature', Point: 'space',
      Line: 'line', Cone: 'cone', Cube: 'cube', Cylinder: 'cylinder',
      Sphere: 'sphere', Square: 'square'
    };

    return {
      value: range.aoeValue || null,
      width: null,
      units: 'ft',
      type: typeMap[range.aoeType || range.origin] || 'creature',
    };
  }

  private static parseRange(definition: any): any {
    const range = definition.range || {};
    const unitMap: Record<string, string> = {
      Self: 'self', Touch: 'touch', Ranged: 'ft', 
      Sight: 'spec', Unlimited: 'any'
    };

    return {
      value: range.rangeValue || null,
      long: null,
      units: unitMap[range.origin] || 'ft',
    };
  }

  private static parseUses(ddbSpell: any): any {
    const limitedUse = ddbSpell.limitedUse;
    if (!limitedUse) {
      return { value: null, max: '', per: null, recovery: '' };
    }

    const recoveryMap: Record<number, string> = {
      1: 'sr', 2: 'lr', 3: 'day', 4: 'charges'
    };

    return {
      value: limitedUse.maxUses || null,
      max: limitedUse.maxUses?.toString() || '',
      per: recoveryMap[limitedUse.resetType] || null,
      recovery: '',
    };
  }

  private static parseConsume(definition: any): any {
    return {
      type: 'slots',
      target: `spell${definition.level ?? 0}`,
      amount: 1,
      scale: false,
    };
  }

  private static parseAbility(ddbSpell: any): string | null {
    return ddbSpell.spellCastingAbilityId
      ? this.mapAbilityId(ddbSpell.spellCastingAbilityId)
      : null;
  }

  private static parseSchool(school: string): string {
    const schoolMap: Record<string, string> = {
      Abjuration: 'abj', Conjuration: 'con', Divination: 'div',
      Enchantment: 'enc', Evocation: 'evo', Illusion: 'ill',
      Necromancy: 'nec', Transmutation: 'trs'
    };
    const normalizedSchool = school ? school.charAt(0).toUpperCase() + school.slice(1).toLowerCase() : '';
    return schoolMap[normalizedSchool] || 'evo';
  }

  private static parseComponents(definition: any): any {
    const components = definition.components || {};
    let hasVerbal: boolean, hasSomatic: boolean, hasMaterial: boolean;
    
    if (Array.isArray(components)) {
      hasVerbal = components.includes(1);
      hasSomatic = components.includes(2);
      hasMaterial = components.includes(3);
    } else {
      hasVerbal = components.verbal || false;
      hasSomatic = components.somatic || false;
      hasMaterial = components.material || false;
    }

    return {
      vocal: hasVerbal,
      somatic: hasSomatic,
      material: hasMaterial,
      ritual: definition.ritual || false,
      concentration: definition.concentration || false,
    };
  }

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

  private static parsePreparation(ddbSpell: any, options: SpellParsingOptions): any {
    const mode = options.preparationMode || 'prepared';
    return {
      mode,
      prepared: ddbSpell.prepared || false,
    };
  }

  private static parseScaling(definition: any): any {
    if (!definition.higherLevelDescription) {
      return { mode: 'none', formula: '' };
    }

    const scalingFormula = this.extractScalingFormula(definition);
    return {
      mode: scalingFormula ? 'level' : 'none',
      formula: scalingFormula,
    };
  }

  private static parseProperties(definition: any): string[] {
    const properties: string[] = [];
    if (definition.ritual) properties.push('ritual');
    if (definition.concentration) properties.push('concentration');
    if (definition.components?.vocal) properties.push('vocal');
    if (definition.components?.somatic) properties.push('somatic');
    if (definition.components?.material) properties.push('material');
    return properties;
  }

  private static getSpellIcon(definition: any): string {
    const schoolIcons: Record<string, string> = {
      'abj': 'icons/magic/defensive/shield-barrier-blue.webp',
      'con': 'icons/magic/symbols/question-stone-yellow.webp',
      'div': 'icons/magic/perception/eye-ringed-glow-yellow.webp',
      'enc': 'icons/magic/control/hypnosis-mesmerism-eye.webp',
      'evo': 'icons/magic/fire/projectile-fireball-orange-red.webp',
      'ill': 'icons/magic/perception/shadow-stealth-eyes-purple.webp',
      'nec': 'icons/magic/death/skull-humanoid-crown-white.webp',
      'trs': 'icons/magic/symbols/rune-sigil-black-pink.webp'
    };
    const school = this.parseSchool(definition.school);
    return schoolIcons[school] || 'icons/magic/symbols/rune-sigil-black-pink.webp';
  }

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

  private static mapAbilityId(abilityId: number): string {
    const abilityMap: Record<number, string> = {
      1: 'str', 2: 'dex', 3: 'con', 4: 'int', 5: 'wis', 6: 'cha'
    };
    return abilityMap[abilityId] || 'int';
  }

  private static extractCost(materials: string): number {
    const costMatch = materials.match(/(\d+)\s*gp/i);
    return costMatch && costMatch[1] ? parseInt(costMatch[1]) : 0;
  }

  /**
   * Parse multiple spells from character spell list with enhanced activities
   */
  public static parseCharacterSpells(
    ddbCharacter: any,
    options: SpellParsingOptions = {}
  ): FoundrySpell[] {
    const spells: FoundrySpell[] = [];

    if (!ddbCharacter.spells) {
      return spells;
    }

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

    Logger.info(`🎯 Enhanced parsing complete: ${spells.length} spells with activities`);
    return spells;
  }
}

/**
 * Usage Examples:
 * 
 * 1. Spell Attack (Fire Bolt):
 * - Creates AttackActivity with ranged spell attack
 * - Includes damage parts with fire damage
 * - Scaling at higher levels
 * 
 * 2. Save Spell (Fireball):
 * - Creates SaveActivity with Dex save
 * - Half damage on save
 * - AoE targeting
 * 
 * 3. Condition Spell (Hold Person):
 * - Creates SaveActivity with Wis save
 * - Active Effect for paralyzed condition
 * - Effect applies on failed save only
 * 
 * 4. Healing Spell (Cure Wounds):
 * - Creates UtilityActivity with healing roll
 * - Scaling at higher levels
 */
