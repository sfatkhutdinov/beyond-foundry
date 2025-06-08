#!/usr/bin/env node

/**
 * Test Current Schema Output
 * 
 * This script tests our current CharacterParser with the real character data
 * and saves the output as 147565858_schema_we_pulling.json to see the structure
 * we're currently generating.
 */

import fs from 'fs';
import path from 'path';

/**
 * Mock Foundry logger for testing
 */
class Logger {
  static info(message) { console.log(`ℹ️  ${message}`); }
  static debug(message) { console.log(`🔍 ${message}`); }
  static warn(message) { console.log(`⚠️  ${message}`); }
  static error(message) { console.log(`❌ ${message}`); }
}

// Make logger globally available
global.Logger = Logger;

/**
 * Simplified CharacterParser based on our current implementation
 * This represents what we're currently pulling from the character data
 */
class CurrentCharacterParser {
  /**
   * Parse a D&D Beyond character into FoundryVTT actor data
   */
  static parseCharacter(ddbCharacter) {
    Logger.info(`Parsing character: ${ddbCharacter.name}`);

    // Build the base actor data structure for D&D 5e system
    const actorData = {
      name: ddbCharacter.name,
      type: 'character',
      img: ddbCharacter.decorations?.avatarUrl || 'icons/svg/mystery-man.svg',
      system: {
        abilities: this.parseAbilities(ddbCharacter),
        attributes: this.parseAttributes(ddbCharacter),
        details: this.parseDetails(ddbCharacter),
        traits: this.parseTraits(ddbCharacter),
        currency: this.parseCurrency(ddbCharacter),
        skills: this.parseSkills(ddbCharacter),
        spells: this.parseSpells(ddbCharacter),
        resources: this.parseResources(ddbCharacter)
      },
      items: [], // Will be populated with equipment, spells, features, etc.
      effects: [], // Active effects will be added later
      flags: {
        'beyond-foundry': {
          ddbCharacterId: ddbCharacter.id,
          lastSync: Date.now(),
          originalData: ddbCharacter // Store for reference
        }
      }
    };

    Logger.debug(`Parsed character data for: ${actorData.name}`);
    return actorData;
  }

  /**
   * Parse ability scores from D&D Beyond format
   */
  static parseAbilities(ddbCharacter) {
    const abilities = {};
    const abilityMap = {
      1: 'str',  // Strength
      2: 'dex',  // Dexterity  
      3: 'con',  // Constitution
      4: 'int',  // Intelligence
      5: 'wis',  // Wisdom
      6: 'cha'   // Charisma
    };

    // Initialize all abilities with default structure
    Object.values(abilityMap).forEach(key => {
      abilities[key] = {
        value: 10,
        proficient: 0,
        bonuses: {
          check: '',
          save: ''
        }
      };
    });

    // Apply D&D Beyond stats
    if (ddbCharacter.stats && Array.isArray(ddbCharacter.stats)) {
      ddbCharacter.stats.forEach(stat => {
        const abilityKey = abilityMap[stat.id];
        if (abilityKey) {
          abilities[abilityKey].value = stat.value || 10;
        }
      });
    }

    return abilities;
  }

  /**
   * Parse character attributes
   */
  static parseAttributes(ddbCharacter) {
    const totalLevel = this.getTotalLevel(ddbCharacter);
    const constitutionMod = Math.floor((this.getAbilityScore(ddbCharacter, 3) - 10) / 2);
    
    // Enhanced HP calculation
    const baseHP = ddbCharacter.baseHitPoints || 0;
    const bonusHP = ddbCharacter.bonusHitPoints || 0;
    const overrideHP = ddbCharacter.overrideHitPoints;
    const removedHP = ddbCharacter.removedHitPoints || 0;
    
    let maxHP;
    if (overrideHP !== null && overrideHP !== undefined) {
      maxHP = overrideHP;
    } else {
      maxHP = baseHP + (constitutionMod * totalLevel) + bonusHP;
    }
    
    const currentHP = Math.max(0, maxHP - removedHP);

    return {
      ac: { flat: null, calc: 'default', formula: '' },
      hp: { 
        value: currentHP, 
        max: maxHP, 
        temp: ddbCharacter.temporaryHitPoints || 0, 
        tempmax: 0 
      },
      init: { ability: 'dex', bonus: 0 },
      movement: { walk: 30, burrow: 0, climb: 0, fly: 0, swim: 0, units: 'ft', hover: false },
      senses: { darkvision: 0, blindsight: 0, tremorsense: 0, truesight: 0, units: 'ft', special: '' },
      spellcasting: this.getSpellcastingAbility(ddbCharacter),
      prof: Math.max(2, Math.ceil(totalLevel / 4) + 1),
      spelldc: 8 + Math.max(2, Math.ceil(totalLevel / 4) + 1) + this.getSpellcastingModifier(ddbCharacter)
    };
  }

  /**
   * Parse character details
   */
  static parseDetails(ddbCharacter) {
    const totalLevel = this.getTotalLevel(ddbCharacter);
    
    return {
      biography: { value: '', public: '' },
      alignment: '',
      race: ddbCharacter.race?.fullName || '',
      background: ddbCharacter.background?.definition?.name || '',
      originalClass: this.getPrimaryClass(ddbCharacter),
      xp: { 
        value: ddbCharacter.currentXp || 0, 
        max: this.getXpForLevel(totalLevel + 1), 
        pct: 0 
      },
      level: totalLevel
    };
  }

  /**
   * Parse character traits
   */
  static parseTraits(ddbCharacter) {
    return {
      size: 'med',
      di: { value: [], custom: '' }, // Damage immunities
      dr: { value: [], custom: '' }, // Damage resistances
      dv: { value: [], custom: '' }, // Damage vulnerabilities
      ci: { value: [], custom: '' }, // Condition immunities
      languages: { value: this.parseLanguages(ddbCharacter), custom: '' },
      weaponProf: { value: [], custom: '' },
      armorProf: { value: [], custom: '' },
      toolProf: { value: [], custom: '' }
    };
  }

  /**
   * Parse languages
   */
  static parseLanguages(ddbCharacter) {
    const languages = [];
    
    // Check race languages
    if (ddbCharacter.race?.racialTraits) {
      ddbCharacter.race.racialTraits.forEach(trait => {
        if (trait.definition?.name?.toLowerCase().includes('language')) {
          // Extract common language names
          const langMatch = trait.definition.description?.match(/\b(Common|Elvish|Dwarvish|Halfling|Draconic|Giant|Gnomish|Goblin|Orcish)\b/gi);
          if (langMatch) {
            languages.push(...langMatch.map(lang => lang.toLowerCase()));
          }
        }
      });
    }
    
    return [...new Set(languages)]; // Remove duplicates
  }

  /**
   * Parse currency
   */
  static parseCurrency(ddbCharacter) {
    return {
      cp: ddbCharacter.currencies?.cp || 0,
      sp: ddbCharacter.currencies?.sp || 0,
      ep: ddbCharacter.currencies?.ep || 0,
      gp: ddbCharacter.currencies?.gp || 0,
      pp: ddbCharacter.currencies?.pp || 0
    };
  }

  /**
   * Parse skills
   */
  static parseSkills(ddbCharacter) {
    const skills = {};
    // Initialize all D&D 5e skills
    const skillList = [
      'acr', 'ani', 'arc', 'ath', 'dec', 'his', 'ins', 'inti', 'inv', 'med',
      'nat', 'per', 'prf', 'rel', 'slt', 'ste', 'sur'
    ];
    
    const abilityMap = {
      'acr': 'dex', 'ani': 'wis', 'arc': 'int', 'ath': 'str', 'dec': 'cha',
      'his': 'int', 'ins': 'wis', 'inti': 'cha', 'inv': 'int', 'med': 'wis',
      'nat': 'int', 'per': 'wis', 'prf': 'cha', 'rel': 'int', 'slt': 'dex',
      'ste': 'dex', 'sur': 'wis'
    };
    
    skillList.forEach(skill => {
      skills[skill] = { 
        value: 0, 
        ability: abilityMap[skill] || 'int', 
        bonuses: { check: '', passive: '' }
      };
    });

    return skills;
  }

  /**
   * Parse spells
   */
  static parseSpells(ddbCharacter) {
    return {
      spell1: { value: 0, override: null, max: 0 },
      spell2: { value: 0, override: null, max: 0 },
      spell3: { value: 0, override: null, max: 0 },
      spell4: { value: 0, override: null, max: 0 },
      spell5: { value: 0, override: null, max: 0 },
      spell6: { value: 0, override: null, max: 0 },
      spell7: { value: 0, override: null, max: 0 },
      spell8: { value: 0, override: null, max: 0 },
      spell9: { value: 0, override: null, max: 0 },
      pact: { value: 0, override: null, max: 0, level: 1 }
    };
  }

  /**
   * Parse resources
   */
  static parseResources(ddbCharacter) {
    return {
      primary: { value: 0, max: 0, sr: false, lr: false, label: '' },
      secondary: { value: 0, max: 0, sr: false, lr: false, label: '' },
      tertiary: { value: 0, max: 0, sr: false, lr: false, label: '' }
    };
  }

  /**
   * Helper methods
   */
  static getTotalLevel(ddbCharacter) {
    if (!ddbCharacter.classes || !Array.isArray(ddbCharacter.classes)) {
      return 1;
    }
    return ddbCharacter.classes.reduce((total, cls) => total + (cls.level || 0), 0) || 1;
  }

  static getPrimaryClass(ddbCharacter) {
    if (!ddbCharacter.classes || !Array.isArray(ddbCharacter.classes) || ddbCharacter.classes.length === 0) {
      return '';
    }
    
    // Return the class with the highest level
    const primaryClass = ddbCharacter.classes.reduce((prev, current) => 
      (current.level || 0) > (prev.level || 0) ? current : prev
    );
    
    return primaryClass.definition?.name || '';
  }

  static getAbilityScore(ddbCharacter, statId) {
    if (!ddbCharacter.stats) return 10;
    const stat = ddbCharacter.stats.find(s => s.id === statId);
    return stat ? stat.value : 10;
  }

  static getSpellcastingAbility(ddbCharacter) {
    // Simple logic - Wizards use INT, Clerics/Druids use WIS, others use CHA
    const primaryClass = this.getPrimaryClass(ddbCharacter).toLowerCase();
    if (primaryClass.includes('wizard') || primaryClass.includes('artificer')) return 'int';
    if (primaryClass.includes('cleric') || primaryClass.includes('druid') || primaryClass.includes('ranger')) return 'wis';
    return 'cha'; // Default for most other casters
  }

  static getSpellcastingModifier(ddbCharacter) {
    const ability = this.getSpellcastingAbility(ddbCharacter);
    const statId = { 'str': 1, 'dex': 2, 'con': 3, 'int': 4, 'wis': 5, 'cha': 6 }[ability] || 6;
    const score = this.getAbilityScore(ddbCharacter, statId);
    return Math.floor((score - 10) / 2);
  }

  static getXpForLevel(level) {
    const xpTable = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
    return xpTable[Math.min(level - 1, xpTable.length - 1)] || 355000;
  }
}

/**
 * Test the current parser with our character data
 */
async function testCurrentSchema() {
  console.log('🧪 Testing Current Schema Output\n');

  // Load the character data
  const characterPath = path.join(process.cwd(), 'tests', '147565858.json');
  
  if (!fs.existsSync(characterPath)) {
    console.error('❌ Character data file not found: 147565858.json');
    console.log('💡 Make sure you run this from the tests directory');
    return;
  }

  console.log('📥 Loading character data...');
  const ddbCharacter = JSON.parse(fs.readFileSync(characterPath, 'utf8'));
  console.log(`✅ Loaded character: ${ddbCharacter.name}`);

  // Parse character with current parser
  console.log('\n⚙️ Parsing character with current parser...');
  let foundryActor;
  try {
    foundryActor = CurrentCharacterParser.parseCharacter(ddbCharacter);
    console.log(`✅ Character parsed successfully: ${foundryActor.name}`);
  } catch (error) {
    console.error(`❌ Parser error: ${error.message}`);
    console.error(error.stack);
    return;
  }

  // Display results
  console.log('\n📊 Current Schema Results:');
  console.log(`   Name: ${foundryActor.name}`);
  console.log(`   Type: ${foundryActor.type}`);
  console.log(`   Race: ${foundryActor.system.details.race}`);
  console.log(`   Class: ${foundryActor.system.details.originalClass}`);
  console.log(`   Level: ${foundryActor.system.details.level}`);
  
  console.log('\n📊 Abilities:');
  Object.entries(foundryActor.system.abilities).forEach(([key, ability]) => {
    console.log(`   ${key.toUpperCase()}: ${ability.value}`);
  });

  console.log(`\n📊 Attributes:`);
  console.log(`   HP: ${foundryActor.system.attributes.hp.value}/${foundryActor.system.attributes.hp.max}`);
  console.log(`   Temp HP: ${foundryActor.system.attributes.hp.temp}`);
  console.log(`   Proficiency: +${foundryActor.system.attributes.prof}`);
  console.log(`   Spell DC: ${foundryActor.system.attributes.spelldc}`);
  console.log(`   Spellcasting: ${foundryActor.system.attributes.spellcasting.toUpperCase()}`);

  console.log(`\n📊 Details:`);
  console.log(`   Background: ${foundryActor.system.details.background}`);
  console.log(`   XP: ${foundryActor.system.details.xp.value}/${foundryActor.system.details.xp.max}`);

  console.log(`\n📊 Languages:`);
  const languages = foundryActor.system.traits.languages.value;
  if (languages.length > 0) {
    languages.forEach(lang => console.log(`   ✓ ${lang}`));
  } else {
    console.log('   No languages detected');
  }

  console.log(`\n📊 Currency:`);
  const currency = foundryActor.system.currency;
  const coins = [];
  if (currency.pp > 0) coins.push(`${currency.pp}pp`);
  if (currency.gp > 0) coins.push(`${currency.gp}gp`);
  if (currency.ep > 0) coins.push(`${currency.ep}ep`);
  if (currency.sp > 0) coins.push(`${currency.sp}sp`);
  if (currency.cp > 0) coins.push(`${currency.cp}cp`);
  console.log(`   ${coins.length > 0 ? coins.join(', ') : 'No currency'}`);

  // Save the schema we're pulling
  console.log('\n💾 Saving current schema output...');
  const outputFile = '147565858_schema_we_pulling.json';
  
  const schemaOutput = {
    metadata: {
      characterName: foundryActor.name,
      characterId: ddbCharacter.id,
      generatedAt: new Date().toISOString(),
      description: 'Current schema structure that Beyond Foundry is pulling from D&D Beyond character data',
      parserVersion: 'current-implementation'
    },
    foundryActor: foundryActor,
    rawDdbData: {
      // Include key portions of the raw data for reference
      id: ddbCharacter.id,
      name: ddbCharacter.name,
      race: ddbCharacter.race,
      classes: ddbCharacter.classes,
      stats: ddbCharacter.stats,
      background: ddbCharacter.background,
      currencies: ddbCharacter.currencies,
      baseHitPoints: ddbCharacter.baseHitPoints,
      bonusHitPoints: ddbCharacter.bonusHitPoints,
      overrideHitPoints: ddbCharacter.overrideHitPoints,
      removedHitPoints: ddbCharacter.removedHitPoints,
      temporaryHitPoints: ddbCharacter.temporaryHitPoints,
      currentXp: ddbCharacter.currentXp
    }
  };

  fs.writeFileSync(outputFile, JSON.stringify(schemaOutput, null, 2));
  console.log(`✅ Schema saved to: ${outputFile}`);

  // Generate summary report
  console.log('\n📋 Schema Summary:');
  console.log(`   ✅ Actor Name: ${foundryActor.name}`);
  console.log(`   ✅ Actor Type: ${foundryActor.type}`);
  console.log(`   ✅ System Properties: ${Object.keys(foundryActor.system).length}`);
  console.log(`   ✅ Abilities: ${Object.keys(foundryActor.system.abilities).length}/6`);
  console.log(`   ✅ Skills: ${Object.keys(foundryActor.system.skills).length}`);
  console.log(`   ✅ Spell Levels: ${Object.keys(foundryActor.system.spells).length}`);
  console.log(`   ✅ Items: ${foundryActor.items.length}`);
  console.log(`   ✅ Effects: ${foundryActor.effects.length}`);
  console.log(`   ✅ Flags: ${Object.keys(foundryActor.flags).length}`);

  return {
    success: true,
    actor: foundryActor,
    character: ddbCharacter,
    outputFile: outputFile
  };
}

// Main execution
testCurrentSchema().catch(error => {
  console.error(`Test failed: ${error.message}`);
  process.exit(1);
});
