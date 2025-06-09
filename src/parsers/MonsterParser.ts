// MonsterParser.ts
// Parser for D&D Beyond monsters into FoundryVTT NPC actors

import type { DDBMonster, FoundryItem } from '../types/index.js';

/**
 * FoundryVTT NPC Actor interface
 */
interface FoundryNPCActor {
  name: string;
  type: 'npc';
  img: string;
  system: {
    abilities: {
      str: { value: number; proficient: number; mod: number };
      dex: { value: number; proficient: number; mod: number };
      con: { value: number; proficient: number; mod: number };
      int: { value: number; proficient: number; mod: number };
      wis: { value: number; proficient: number; mod: number };
      cha: { value: number; proficient: number; mod: number };
    };
    attributes: {
      ac: { value: number; formula: string };
      hp: { value: number; max: number; formula: string };
      movement: {
        walk: number;
        climb: number;
        fly: number;
        swim: number;
        burrow: number;
        hover: boolean;
        units: string;
      };
      senses: {
        darkvision: number;
        blindsight: number;
        tremorsense: number;
        truesight: number;
        units: string;
        special: string;
      };
    };
    details: {
      biography: { value: string };
      alignment: string;
      race: string;
      type: { value: string; subtype: string; swarm: string };
      environment: string;
      cr: number;
      spellLevel: number;
      source: string;
    };
    traits: {
      size: string;
      di: { value: string[]; custom: string };
      dr: { value: string[]; custom: string };
      dv: { value: string[]; custom: string };
      ci: { value: string[]; custom: string };
      languages: { value: string[]; custom: string };
    };
    currency: {
      pp: number;
      gp: number;
      ep: number;
      sp: number;
      cp: number;
    };
    skills: Record<string, { value: number; ability: string; bonuses: { check: string; passive: string } }>;
    spells: {
      spell1: { value: number; override: number | null };
      spell2: { value: number; override: number | null };
      spell3: { value: number; override: number | null };
      spell4: { value: number; override: number | null };
      spell5: { value: number; override: number | null };
      spell6: { value: number; override: number | null };
      spell7: { value: number; override: number | null };
      spell8: { value: number; override: number | null };
      spell9: { value: number; override: number | null };
      pact: { value: number; override: number | null };
      dc: number;
      ability: string;
    };
  };
  effects: unknown[];
  flags: {
    'beyond-foundry': {
      ddbId: number;
      isHomebrew: boolean;
      sourceId: number;
      challengeRatingId: number;
    };
  };
  items: unknown[];
}

export class MonsterParser {
  /**
   * Parse a D&D Beyond monster into FoundryVTT NPC actor data
   * @param ddbMonster - The D&D Beyond monster data
   * @returns Parsed FoundryVTT NPC actor data
   */
  public static parseMonster(ddbMonster: DDBMonster): FoundryNPCActor {
    if (!ddbMonster?.definition) {
      throw new Error('Invalid DDBMonster: missing definition');
    }

    const def = ddbMonster.definition;
    
    return {
      name: def.name,
      type: 'npc',
      img: def.avatarUrl || def.largeAvatarUrl || def.basicAvatarUrl || 'icons/svg/mystery-man.svg',
      system: {
        abilities: this.parseAbilities(def.stats),
        attributes: this.parseAttributes(ddbMonster),
        details: this.parseDetails(ddbMonster),
        traits: this.parseTraits(ddbMonster),
        currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
        skills: this.parseSkills(def.skills),
        spells: this.parseSpells()
      },
      effects: [],
      flags: {
        'beyond-foundry': {
          ddbId: def.id,
          isHomebrew: def.isHomebrew,
          sourceId: def.sourceId,
          challengeRatingId: def.challengeRatingId
        }
      },
      items: this.parseMonsterActions(ddbMonster)
    };
  }

  /**
   * Parse monster abilities (STR, DEX, CON, INT, WIS, CHA)
   */
  private static parseAbilities(stats: DDBMonster['definition']['stats']) {
    const abilities = {
      str: { value: 10, proficient: 0, mod: 0 },
      dex: { value: 10, proficient: 0, mod: 0 },
      con: { value: 10, proficient: 0, mod: 0 },
      int: { value: 10, proficient: 0, mod: 0 },
      wis: { value: 10, proficient: 0, mod: 0 },
      cha: { value: 10, proficient: 0, mod: 0 }
    };

    const abilityMap: Record<number, keyof typeof abilities> = {
      1: 'str', 2: 'dex', 3: 'con', 4: 'int', 5: 'wis', 6: 'cha'
    };

    stats.forEach(stat => {
      const ability = abilityMap[stat.statId];
      if (ability) {
        abilities[ability].value = stat.value;
        abilities[ability].mod = Math.floor((stat.value - 10) / 2);
      }
    });

    return abilities;
  }

  /**
   * Parse monster attributes (AC, HP, movement, senses)
   */
  private static parseAttributes(ddbMonster: DDBMonster) {
    const def = ddbMonster.definition;
    
    return {
      ac: {
        value: def.armorClass,
        formula: def.armorClassDescription || ''
      },
      hp: {
        value: def.averageHitPoints,
        max: def.averageHitPoints,
        formula: def.hitPointDice.diceString
      },
      movement: this.parseMovement(def.movements),
      senses: this.parseSenses(def.senses, def.passivePerception)
    };
  }

  /**
   * Parse monster movement speeds
   */
  private static parseMovement(movements: DDBMonster['definition']['movements']) {
    const movement = {
      walk: 30,
      climb: 0,
      fly: 0,
      swim: 0,
      burrow: 0,
      hover: false,
      units: 'ft'
    };

    movements.forEach(move => {
      switch (move.movementId) {
        case 1: // Walk
          movement.walk = move.speed;
          break;
        case 2: // Climb
          movement.climb = move.speed;
          break;
        case 3: // Fly
          movement.fly = move.speed;
          movement.hover = move.notes?.toLowerCase().includes('hover') || false;
          break;
        case 4: // Swim
          movement.swim = move.speed;
          break;
        case 5: // Burrow
          movement.burrow = move.speed;
          break;
      }
    });

    return movement;
  }

  /**
   * Parse monster senses
   */
  private static parseSenses(senses: DDBMonster['definition']['senses'], passivePerception: number) {
    const sensesData = {
      darkvision: 0,
      blindsight: 0,
      tremorsense: 0,
      truesight: 0,
      units: 'ft',
      special: `passive Perception ${passivePerception}`
    };

    senses.forEach(sense => {
      const range = parseInt(sense.notes) || 0;
      switch (sense.senseId) {
        case 2: // Darkvision
          sensesData.darkvision = range;
          break;
        case 1: // Blindsight
          sensesData.blindsight = range;
          break;
        case 3: // Tremorsense
          sensesData.tremorsense = range;
          break;
        case 4: // Truesight
          sensesData.truesight = range;
          break;
      }
    });

    return sensesData;
  }

  /**
   * Parse monster details (type, alignment, CR, etc.)
   */
  private static parseDetails(ddbMonster: DDBMonster) {
    const def = ddbMonster.definition;
    
    // Combine all description fields for biography
    const biography = [
      def.specialTraitsDescription,
      def.actionsDescription,
      def.reactionsDescription,
      def.legendaryActionsDescription,
      def.bonusActionsDescription,
      def.characteristicsDescription,
      def.lairDescription
    ].filter(desc => desc && desc.trim()).join('\n\n');

    return {
      biography: { value: biography },
      alignment: this.parseAlignment(def.alignmentId),
      race: def.name,
      type: {
        value: this.parseCreatureType(def.typeId),
        subtype: def.subTypes.length > 0 ? this.parseSubtypes(def.subTypes) : '',
        swarm: def.swarm ? 'swarm' : ''
      },
      environment: def.environments.map(env => this.parseEnvironment(env)).join(', '),
      cr: this.parseChallengeRating(def.challengeRatingId),
      spellLevel: 0,
      source: this.parseSource(def.sourceId)
    };
  }

  /**
   * Parse monster traits (size, resistances, immunities, etc.)
   */
  private static parseTraits(ddbMonster: DDBMonster) {
    const def = ddbMonster.definition;
    
    return {
      size: this.parseSize(def.sizeId),
      di: { value: this.parseDamageImmunities(def.damageAdjustments), custom: '' },
      dr: { value: this.parseDamageResistances(def.damageAdjustments), custom: '' },
      dv: { value: this.parseDamageVulnerabilities(def.damageAdjustments), custom: '' },
      ci: { value: this.parseConditionImmunities(def.conditionImmunities), custom: '' },
      languages: { value: this.parseLanguages(def.languages), custom: def.languageNote || '' }
    };
  }

  /**
   * Parse monster skills
   */
  private static parseSkills(skills: DDBMonster['definition']['skills']) {
    const skillsData: Record<string, { value: number; ability: string; bonuses: { check: string; passive: string } }> = {};
    
    skills.forEach(skill => {
      const skillName = this.getSkillName(skill.skillId);
      const ability = this.getSkillAbility(skill.skillId);
      
      if (skillName && ability) {
        skillsData[skillName] = {
          value: 1, // Proficient
          ability,
          bonuses: {
            check: skill.additionalBonus ? `+${skill.additionalBonus}` : '',
            passive: ''
          }
        };
      }
    });

    return skillsData;
  }

  /**
   * Parse spell slots (empty for most monsters)
   */
  private static parseSpells() {
    return {
      spell1: { value: 0, override: null },
      spell2: { value: 0, override: null },
      spell3: { value: 0, override: null },
      spell4: { value: 0, override: null },
      spell5: { value: 0, override: null },
      spell6: { value: 0, override: null },
      spell7: { value: 0, override: null },
      spell8: { value: 0, override: null },
      spell9: { value: 0, override: null },
      pact: { value: 0, override: null },
      dc: 8,
      ability: 'int'
    };
  }

  /**
   * Parse monster actions into FoundryVTT items
   */
  private static parseMonsterActions(monster: DDBMonster): FoundryItem[] {
    const actions: FoundryItem[] = [];

    // Parse special traits
    if (monster.definition.specialTraitsDescription) {
      actions.push(this.createActionItem(
        'Special Traits',
        'feat',
        monster.definition.specialTraitsDescription,
        'trait'
      ));
    }

    // Parse actions
    if (monster.definition.actionsDescription) {
      actions.push(this.createActionItem(
        'Actions',
        'feat',
        monster.definition.actionsDescription,
        'action'
      ));
    }

    // Parse bonus actions
    if (monster.definition.bonusActionsDescription) {
      actions.push(this.createActionItem(
        'Bonus Actions',
        'feat',
        monster.definition.bonusActionsDescription,
        'bonus'
      ));
    }

    // Parse reactions
    if (monster.definition.reactionsDescription) {
      actions.push(this.createActionItem(
        'Reactions',
        'feat',
        monster.definition.reactionsDescription,
        'reaction'
      ));
    }

    // Parse legendary actions
    if (monster.definition.legendaryActionsDescription) {
      actions.push(this.createActionItem(
        'Legendary Actions',
        'feat',
        monster.definition.legendaryActionsDescription,
        'legendary'
      ));
    }

    // Parse lair actions if present
    if (monster.definition.lairActionsDescription) {
      actions.push(this.createActionItem(
        'Lair Actions',
        'feat',
        monster.definition.lairActionsDescription,
        'lair'
      ));
    }

    return actions;
  }

  /**
   * Create a FoundryVTT action item
   */
  private static createActionItem(
    name: string,
    type: string,
    description: string,
    actionType: string
  ): FoundryItem {
    return {
      id: `${actionType}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      img: this.getActionIcon(actionType),
      system: {
        description: {
          value: description,
          chat: description.slice(0, 200) + '...',
          unidentified: '',
        },
        activation: {
          type: actionType === 'bonus' ? 'bonus' : actionType === 'reaction' ? 'reaction' : 'action',
          cost: actionType === 'legendary' ? 1 : 1,
          condition: '',
        },
        duration: { value: null, units: '' },
        target: { value: null, width: null, units: '', type: '' },
        range: { value: null, long: null, units: '' },
        uses: { value: null, max: '', per: null, recovery: '' },
        consume: { type: '', target: '', amount: 0 },
        ability: null,
        actionType: actionType === 'trait' ? '' : 'other',
        attackBonus: '',
        chatFlavor: '',
        critical: { threshold: null, damage: '' },
        damage: { parts: [], versatile: '' },
        formula: '',
        save: { ability: '', dc: null, scaling: 'spell' },
        requirements: '',
        recharge: { value: null, charged: true },
      },
      flags: {
        'beyond-foundry': {
          ddbId: Math.random().toString(36).substr(2, 9),
          type: actionType,
          isMonsterAction: true,
        },
      },
    };
  }

  /**
   * Parse monster spellcasting abilities
   */
  private static parseMonsterSpells(monster: DDBMonster): FoundryItem[] {
    const spells: FoundryItem[] = [];

    // Check if monster has spellcasting
    if (monster.definition.spellcastingAbilityId && monster.definition.spellcastingLevel) {
      const spellcastingAbility = this.getAbilityName(monster.definition.spellcastingAbilityId);
      
      // Create spellcasting trait
      spells.push({
        id: `spellcasting-${monster.id}`,
        name: 'Spellcasting',
        type: 'feat',
        img: 'systems/dnd5e/icons/spells/fog-blue-2.jpg',
        system: {
          description: {
            value: `The ${monster.name} is a ${this.getOrdinal(monster.definition.spellcastingLevel)}-level spellcaster. Its spellcasting ability is ${spellcastingAbility}.`,
            chat: 'Spellcasting ability',
            unidentified: '',
          },
          activation: { type: '', cost: 0, condition: '' },
          duration: { value: null, units: '' },
          target: { value: null, width: null, units: '', type: '' },
          range: { value: null, long: null, units: '' },
          uses: { value: null, max: '', per: null, recovery: '' },
          consume: { type: '', target: '', amount: 0 },
          ability: spellcastingAbility.toLowerCase().substring(0, 3),
          actionType: '',
          attackBonus: '',
          chatFlavor: '',
          critical: { threshold: null, damage: '' },
          damage: { parts: [], versatile: '' },
          formula: '',
          save: { ability: '', dc: null, scaling: 'spell' },
          requirements: '',
          recharge: { value: null, charged: true },
        },
        flags: {
          'beyond-foundry': {
            ddbId: `spellcasting-${monster.id}`,
            type: 'spellcasting',
            isMonsterSpell: true,
            spellcastingLevel: monster.definition.spellcastingLevel,
            spellcastingAbility: spellcastingAbility,
          },
        },
      });
    }

    return spells;
  }

  /**
   * Get action icon based on type
   */
  private static getActionIcon(actionType: string): string {
    const iconMap: Record<string, string> = {
      trait: 'systems/dnd5e/icons/skills/yellow_03.jpg',
      action: 'systems/dnd5e/icons/skills/red_01.jpg',
      bonus: 'systems/dnd5e/icons/skills/orange_01.jpg',
      reaction: 'systems/dnd5e/icons/skills/blue_01.jpg',
      legendary: 'systems/dnd5e/icons/skills/violet_01.jpg',
      lair: 'systems/dnd5e/icons/skills/green_01.jpg',
    };
    return iconMap[actionType] || 'systems/dnd5e/icons/skills/gray_01.jpg';
  }

  /**
   * Get ability name from ID
   */
  private static getAbilityName(abilityId: number): string {
    const abilities: Record<number, string> = {
      1: 'Strength', 2: 'Dexterity', 3: 'Constitution',
      4: 'Intelligence', 5: 'Wisdom', 6: 'Charisma'
    };
    return abilities[abilityId] || 'Intelligence';
  }

  /**
   * Get ordinal number string
   */
  private static getOrdinal(num: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const mod100 = num % 100;
    return num + (suffixes[(mod100 - 20) % 10] || suffixes[mod100] || suffixes[0]);
  }

  // Helper methods for ID mappings
  private static parseAlignment(alignmentId: number): string {
    const alignments: Record<number, string> = {
      1: 'Lawful Good', 2: 'Neutral Good', 3: 'Chaotic Good',
      4: 'Lawful Neutral', 5: 'Neutral', 6: 'Chaotic Neutral',
      7: 'Lawful Evil', 8: 'Neutral Evil', 9: 'Chaotic Evil',
      10: 'Unaligned'
    };
    return alignments[alignmentId] || 'Unaligned';
  }

  private static parseCreatureType(typeId: number): string {
    const types: Record<number, string> = {
      1: 'aberration', 2: 'beast', 3: 'celestial', 4: 'construct',
      5: 'dragon', 6: 'elemental', 7: 'fey', 8: 'fiend',
      9: 'giant', 10: 'humanoid', 11: 'monstrosity', 12: 'ooze',
      13: 'plant', 14: 'undead', 15: 'swarm', 16: 'vehicle'
    };
    return types[typeId] || 'humanoid';
  }

  private static parseSize(sizeId: number): string {
    const sizes: Record<number, string> = {
      1: 'tiny', 2: 'sm', 3: 'med', 4: 'lg', 5: 'huge', 6: 'grg'
    };
    return sizes[sizeId] || 'med';
  }

  private static parseChallengeRating(challengeRatingId: number): number {
    // This is a simplified mapping - in practice you'd want a full CR table
    const crMap: Record<number, number> = {
      1: 0, 2: 0.125, 3: 0.25, 4: 0.5, 5: 1, 6: 2, 7: 3, 8: 4, 9: 5,
      10: 6, 11: 7, 12: 8, 13: 9, 14: 10, 15: 11, 16: 12, 17: 13, 18: 14, 19: 15,
      20: 16, 21: 17, 22: 18, 23: 19, 24: 20, 25: 21, 26: 22, 27: 23, 28: 24, 29: 25, 30: 30
    };
    return crMap[challengeRatingId] || 0;
  }

  private static parseSource(sourceId: number): string {
    const sources: Record<number, string> = {
      1: 'PHB', 2: 'MM', 3: 'DMG', 4: 'SCAG', 5: 'VGM', 
      6: 'XGE', 7: 'MTF', 8: 'GGR', 9: 'AI', 10: 'ERLW',
      11: 'EGW', 12: 'TCE', 13: 'VRGtR', 14: 'FTD', 15: 'SCC'
    };
    return sources[sourceId] || 'Unknown';
  }

  private static parseSubtypes(subTypes: number[]): string {
    // This would need a full subtype mapping table
    return subTypes.map(id => `subtype-${id}`).join(', ');
  }

  private static parseEnvironment(environmentId: number): string {
    const environments: Record<number, string> = {
      1: 'arctic', 2: 'coastal', 3: 'desert', 4: 'forest', 5: 'grassland',
      6: 'hill', 7: 'mountain', 8: 'swamp', 9: 'underdark', 10: 'underwater', 11: 'urban'
    };
    return environments[environmentId] || 'unknown';
  }

  private static parseDamageImmunities(damageAdjustments: number[]): string[] {
    // Filter for immunities (would need full damage type mapping)
    return damageAdjustments.map(id => this.getDamageType(id)).filter((type): type is string => Boolean(type));
  }

  private static parseDamageResistances(damageAdjustments: number[]): string[] {
    // Filter for resistances (would need full damage type mapping)
    // For now, return damage types that could be resistances
    return damageAdjustments.map(id => this.getDamageType(id)).filter((type): type is string => Boolean(type));
  }

  private static parseDamageVulnerabilities(damageAdjustments: number[]): string[] {
    // Filter for vulnerabilities (would need full damage type mapping)
    // For now, return damage types that could be vulnerabilities  
    return damageAdjustments.map(id => this.getDamageType(id)).filter((type): type is string => Boolean(type));
  }

  private static parseConditionImmunities(conditionImmunities: number[]): string[] {
    const conditions: Record<number, string> = {
      1: 'blinded', 2: 'charmed', 3: 'deafened', 4: 'frightened',
      5: 'grappled', 6: 'incapacitated', 7: 'invisible', 8: 'paralyzed',
      9: 'petrified', 10: 'poisoned', 11: 'prone', 12: 'restrained',
      13: 'stunned', 14: 'unconscious', 15: 'exhaustion'
    };
    return conditionImmunities.map(id => conditions[id]).filter((condition): condition is string => Boolean(condition));
  }

  private static parseLanguages(languages: DDBMonster['definition']['languages']): string[] {
    const languageMap: Record<number, string> = {
      1: 'common', 2: 'dwarvish', 3: 'elvish', 4: 'giant', 5: 'gnomish',
      6: 'goblin', 7: 'halfling', 8: 'orc', 9: 'abyssal', 10: 'celestial',
      11: 'draconic', 12: 'deep speech', 13: 'infernal', 14: 'primordial',
      15: 'sylvan', 16: 'undercommon'
    };
    return languages.map(lang => languageMap[lang.languageId]).filter((language): language is string => Boolean(language));
  }

  private static getDamageType(typeId: number): string {
    const damageTypes: Record<number, string> = {
      1: 'acid', 2: 'bludgeoning', 3: 'cold', 4: 'fire', 5: 'force',
      6: 'lightning', 7: 'necrotic', 8: 'piercing', 9: 'poison',
      10: 'psychic', 11: 'radiant', 12: 'slashing', 13: 'thunder'
    };
    return damageTypes[typeId] || '';
  }

  private static getSkillName(skillId: number): string {
    const skills: Record<number, string> = {
      1: 'acrobatics', 2: 'animal handling', 3: 'arcana', 4: 'athletics',
      5: 'deception', 6: 'history', 7: 'insight', 8: 'intimidation',
      9: 'investigation', 10: 'medicine', 11: 'nature', 12: 'perception',
      13: 'performance', 14: 'persuasion', 15: 'religion', 16: 'sleight of hand',
      17: 'stealth', 18: 'survival'
    };
    return skills[skillId] || '';
  }

  private static getSkillAbility(skillId: number): string {
    const skillAbilities: Record<number, string> = {
      1: 'dex', 2: 'wis', 3: 'int', 4: 'str', 5: 'cha', 6: 'int',
      7: 'wis', 8: 'cha', 9: 'int', 10: 'wis', 11: 'int', 12: 'wis',
      13: 'cha', 14: 'cha', 15: 'int', 16: 'dex', 17: 'dex', 18: 'wis'
    };
    return skillAbilities[skillId] || 'int';
  }

  /**
   * Parse an array of monsters (static interface)
   */
  public static parseMonsterArray(monsters: DDBMonster[]): FoundryNPCActor[] {
    return monsters.map(monster => {
      try {
        return this.parseMonster(monster);
      } catch (error) {
        console.error(`Failed to parse monster ${monster.definition?.name || monster.id}:`, error);
        throw error;
      }
    });
  }

  /**
   * Parse homebrew and custom monster flags
   */
  private static parseHomebrewFlags(ddbMonster: DDBMonster): Record<string, unknown> {
    return {
      isHomebrew: ddbMonster.definition.isHomebrew,
      isLegendary: ddbMonster.definition.isLegendary,
      isMythic: ddbMonster.definition.isMythic,
      hasLair: ddbMonster.definition.hasLair,
      tags: ddbMonster.definition.tags
    };
  }

  /**
   * Enhanced property parsing (monster type, filterType, etc.)
   */
  private static parseEnhancedProperties(ddbMonster: DDBMonster): Record<string, unknown> {
    return {
      ...this.parseHomebrewFlags(ddbMonster),
      environments: ddbMonster.definition.environments,
      subTypes: ddbMonster.definition.subTypes,
      version: ddbMonster.definition.version,
      slug: ddbMonster.definition.slug
    };
  }

  /**
   * Parse additional system fields (legendary actions, lair actions, advanced effects)
   */
  private static parseAdditionalSystemFields(ddbMonster: DDBMonster): Record<string, unknown> {
    const def = ddbMonster.definition;
    
    return {
      legendaryActions: def.legendaryActionsDescription || '',
      mythicActions: def.mythicActionsDescription || '',
      bonusActions: def.bonusActionsDescription || '',
      reactions: def.reactionsDescription || '',
      lairActions: def.lairDescription || '',
      specialTraits: def.specialTraitsDescription || '',
      characteristics: def.characteristicsDescription || '',
      languages: {
        description: def.languageDescription || '',
        note: def.languageNote || ''
      }
    };
  }
}
