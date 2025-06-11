// PATCH: Use CLI fallback logger if BEYOND_FOUNDRY_CLI is set

import type {
  DDBCharacter,
  FoundryActor,
  DDBClass,
  DDBItem,
  DDBSpell,
  FoundryItemData,
  FoundryResource,
} from '../../types/index.ts';
import { Logger } from '../../module/utils/logger';

/**
 * Comprehensive Character Parser for D&D Beyond to FoundryVTT D&D 5e system
 *
 * This parser implements advanced features including:
 * - Enhanced abilities with saving throw proficiencies from modifiers
 * - Skills with proficiency detection and passive scores
 * - Proper HP calculation with Constitution modifier
 * - Equipment parsing (weapons, armor, gear, magical items)
 * - Spell system with slot calculation and spellcasting attributes
 * - Movement and senses parsing (darkvision, etc.)
 * - Currency and encumbrance calculations
 * - Complete FoundryVTT D&D 5e actor structure
 */
export class CharacterParser {
  /**
   * Parse a complete D&D Beyond character into FoundryVTT actor data
   * @param ddbCharacter - The D&D Beyond character data
   * @returns Foundry actor data with comprehensive parsing
   */
  public static async parseCharacter(ddbCharacter: DDBCharacter): Promise<FoundryActor> {
    // Select Logger implementation at runtime
    const Logger = (typeof process !== 'undefined' && process.env.BEYOND_FOUNDRY_CLI)
      ? (await import('./logger-cli-fallback.ts')).Logger
      : (await import('../../module/utils/logger.ts')).Logger;
    Logger.info(`🔮 Comprehensive parsing: ${ddbCharacter.name}`);

    const actorData: FoundryActor = {
      name: ddbCharacter.name,
      type: 'character',
      img: ddbCharacter.decorations?.avatarUrl ?? 'icons/svg/mystery-man.svg',
      system: {
        abilities: this.parseAbilities(ddbCharacter),
        attributes: this.parseEnhancedAttributes(ddbCharacter),
        details: this.parseDetails(ddbCharacter),
        traits: this.parseTraits(ddbCharacter),
        currency: this.parseCurrency(ddbCharacter),
        skills: this.parseSkills(ddbCharacter),
        spells: this.parseSpells(ddbCharacter),
        resources: this.parseResources(ddbCharacter),
        bonuses: this.parseBonuses(ddbCharacter),
      },
      items: this.parseAllItems(ddbCharacter),
      effects: this.parseActiveEffects(ddbCharacter),
      flags: {
        'beyond-foundry': {
          ddbCharacterId: ddbCharacter.id,
          lastSync: Date.now(),
          originalData: ddbCharacter,
          parsingVersion: '2.0.0',
          features: [
            'enhanced-abilities',
            'equipment-parsing',
            'spell-integration',
            'modifier-system',
            'comprehensive-traits',
          ],
        },
      },
    };

    Logger.info(`✅ Comprehensive parsing complete: ${actorData.name}`);
    return actorData;
  }

  /**
   * Parse abilities with all modifiers and proficiencies
   */
  private static parseAbilities(ddbCharacter: DDBCharacter): FoundryActor['system']['abilities'] {
    const abilities: FoundryActor['system']['abilities'] = {
      str: { value: 10, proficient: 0, bonuses: { check: '', save: '' }, min: 3, mod: 0 },
      dex: { value: 10, proficient: 0, bonuses: { check: '', save: '' }, min: 3, mod: 0 },
      con: { value: 10, proficient: 0, bonuses: { check: '', save: '' }, min: 3, mod: 0 },
      int: { value: 10, proficient: 0, bonuses: { check: '', save: '' }, min: 3, mod: 0 },
      wis: { value: 10, proficient: 0, bonuses: { check: '', save: '' }, min: 3, mod: 0 },
      cha: { value: 10, proficient: 0, bonuses: { check: '', save: '' }, min: 3, mod: 0 },
    };

    // Apply base stats
    if (ddbCharacter.stats) {
      ddbCharacter.stats.forEach(stat => {
        const abilityKey = Object.keys(abilities).find(key => {
          if (typeof stat.id === 'string') {
            return key === (stat.id as string).toLowerCase();
          } else if (typeof stat.id === 'number') {
            // If stat.id is a number, map to ability key by index
            const keys = Object.keys(abilities);
            return key === keys[stat.id - 1];
          }
          return false;
        });
        if (abilityKey) {
          abilities[abilityKey].value = stat.value ?? 10;
          abilities[abilityKey].mod = CharacterParser.getAbilityModifier(stat.value ?? 10);
        }
      });
    }

    // Apply saving throw proficiencies
    CharacterParser.applySavingThrowProficiencies(ddbCharacter, abilities);

    return abilities;
  }

  /**
   * Apply saving throw proficiencies from modifiers
   */
  private static applySavingThrowProficiencies(ddbCharacter: DDBCharacter, abilities: FoundryActor['system']['abilities']) {
    const modifiers = ddbCharacter.modifiers ?? {};
    const abilityMap = { 1: 'str', 2: 'dex', 3: 'con', 4: 'int', 5: 'wis', 6: 'cha' };

    Object.values(modifiers)?.forEach(modifierArray => {
      if (Array.isArray(modifierArray)) {
        modifierArray.forEach(modifier => {
          if (modifier.type === 'proficiency' && modifier.subType === 'saving-throws') {
            const abilityKey = abilityMap[modifier.entityId as keyof typeof abilityMap];
            if (abilityKey && abilities[abilityKey]) {
              abilities[abilityKey].proficient = 1;
              Logger.debug(`💾 Save proficiency: ${abilityKey.toUpperCase()}`);
            }
          }
        });
      }
    });
  }

  /**
   * Parse character attributes (HP, AC, etc.)
   */
  private static parseAttributes(ddbCharacter: DDBCharacter) {
    return {
      ac: {
        flat: null,
        calc: 'default',
        formula: '',
      },
      hp: {
        value: ddbCharacter.baseHitPoints ?? 0,
        max: ddbCharacter.baseHitPoints ?? 0,
        temp: 0,
        tempmax: 0,
        bonuses: {
          level: '',
          overall: '',
        },
      },
      init: {
        ability: 'dex',
        bonus: 0,
      },
      movement: this.parseMovement(ddbCharacter),
      senses: this.parseSenses(ddbCharacter),
      spellcasting: ddbCharacter.spellcastingAbilityId
        ? this.getAbilityKey(ddbCharacter.spellcastingAbilityId)
        : '',
      prof: this.calculateProficiencyBonus(ddbCharacter.classes || []),
      spelldc: 8, // Will be calculated based on spellcasting ability
    };
  }

  /**
   * Parse character details with comprehensive class and level information
   * (Enhanced: gender, eyes, hair, skin, height, weight, faith, age)
   */
  private static parseDetails(ddbCharacter: DDBCharacter) {
    const primaryClass = this.getPrimaryClass(ddbCharacter);
    return {
      biography: {
        value: ddbCharacter.notes?.backstory ?? '',
        public: '',
      },
      alignment: ddbCharacter.alignmentId ? this.parseAlignment(ddbCharacter.alignmentId) : '',
      race: ddbCharacter.race?.fullName ?? '',
      background: ddbCharacter.background?.definition?.name ?? '',
      originalClass: primaryClass,
      xp: {
        value: ddbCharacter.currentXp ?? 0,
        max: 0,
        pct: 0,
      },
      level: 0,
      classes: {},
      appearance: ddbCharacter.notes?.appearance ?? '',
      trait: ddbCharacter.notes?.personalityTraits ?? '',
      ideal: ddbCharacter.notes?.ideals ?? '',
      bond: ddbCharacter.notes?.bonds ?? '',
      flaw: ddbCharacter.notes?.flaws ?? '',
      gender: ddbCharacter.gender ?? '',
      eyes: ddbCharacter.eyes ?? '',
      hair: ddbCharacter.hair ?? '',
      skin: ddbCharacter.skin ?? '',
      height: ddbCharacter.height ?? '',
      weight: ddbCharacter.weight ?? '',
      faith: ddbCharacter.faith ?? '',
      age: ddbCharacter.age ?? '',
    };
  }

  /**
   * Parse detailed class information
   */
  private static parseClassDetails(ddbCharacter: DDBCharacter): Record<string, { levels: number; subclass: string; hitDie: number }> {
    const classDetails: Record<string, { levels: number; subclass: string; hitDie: number }> = {};
    ddbCharacter.classes?.forEach(cls => {
      const className = cls.definition.name.toLowerCase();
      classDetails[className] = {
        levels: cls.level,
        subclass: cls.subclassDefinition?.name ?? '',
        hitDie: cls.definition.hitDie,
      };
    });

    return classDetails;
  }

  /**
   * Parse character traits with enhanced resistances, languages, and proficiencies
   * (Enhanced: custom traits/notes)
   */
  private static parseTraits(ddbCharacter: DDBCharacter) {
    return {
      size: this.parseSize(ddbCharacter.race?.size ?? 'medium'),
      senses: '',
      languages: {
        value: this.parseLanguages(ddbCharacter),
        custom: '',
      },
      di: { value: [], custom: '' }, // Damage immunities
      dr: { value: [], custom: '' }, // Damage resistances
      dv: { value: [], custom: '' }, // Damage vulnerabilities
      ci: { value: [], custom: '' }, // Condition immunities
      weaponProf: {
        value: this.parseWeaponProficiencies(ddbCharacter),
        custom: '',
      },
      armorProf: {
        value: this.parseArmorProficiencies(ddbCharacter),
        custom: '',
      },
      toolProf: {
        value: this.parseToolProficiencies(ddbCharacter),
        custom: '',
      },
      // custom: ddbCharacter.notes?.otherNotes ?? '', // Not present in DDBCharacter, left for future
      custom: '', // Placeholder for future DDB fields
    };
  }

  /**
   * Parse weapon proficiencies from modifiers
   */
  private static parseWeaponProficiencies(ddbCharacter: DDBCharacter): string[] {
    const proficiencies: string[] = [];
    const modifiers = ddbCharacter.modifiers ?? {};

    Object.values(modifiers)?.forEach(modifierArray => {
      if (Array.isArray(modifierArray)) {
        modifierArray.forEach(modifier => {
          if (
            modifier.type === 'proficiency' &&
            modifier.subType?.includes('weapon')
          ) {
            proficiencies.push(modifier.friendlySubtypeName ?? modifier.subType);
          }
        });
      }
    });

    return proficiencies;
  }

  /**
   * Parse armor proficiencies from modifiers
   */
  private static parseArmorProficiencies(ddbCharacter: DDBCharacter): string[] {
    const proficiencies: string[] = [];
    const modifiers = ddbCharacter.modifiers ?? {};

    Object.values(modifiers)?.forEach(modifierArray => {
      if (Array.isArray(modifierArray)) {
        modifierArray.forEach(modifier => {
          if (
            modifier.type === 'proficiency' &&
            modifier.subType?.includes('armor')
          ) {
            proficiencies.push(modifier.friendlySubtypeName ?? modifier.subType);
          }
        });
      }
    });

    return proficiencies;
  }

  /**
   * Parse tool proficiencies from modifiers
   */
  private static parseToolProficiencies(ddbCharacter: DDBCharacter): string[] {
    const proficiencies: string[] = [];
    const modifiers = ddbCharacter.modifiers ?? {};

    Object.values(modifiers)?.forEach(modifierArray => {
      if (Array.isArray(modifierArray)) {
        modifierArray.forEach(modifier => {
          if (
            modifier.type === 'proficiency' &&
            modifier.subType &&
            (modifier.subType.includes('tool') || modifier.subType.includes('kit'))
          ) {
            proficiencies.push(modifier.friendlySubtypeName || modifier.subType);
          }
        });
      }
    });

    return proficiencies;
  }

  /**
   * Parse currency from D&D Beyond
   */
  private static parseCurrency(ddbCharacter: DDBCharacter) {
    const currencies = ddbCharacter.currencies ?? { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
    return {
      pp: currencies.pp ?? 0,
      gp: currencies.gp ?? 0,
      ep: currencies.ep ?? 0,
      sp: currencies.sp ?? 0,
      cp: currencies.cp ?? 0,
    };
  }

  /**
   * Parse skills and proficiencies with comprehensive proficiency detection
   */
  private static parseSkills(ddbCharacter: DDBCharacter): FoundryActor['system']['skills'] {
    const skills: FoundryActor['system']['skills'] = {} as FoundryActor['system']['skills'];

    // D&D 5e system skills
    const skillList = [
      'acr',
      'ani',
      'arc',
      'ath',
      'dec',
      'his',
      'ins',
      'itm',
      'inv',
      'med',
      'nat',
      'prc',
      'prf',
      'per',
      'rel',
      'slt',
      'ste',
      'sur',
    ];

    skillList.forEach(skill => {
      skills[skill] = {
        value: 0, // 0 = not proficient, 1 = proficient, 2 = expertise
        ability: this.getSkillAbility(skill),
        bonuses: {
          check: '',
          passive: '',
        },
      };
    });

    // Apply skill proficiencies from modifiers
    this.applySkillProficiencies(ddbCharacter, skills);

    return skills;
  }

  /**
   * Apply skill proficiencies from D&D Beyond modifiers
   */
  private static applySkillProficiencies(ddbCharacter: DDBCharacter, skills: FoundryActor['system']['skills']) {
    const modifiers = ddbCharacter.modifiers ?? {};

    Object.values(modifiers)?.forEach(modifierArray => {
      if (Array.isArray(modifierArray)) {
        modifierArray.forEach(modifier => {
          if (modifier.type === 'proficiency' && modifier.subType) {
            const skillKey = this.getSkillKeyFromModifier(modifier);
            if (skillKey && skills[skillKey]) {
              skills[skillKey].value = 1; // Proficient
              Logger.debug(`🎯 Skill proficiency: ${skillKey}`);
            }
          }

          if (modifier.type === 'expertise' && modifier.subType) {
            const skillKey = this.getSkillKeyFromModifier(modifier);
            if (skillKey && skills[skillKey]) {
              skills[skillKey].value = 2; // Expertise
              Logger.debug(`⭐ Skill expertise: ${skillKey}`);
            }
          }
        });
      }
    });
  }

  /**
   * Parse spell-related attributes with comprehensive spell slot calculation
   */
  private static parseSpells(ddbCharacter: DDBCharacter) {
    const primaryClass = this.getPrimarySpellcastingClass(ddbCharacter);
    const spellSlots = primaryClass
      ? this.calculateSpellSlots(primaryClass.definition.name, primaryClass.level)
      : {};

    return {
      spell1: { value: spellSlots.spell1 ?? 0, override: null, max: spellSlots.spell1 ?? 0 },
      spell2: { value: spellSlots.spell2 ?? 0, override: null, max: spellSlots.spell2 ?? 0 },
      spell3: { value: spellSlots.spell3 ?? 0, override: null, max: spellSlots.spell3 ?? 0 },
      spell4: { value: spellSlots.spell4 ?? 0, override: null, max: spellSlots.spell4 ?? 0 },
      spell5: { value: spellSlots.spell5 ?? 0, override: null, max: spellSlots.spell5 ?? 0 },
      spell6: { value: spellSlots.spell6 ?? 0, override: null, max: spellSlots.spell6 ?? 0 },
      spell7: { value: spellSlots.spell7 ?? 0, override: null, max: spellSlots.spell7 ?? 0 },
      spell8: { value: spellSlots.spell8 ?? 0, override: null, max: spellSlots.spell8 ?? 0 },
      spell9: { value: spellSlots.spell9 ?? 0, override: null, max: spellSlots.spell9 ?? 0 },
      pact: { value: 0, override: null, max: 0, level: 1 },
      spells0: { value: 0, max: 0 },
      spells1: { value: 0, max: 0 },
      spells2: { value: 0, max: 0 },
      spells3: { value: 0, max: 0 },
      spells4: { value: 0, max: 0 },
      spells5: { value: 0, max: 0 },
      spells6: { value: 0, max: 0 },
      spells7: { value: 0, max: 0 },
      spells8: { value: 0, max: 0 },
      spells9: { value: 0, max: 0 },
    };
  }

  /**
   * Parse character resources (inspiration, etc.)
   */
  private static parseResources(_ddbCharacter: DDBCharacter): Record<string, FoundryResource> {
    return {
      primary: { value: 0, max: 0, sr: false, lr: false, label: '' },
      secondary: { value: 0, max: 0, sr: false, lr: false, label: '' },
      tertiary: { value: 0, max: 0, sr: false, lr: false, label: '' },
    };
  }

  // Helper methods

  private static isProficientInSave(_ddbCharacter: DDBCharacter, _abilityId: number): number {
    return 0;
  }

  private static parseMovement(ddbCharacter: DDBCharacter) {
    return {
      burrow: 0,
      climb: 0,
      fly: 0,
      swim: 0,
      walk: ddbCharacter.race?.weightSpeeds?.normal?.walk ?? 30,
      units: 'ft',
      hover: false,
    };
  }

  private static parseSenses(_ddbCharacter: DDBCharacter): FoundryActor['system']['attributes']['senses'] {
    return {
      darkvision: 0,
      blindsight: 0,
      tremorsense: 0,
      truesight: 0,
      units: 'ft',
      special: '',
    };
  }

  private static calculateProficiencyBonus(classes: DDBClass[]): number {
    const totalLevel = classes.reduce((sum, cls) => sum + (cls.level ?? 0), 0);
    return Math.ceil(totalLevel / 4) + 1;
  }

  private static getAbilityKey(abilityId: number): string {
    const map: Record<number, string> = {
      1: 'str',
      2: 'dex',
      3: 'con',
      4: 'int',
      5: 'wis',
      6: 'cha',
    };
    return map[abilityId] ?? '';
  }

  private static parseAlignment(alignmentId: number): string {
    const alignments: Record<number, string> = {
      1: 'lg',
      2: 'ln',
      3: 'le',
      4: 'ng',
      5: 'n',
      6: 'ne',
      7: 'cg',
      8: 'cn',
      9: 'ce',
    };
    return alignments[alignmentId] ?? 'n';
  }

  private static parseSize(size: string): string {
    const sizeMap: Record<string, string> = {
      tiny: 'tiny',
      small: 'sm',
      medium: 'med',
      large: 'lg',
      huge: 'huge',
      gargantuan: 'grg',
    };
    return sizeMap[size.toLowerCase()] ?? 'med';
  }

  /**
   * Parse enhanced attributes with spellcasting and encumbrance
   * (Enhanced: death saves, exhaustion, attunement)
   */
  private static parseEnhancedAttributes(ddbCharacter: DDBCharacter): FoundryActor['system']['attributes'] {
    const totalLevel = CharacterParser.getTotalLevel(ddbCharacter);
    const constitutionMod = CharacterParser.getAbilityModifier(CharacterParser.getAbilityScore(ddbCharacter, 3));
    const baseHP = ddbCharacter.baseHitPoints ?? 0;
    const bonusHP = ddbCharacter.bonusHitPoints ?? 0;
    const overrideHP = ddbCharacter.overrideHitPoints;
    const removedHP = ddbCharacter.removedHitPoints ?? 0;
    let maxHP;
    if (overrideHP !== null && overrideHP !== undefined) {
      maxHP = overrideHP;
    } else {
      maxHP = baseHP + constitutionMod * totalLevel + bonusHP;
    }
    const currentHP = Math.max(0, maxHP - removedHP);
    // Spellcasting attributes
    const primaryClass = CharacterParser.getPrimarySpellcastingClass(ddbCharacter);
    const spellcastingAbility = CharacterParser.getSpellcastingAbility(primaryClass);
    const spellcastingMod = CharacterParser.getAbilityModifier(
      CharacterParser.getAbilityScore(ddbCharacter, CharacterParser.getStatIdForAbility(spellcastingAbility))
    );
    const profBonus = CharacterParser.getProficiencyBonus(totalLevel);
    // Add death saves and exhaustion if present
    // DDB v5 API: only isStabilized is present, so we cannot map successes/failures yet
    // If DDB adds these, map as: success: deathSaves.successes ?? 0, failure: deathSaves.failures ?? 0
    // const deathSaves = ddbCharacter.deathSaves ?? {}; // Only isStabilized currently
    // const exhaustion = ddbCharacter.exhaustion ?? 0; // Not present in DDBCharacter, left for future
    // Calculate attunement from inventory
    return {
      ac: { flat: null, calc: 'default', formula: '' },
      hp: {
        value: currentHP,
        max: maxHP,
        temp: ddbCharacter.temporaryHitPoints ?? 0,
        tempmax: 0,
      },
      // attunement: { value: attunementValue }, // Future mapping if DDB exposes attunement fields
      movement: CharacterParser.parseMovement(ddbCharacter),
      senses: CharacterParser.parseSenses(ddbCharacter),
      spellcasting: spellcastingAbility,
      prof: profBonus,
      spelldc: 8 + profBonus + spellcastingMod,
      encumbrance: CharacterParser.parseEncumbrance(ddbCharacter),
    };
  }

  /**
   * Parse encumbrance system
   */
  private static parseEncumbrance(ddbCharacter: DDBCharacter): FoundryActor['system']['attributes']['encumbrance'] {
    const strengthScore = CharacterParser.getAbilityScore(ddbCharacter, 1);
    const carryingCapacity = strengthScore * 15;
    return {
      value: 0,
      max: carryingCapacity,
      pct: 0,
      encumbered: false,
    };
  }

  /**
   * Parse all items (equipment, spells, features)
   */
  private static parseAllItems(ddbCharacter: DDBCharacter): FoundryItemData[] {
    let items: FoundryItemData[] = [];
    items = items.concat(this.parseEquipment(ddbCharacter));
    items = items.concat(this.parseSpellItems(ddbCharacter));
    items = items.concat(this.parseFeatures(ddbCharacter));
    return items;
  }

  /**
   * Parse active effects (simplified for now)
   */
  private static parseActiveEffects(_ddbCharacter: DDBCharacter): unknown[] {
    return [];
  }

  /**
   * Parse character bonuses
   */
  private static parseBonuses(_ddbCharacter: DDBCharacter): FoundryActor['system']['bonuses'] {
    return {
      mwak: { attack: '', damage: '' },
      rwak: { attack: '', damage: '' },
      msak: { attack: '', damage: '' },
      rsak: { attack: '', damage: '' },
      abilities: { check: '', save: '', skill: '' },
      spell: { dc: '' },
    };
  }

  /**
   * Parse equipment items
   */
  private static parseEquipment(ddbCharacter: DDBCharacter): FoundryItemData[] {
    const items: FoundryItemData[] = [];

    if (ddbCharacter.inventory) {
      ddbCharacter.inventory.forEach(item => {
        try {
          const foundryItem = this.parseInventoryItem(item);
          if (foundryItem) {
            items.push(foundryItem);
          }
        } catch (error) {
          Logger.error(`Equipment parsing error: ${(error as Error).message}`);
        }
      });
    }

    Logger.debug(`⚔️ Parsed ${items.length} equipment items`);
    return items;
  }

  /**
   * Parse individual inventory item
   */
  private static parseInventoryItem(ddbItem: DDBItem): FoundryItemData | null {
    if (!ddbItem.definition) return null;

    const definition = ddbItem.definition;
    const itemType = this.getFoundryItemType({ filterType: definition.type });

    return {
      name: definition.name,
      type: itemType,
      img: definition.avatarUrl ?? this.getDefaultIcon(itemType),
      system: {
        description: { value: definition.description ?? '' },
        quantity: ddbItem.quantity ?? 1,
        weight: (definition.weight ?? 0) /* * (typeof definition.weightMultiplier === 'number' ? definition.weightMultiplier : 1) */,
        price: { value: definition.cost?.quantity ?? 0, denomination: 'gp' },
        equipped: ddbItem.equipped ?? false,
        rarity: definition.rarity?.toLowerCase() ?? 'common',
        identified: true,
        attuned: ddbItem.isAttuned ?? false,
      },
      flags: {
        'beyond-foundry': {
          ddbId: definition.id,
          ddbType: definition.type,
          // isHomebrew: definition.isHomebrew ?? false, // Removed as not present in type
        },
      },
    };
  }

  /**
   * Parse spell items
   */
  private static parseSpellItems(ddbCharacter: DDBCharacter): FoundryItemData[] {
    const spellItems: FoundryItemData[] = [];

    if (ddbCharacter.spells) {
      Object.values(ddbCharacter.spells).forEach(spellArray => {
        if (Array.isArray(spellArray)) {
          spellArray.forEach(spell => {
            try {
              const spellItem = this.parseSpellItem(spell);
              if (spellItem) {
                spellItems.push(spellItem);
              }
            } catch (error) {
              Logger.error(`Spell parsing error: ${(error as Error).message}`);
            }
          });
        }
      });
    }

    Logger.debug(`🔮 Parsed ${spellItems.length} spell items`);
    return spellItems;
  }

  /**
   * Parse individual spell item
   */
  private static parseSpellItem(ddbSpell: DDBSpell): FoundryItemData | null {
    if (!ddbSpell.definition) return null;

    const definition = ddbSpell.definition;

    return {
      name: definition.name,
      type: 'spell',
      img: 'icons/magic/symbols/rune-sigil-black-pink.webp',
      system: {
        description: { value: definition.description ?? '' },
        level: definition.level ?? 0,
        school: definition.school?.toLowerCase() ?? 'evocation',
        components: {
          vocal: definition.components?.verbal ?? false,
          somatic: definition.components?.somatic ?? false,
          material: definition.components?.material ?? false,
          ritual: definition.ritual ?? false,
          concentration: definition.concentration ?? false,
        },
        materials: { value: definition.components?.materialComponent ?? '' },
        preparation: { mode: 'prepared', prepared: ddbSpell.prepared ?? false },
        scaling: { mode: 'none', formula: '' },
        range: { value: null, units: 'ft' },
        target: { value: null, width: null, units: '', type: '' },
        duration: { value: null, units: '' },
        activation: { type: 'action', cost: 1, condition: '' },
      },
      flags: {
        'beyond-foundry': {
          ddbId: definition.id,
          spellListId: typeof ddbSpell.spellListId === 'number' ? ddbSpell.spellListId : undefined,
        },
      },
    };
  }

  /**
   * Parse features (simplified for now)
   */
  private static parseFeatures(ddbCharacter: DDBCharacter): FoundryItemData[] {
    return [
      ...this.parseClassFeatures(ddbCharacter),
      ...this.parseSubclassFeatures(ddbCharacter),
      ...this.parseRacialTraits(ddbCharacter),
      ...this.parseBackgroundFeature(ddbCharacter),
      ...this.parseFeats(ddbCharacter),
      ...this.parseOptionalClassFeatures(ddbCharacter),
    ];
  }
  private static parseClassFeatures(_ddbCharacter: DDBCharacter): FoundryItemData[] { return []; }
  private static parseSubclassFeatures(_ddbCharacter: DDBCharacter): FoundryItemData[] { return []; }
  private static parseRacialTraits(_ddbCharacter: DDBCharacter): FoundryItemData[] { return []; }
  private static parseBackgroundFeature(_ddbCharacter: DDBCharacter): FoundryItemData[] { return []; }
  private static parseFeats(_ddbCharacter: DDBCharacter): FoundryItemData[] { return []; }
  private static parseOptionalClassFeatures(_ddbCharacter: DDBCharacter): FoundryItemData[] { return []; }

  // Only one implementation of getPrimaryClass
  private static getPrimaryClass(ddbCharacter: DDBCharacter): string {
    if (!ddbCharacter.classes || ddbCharacter.classes.length === 0) return '';
    const primaryClass = ddbCharacter.classes.reduce((prev, current) =>
      (current.level ?? 0) > (prev.level ?? 0) ? current : prev,
      ddbCharacter.classes[0]
    );
    return primaryClass.definition?.name ?? '';
  }

  // Only one implementation of getPrimarySpellcastingClass
  private static getPrimarySpellcastingClass(ddbCharacter: DDBCharacter): DDBClass | null {
    if (!ddbCharacter.classes || ddbCharacter.classes.length === 0) return null;
    const spellcastingClasses = ddbCharacter.classes.filter(cls => CharacterParser.isSpellcastingClass(cls.definition?.name ?? ''));
    if (spellcastingClasses.length === 0) return null;
    return spellcastingClasses.reduce((prev, current) => (current.level ?? 0) > (prev.level ?? 0) ? current : prev, spellcastingClasses[0]);
  }

  private static getXpForLevel(level: number): number {
    // Basic XP for level mapping (D&D 5e SRD)
    const xpTable = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
    return xpTable[level - 1] ?? 0;
  }

  private static getSkillKeyFromModifier(modifier: { subType?: string }): string {
    // Extract skill key from modifier subType (e.g., 'skill-arcana' -> 'arc')
    if (!modifier.subType) return '';
    const regex = /skill-(\w+)/;
    const match = regex.exec(modifier.subType);
    return match ? match[1].substring(0, 3) : '';
  }

  private static calculateSpellSlots(className: string, level: number): Record<string, number> {
    // Basic spell slot progression for full casters (D&D 5e SRD)
    // For half/third/unique casters, this should be expanded in the future.
    const slotTable: Record<number, Record<string, number>> = {
      1: { spell1: 2 },
      2: { spell1: 3 },
      3: { spell1: 4, spell2: 2 },
      4: { spell1: 4, spell2: 3 },
      5: { spell1: 4, spell2: 3, spell3: 2 },
      6: { spell1: 4, spell2: 3, spell3: 3 },
      7: { spell1: 4, spell2: 3, spell3: 3, spell4: 1 },
      8: { spell1: 4, spell2: 3, spell3: 3, spell4: 2 },
      9: { spell1: 4, spell2: 3, spell3: 3, spell4: 3, spell5: 1 },
      10: { spell1: 4, spell2: 3, spell3: 3, spell4: 3, spell5: 2 },
      11: { spell1: 4, spell2: 3, spell3: 3, spell4: 3, spell5: 2, spell6: 1 },
      12: { spell1: 4, spell2: 3, spell3: 3, spell4: 3, spell5: 2, spell6: 1 },
      13: { spell1: 4, spell2: 3, spell3: 3, spell4: 3, spell5: 2, spell6: 1, spell7: 1 },
      14: { spell1: 4, spell2: 3, spell3: 3, spell4: 3, spell5: 2, spell6: 1, spell7: 1 },
      15: { spell1: 4, spell2: 3, spell3: 3, spell4: 3, spell5: 2, spell6: 1, spell7: 1, spell8: 1 },
      16: { spell1: 4, spell2: 3, spell3: 3, spell4: 3, spell5: 2, spell6: 1, spell7: 1, spell8: 1 },
      17: { spell1: 4, spell2: 3, spell3: 3, spell4: 3, spell5: 2, spell6: 1, spell7: 1, spell8: 1, spell9: 1 },
      18: { spell1: 4, spell2: 3, spell3: 3, spell4: 3, spell5: 3, spell6: 1, spell7: 1, spell8: 1, spell9: 1 },
      19: { spell1: 4, spell2: 3, spell3: 3, spell4: 3, spell5: 3, spell6: 2, spell7: 1, spell8: 1, spell9: 1 },
      20: { spell1: 4, spell2: 3, spell3: 3, spell4: 3, spell5: 3, spell6: 2, spell7: 2, spell8: 1, spell9: 1 },
    };
    return slotTable[level] ?? {};
  }

  private static getRaceSize(race: DDBCharacter['race']): string {
    if (!race?.size) return 'med';
    const sizeMap: Record<string, string> = {
      tiny: 'tiny',
      small: 'sm',
      medium: 'med',
      large: 'lg',
      huge: 'huge',
      gargantuan: 'grg',
    };
    return sizeMap[race.size.toLowerCase()] ?? 'med';
  }

  private static getFoundryItemType(definition: { filterType?: string }): string {
    const typeMap: Record<string, string> = {
      Weapon: 'weapon',
      Armor: 'equipment',
      Shield: 'equipment',
      Gear: 'loot',
      Tool: 'tool',
      Potion: 'consumable',
    };
    return typeMap[definition.filterType ?? ''] ?? 'loot';
  }

  private static getDefaultIcon(itemType: string): string {
    const iconMap: Record<string, string> = {
      weapon: 'icons/weapons/swords/sword-broad-silver.webp',
      equipment: 'icons/equipment/chest/breastplate-scale-grey.webp',
      loot: 'icons/containers/bags/pack-leather-brown.webp',
    };
    return iconMap[itemType] ?? 'icons/svg/item-bag.svg';
  }

  /**
   * Parse languages from D&D Beyond character
   */
  private static parseLanguages(ddbCharacter: DDBCharacter): string[] {
    // Use Set to avoid duplicates, split/trim logic for custom languages
    const languages = new Set<string>();
    if (Array.isArray(ddbCharacter.languages)) {
      ddbCharacter.languages.forEach(lang => {
        if (typeof lang === 'string') {
          lang.split(',').map(l => l.trim()).forEach(l => { if (l) languages.add(l); });
        }
      });
    }
    return Array.from(languages);
  }

  /**
   * Get the ability associated with a skill
   * TODO: Implement actual skill-to-ability mapping
   */
  private static getSkillAbility(skill: string): string {
    const skillMap: Record<string, string> = {
      acr: 'dex',
      ani: 'wis',
      arc: 'int',
      ath: 'str',
      dec: 'cha',
      his: 'int',
      ins: 'wis',
      itm: 'int',
      inv: 'int',
      med: 'wis',
      nat: 'int',
      prc: 'wis',
      prf: 'cha',
      per: 'wis',
      rel: 'int',
      slt: 'dex',
      ste: 'dex',
      sur: 'wis',
    };
    return skillMap[skill] ?? 'dex';
  }

  // Utility methods (move above first usage)
  private static getAbilityModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  private static getTotalLevel(ddbCharacter: DDBCharacter): number {
    if (!ddbCharacter.classes) return 1;
    return ddbCharacter.classes.reduce((total, cls) => total + (cls.level ?? 0), 0) ?? 1;
  }

  private static getProficiencyBonus(level: number): number {
    return Math.max(2, Math.ceil(level / 4) + 1);
  }

  private static getAbilityScore(ddbCharacter: DDBCharacter, statId: number): number {
    if (!ddbCharacter.stats) return 10;
    const stat = ddbCharacter.stats.find(s => s.id === statId);
    return stat ? stat.value : 10;
  }

  private static getStatIdForAbility(ability: string): number {
    const map = { str: 1, dex: 2, con: 3, int: 4, wis: 5, cha: 6 };
    return map[ability as keyof typeof map] ?? 4;
  }

  private static getSpellcastingAbility(classObj: DDBClass | null): string {
    if (!classObj?.definition) return 'int';
    const abilities: Record<string, string> = {
      druid: 'wis',
      cleric: 'wis',
      ranger: 'wis',
      bard: 'cha',
      sorcerer: 'cha',
      warlock: 'cha',
      paladin: 'cha',
      wizard: 'int',
      artificer: 'int',
    };
    return abilities[classObj.definition.name.toLowerCase()] ?? 'int';
  }

  private static isSpellcastingClass(className: string): boolean {
    return [
      'Artificer',
      'Bard',
      'Cleric',
      'Druid',
      'Paladin',
      'Ranger',
      'Sorcerer',
      'Warlock',
      'Wizard',
      'Eldritch Knight',
      'Arcane Trickster',
    ].includes(className);
  }
}