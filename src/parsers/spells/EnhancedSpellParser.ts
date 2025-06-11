/**
 * Enhanced Spell Parser Implementation
 * 
 * This parser extends the base SpellParser to leverage FoundryVTT D&D 5e's 
 * modern Activity System for full spell automation.
 */

import { Logger } from '../../module/utils/logger.js';
import type { 
  DDBSpell, 
  FoundrySpell, 
  SpellParsingOptions, 
  FoundryActivity 
} from '../../types/index.js';

// Import the existing SpellParser for base functionality
import { SpellParser } from './SpellParser.js';

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
      return SpellParser.parseSpell(ddbSpell, options);
    }

    Logger.debug(`📜 Enhanced parsing spell with activities: ${definition.name} (Level ${definition.level})`);

    // Start with base spell parsing
    const foundrySpell = SpellParser.parseSpell(ddbSpell, options);

    // Add enhanced activities
    foundrySpell.system.activities = this.generateActivities(definition);

    return foundrySpell;
  }

  /**
   * Generate Activities based on spell mechanics
   */
  private static generateActivities(definition: Record<string, unknown>): Record<string, FoundryActivity> {
    const activities: Record<string, FoundryActivity> = {};
    let sortIndex = 0;

    // Attack spell (e.g., Fire Bolt, Eldritch Blast, Spiritual Weapon)
    if (definition.requiresAttackRoll || definition.attackType) {
      const attackActivity = this.generateAttackActivity(definition, sortIndex++);
      activities[attackActivity._id] = attackActivity;
      Logger.debug(`Generated attack activity for ${String(definition.name)}`);
    }

    // Save spell (e.g., Fireball, Hold Person, Counterspell)
    if (definition.requiresSavingThrow || definition.saveDcAbilityId) {
      const saveActivity = this.generateSaveActivity(definition, sortIndex++);
      activities[saveActivity._id] = saveActivity;
      Logger.debug(`Generated save activity for ${String(definition.name)}`);
    }

    // Healing spell (e.g., Cure Wounds, Healing Word)
    if (definition.healing || (Array.isArray(definition.healingDice) && definition.healingDice.length > 0)) {
      const healActivity = this.generateHealingActivity(definition, sortIndex++);
      activities[healActivity._id] = healActivity;
      Logger.debug(`Generated healing activity for ${String(definition.name)}`);
    }

    // Utility spell (e.g., most other spells without attacks/saves)
    if (!definition.requiresAttackRoll && !definition.requiresSavingThrow && !definition.healing && !definition.attackType && !definition.saveDcAbilityId) {
      const utilityActivity = this.generateUtilityActivity(definition, sortIndex++);
      activities[utilityActivity._id] = utilityActivity;
      Logger.debug(`Generated utility activity for ${String(definition.name)}`);
    }

    return activities;
  }

  /**
   * Generate attack activity for spell attacks
   */
  private static generateAttackActivity(definition: Record<string, unknown>, sort: number): FoundryActivity {
    const spellName = String(definition.name ?? 'spell');
    const activityId = `${spellName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-attack`;
    
    return {
      _id: activityId,
      type: 'attack',
      name: `${spellName} Attack`,
      sort: sort * 100000,
      activation: {
        type: 'action',
        value: 1,
        condition: ''
      },
      consumption: {
        targets: [],
        scaling: {
          allowed: false,
          max: ''
        }
      },
      description: {
        chatFlavor: ''
      },
      duration: {
        value: '',
        units: 'inst',
        special: '',
        override: false
      },
      effects: [],
      range: {
        value: this.parseRange(definition).value || '120',
        units: this.parseRange(definition).units || 'ft',
        special: '',
        override: false
      },
      target: {
        template: {
          count: '',
          contiguous: false,
          type: '',
          size: '',
          width: '',
          height: '',
          units: ''
        },
        affects: {
          count: '1',
          type: 'creature',
          choice: false,
          special: ''
        },
        override: false
      },
      uses: {
        spent: 0,
        max: '',
        recovery: []
      },
      attack: {
        ability: '',
        bonus: '',
        critical: { threshold: null },
        flat: false,
        type: {
          value: Number(definition.attackType) === 1 ? 'melee' : 'ranged',
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
  private static generateSaveActivity(definition: Record<string, unknown>, sort: number): FoundryActivity {
    const activityId = `${String(definition.name || 'spell').toLowerCase().replace(/[^a-z0-9]/g, '-')}-save`;
    
    return {
      _id: activityId,
      type: 'save',
      name: `${definition.name} Save`,
      sort: sort * 100000,
      activation: {
        type: 'action',
        value: 1,
        condition: ''
      },
      consumption: {
        targets: [],
        scaling: {
          allowed: false,
          max: ''
        }
      },
      description: {
        chatFlavor: ''
      },
      duration: {
        value: '',
        units: 'inst',
        special: '',
        override: false
      },
      effects: [],
      range: {
        value: this.parseRange(definition).value || '60',
        units: this.parseRange(definition).units || 'ft',
        special: '',
        override: false
      },
      target: {
        template: {
          count: '',
          contiguous: false,
          type: '',
          size: '',
          width: '',
          height: '',
          units: ''
        },
        affects: {
          count: '1',
          type: 'creature',
          choice: false,
          special: ''
        },
        override: false
      },
      uses: {
        spent: 0,
        max: '',
        recovery: []
      },
      save: {
        ability: new Set([this.mapSaveAbility(definition.saveDcAbilityId as number)]),
        dc: {
          calculation: 'spellcasting',
          formula: ''
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
   * Generate healing activity for healing spells
   */
  private static generateHealingActivity(definition: Record<string, unknown>, sort: number): FoundryActivity {
    const activityId = `${String(definition.name || 'spell').toLowerCase().replace(/[^a-z0-9]/g, '-')}-heal`;
    
    return {
      _id: activityId,
      type: 'heal',
      name: `${definition.name} Healing`,
      sort: sort * 100000,
      activation: {
        type: 'action',
        value: 1,
        condition: ''
      },
      consumption: {
        targets: [],
        scaling: {
          allowed: false,
          max: ''
        }
      },
      description: {
        chatFlavor: ''
      },
      duration: {
        value: '',
        units: 'inst',
        special: '',
        override: false
      },
      effects: [],
      range: {
        value: this.parseRange(definition).value || 'touch',
        units: this.parseRange(definition).units || '',
        special: '',
        override: false
      },
      target: {
        template: {
          count: '',
          contiguous: false,
          type: '',
          size: '',
          width: '',
          height: '',
          units: ''
        },
        affects: {
          count: '1',
          type: 'creature',
          choice: false,
          special: ''
        },
        override: false
      },
      uses: {
        spent: 0,
        max: '',
        recovery: []
      },
      healing: {
        custom: {
          formula: this.parseHealingFormula(definition),
          enabled: true
        },
        scaling: {
          mode: 'level',
          formula: this.extractScalingFormula(definition)
        }
      }
    };
  }

  /**
   * Generate utility activity for non-combat spells
   */
  private static generateUtilityActivity(definition: Record<string, unknown>, sort: number): FoundryActivity {
    const activityId = `${String(definition.name || 'spell').toLowerCase().replace(/[^a-z0-9]/g, '-')}-utility`;
    
    return {
      _id: activityId,
      type: 'utility',
      name: `${definition.name}`,
      sort: sort * 100000,
      activation: {
        type: 'action',
        value: 1,
        condition: ''
      },
      consumption: {
        targets: [],
        scaling: {
          allowed: false,
          max: ''
        }
      },
      description: {
        chatFlavor: ''
      },
      duration: {
        value: '',
        units: 'inst',
        special: '',
        override: false
      },
      effects: [],
      range: {
        value: this.parseRange(definition).value || '',
        units: this.parseRange(definition).units || '',
        special: '',
        override: false
      },
      target: {
        template: {
          count: '',
          contiguous: false,
          type: '',
          size: '',
          width: '',
          height: '',
          units: ''
        },
        affects: {
          count: '1',
          type: 'creature',
          choice: false,
          special: ''
        },
        override: false
      },
      uses: {
        spent: 0,
        max: '',
        recovery: []
      }
    };
  }

  /**
   * Parse damage parts from spell definition
   */
  private static parseDamageParts(definition: Record<string, unknown>): Array<{
    formula: string;
    types: Set<string>;
    scaling?: {
      mode: 'level' | 'none';
      formula: string;
    };
  }> {
    const parts: Array<{
      formula: string;
      types: Set<string>;
      scaling?: {
        mode: 'level' | 'none';
        formula: string;
      };
    }> = [];

    // Parse from damage dice array
    if (Array.isArray(definition.damageDice)) {
      for (const damage of definition.damageDice) {
        if (typeof damage === 'object' && damage !== null) {
          const damageObj = damage as Record<string, unknown>;
          const diceCount = Number(damageObj.diceCount) || 1;
          const diceValue = Number(damageObj.diceValue) || 6;
          const fixedValue = Number(damageObj.fixedValue) || 0;
          const damageTypeId = Number(damageObj.damageTypeId) || 0;
          
          let formula = '';
          if (diceCount && diceValue) {
            formula = `${diceCount}d${diceValue}`;
            if (fixedValue > 0) {
              formula += ` + ${fixedValue}`;
            }
          } else if (fixedValue > 0) {
            formula = String(fixedValue);
          }

          if (formula) {
            parts.push({
              formula,
              types: new Set([this.mapDamageType(damageTypeId)]),
              scaling: {
                mode: 'level',
                formula: this.extractScalingFormula(definition)
              }
            });
          }
        }
      }
    }

    // Fallback: extract from description if no damage dice
    if (parts.length === 0) {
      const descriptionDamage = this.extractDamageFromDescription(String(definition.description || ''));
      if (descriptionDamage) {
        parts.push({
          formula: descriptionDamage.formula,
          types: descriptionDamage.types,
          scaling: {
            mode: 'level',
            formula: this.extractScalingFormula(definition)
          }
        });
      }
    }

    return parts;
  }

  /**
   * Map D&D Beyond damage type ID to FoundryVTT damage type
   */
  private static mapDamageType(subType: number): string {
    const damageTypeMap: Record<number, string> = {
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

  /**
   * Extract damage information from spell description text
   */
  private static extractDamageFromDescription(description: string): { formula: string; types: Set<string> } | null {
    // Common damage patterns in spell descriptions
    const damagePatterns = [
      /(\d+d\d+(?:\s*\+\s*\d+)?)\s+(\w+)\s+damage/gi,
      /(\d+)\s+(\w+)\s+damage/gi
    ];

    for (const pattern of damagePatterns) {
      const match = pattern.exec(description);
      if (match) {
        return {
          formula: match[1],
          types: new Set([match[2].toLowerCase()])
        };
      }
    }

    return null;
  }

  /**
   * Extract scaling formula from spell definition
   */
  private static extractScalingFormula(definition: Record<string, unknown>): string {
    // Check for higher level scaling
    if (Array.isArray(definition.scaleType)) {
      for (const scale of definition.scaleType) {
        if (typeof scale === 'object' && scale !== null) {
          const scaleObj = scale as Record<string, unknown>;
          if (scaleObj.diceCount && scaleObj.diceValue) {
            return `${scaleObj.diceCount}d${scaleObj.diceValue}`;
          }
        }
      }
    }

    // Check for level scaling in higher level descriptions
    if (typeof definition.higherLevelDefinition === 'string') {
      const higherLevel = definition.higherLevelDefinition;
      const scaleMatch = /(\d+d\d+)/i.exec(higherLevel);
      if (scaleMatch) {
        return scaleMatch[1];
      }
    }

    return '';
  }

  /**
   * Parse healing formula from spell definition
   */
  private static parseHealingFormula(definition: Record<string, unknown>): string {
    if (Array.isArray(definition.healingDice)) {
      for (const heal of definition.healingDice) {
        if (typeof heal === 'object' && heal !== null) {
          const healObj = heal as Record<string, unknown>;
          const diceCount = Number(healObj.diceCount) || 0;
          const diceValue = Number(healObj.diceValue) || 0;
          const fixedValue = Number(healObj.fixedValue) || 0;
          
          if (diceCount && diceValue) {
            let formula = `${diceCount}d${diceValue}`;
            if (fixedValue > 0) {
              formula += ` + ${fixedValue}`;
            }
            return formula;
          } else if (fixedValue > 0) {
            return String(fixedValue);
          }
        }
      }
    }

    return '1d8';
  }

  /**
   * Map save ability ID to ability abbreviation
   */
  private static mapSaveAbility(abilityId: number): string {
    const abilityMap: Record<number, string> = {
      1: 'str',
      2: 'dex',
      3: 'con',
      4: 'int',
      5: 'wis',
      6: 'cha'
    };
    return abilityMap[abilityId] || 'dex';
  }

  /**
   * Parse range information from spell definition
   */
  private static parseRange(definition: Record<string, unknown>): { value: string; units: string } {
    // Extract range from spell definition
    if (typeof definition.range === 'object' && definition.range !== null) {
      const rangeObj = definition.range as Record<string, unknown>;
      const rangeValue = Number(rangeObj.range) || 0;
      const aoeSize = Number(rangeObj.aoeSize) || 0;
      
      if (rangeValue > 0) {
        return { value: String(rangeValue), units: 'ft' };
      } else if (aoeSize > 0) {
        return { value: String(aoeSize), units: 'ft' };
      }
    }

    // Handle specific range types
    if (Number(definition.rangeType) === 1) {
      return { value: 'self', units: '' };
    } else if (Number(definition.rangeType) === 2) {
      return { value: 'touch', units: '' };
    }

    return { value: '30', units: 'ft' };
  }
}
