#!/usr/bin/env node

/**
 * Standalone Parser Test for Beyond Foundry
 * 
 * This creates a simplified version of CharacterParser for testing
 * without needing to deal with ES module imports.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Configuration
const PROXY_ENDPOINT = 'http://localhost:3100';

/**
 * Mock Foundry logger for testing
 */
class Logger {
  static info(message) { console.log(`[INFO] ${message}`); }
  static warn(message) { console.log(`[WARN] ${message}`); }
  static error(message) { console.error(`[ERROR] ${message}`); }
  static debug(message) { console.log(`[DEBUG] ${message}`); }
}

/**
 * Simplified CharacterParser for testing (based on the TypeScript source)
 */
class CharacterParser {
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
    return {
      ac: { flat: null, calc: 'default', formula: '' },
      hp: { 
        value: ddbCharacter.baseHitPoints || 0, 
        max: ddbCharacter.baseHitPoints || 0, 
        temp: 0, 
        tempmax: 0 
      },
      init: { ability: 'dex', bonus: 0 },
      movement: {},
      senses: {},
      spellcasting: '',
      prof: Math.max(1, Math.ceil(this.getTotalLevel(ddbCharacter) / 4) + 1),
      spelldc: 10
    };
  }

  /**
   * Parse character details
   */
  static parseDetails(ddbCharacter) {
    return {
      biography: { value: '', public: '' },
      alignment: '',
      race: ddbCharacter.race?.fullName || '',
      background: ddbCharacter.background?.definition?.name || '',
      originalClass: this.getPrimaryClass(ddbCharacter),
      xp: { value: 0, max: 0, pct: 0 }
    };
  }

  /**
   * Parse character traits
   */
  static parseTraits(ddbCharacter) {
    return {
      size: 'med',
      di: { value: [], custom: '' },
      dr: { value: [], custom: '' },
      dv: { value: [], custom: '' },
      ci: { value: [], custom: '' },
      languages: { value: [], custom: '' }
    };
  }

  /**
   * Parse currency
   */
  static parseCurrency(ddbCharacter) {
    return {
      cp: 0, sp: 0, ep: 0, gp: 0, pp: 0
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
      'nat', 'per', 'prf', 'per', 'rel', 'slt', 'ste', 'sur'
    ];
    
    skillList.forEach(skill => {
      skills[skill] = { value: 0, ability: 'int', bonuses: { check: '', passive: '' }};
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
   * Get total character level
   */
  static getTotalLevel(ddbCharacter) {
    if (!ddbCharacter.classes || !Array.isArray(ddbCharacter.classes)) {
      return 1;
    }
    return ddbCharacter.classes.reduce((total, cls) => total + (cls.level || 0), 0) || 1;
  }

  /**
   * Get primary class name
   */
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
}

/**
 * Fetch character data from ddb-proxy
 */
async function fetchCharacterData(cobaltToken, characterId) {
  try {
    const response = await fetch(`${PROXY_ENDPOINT}/proxy/character`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cobalt: cobaltToken,
        betaKey: null,
        characterId: parseInt(characterId, 10)
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      return { success: true, character: data.ddb?.character };
    } else {
      return { success: false, error: data.message || 'Failed to retrieve character' };
    }
  } catch (error) {
    return { success: false, error: `Network error: ${error.message}` };
  }
}

/**
 * Test the CharacterParser with real data
 */
async function testCharacterParser(cobaltToken, characterId) {
  console.log('🧪 Testing CharacterParser (Standalone) with Real Data\n');

  // Step 1: Fetch character data
  console.log('📥 Fetching character data...');
  const result = await fetchCharacterData(cobaltToken, characterId);
  
  if (!result.success) {
    console.error(`❌ Failed to fetch character: ${result.error}`);
    return;
  }

  const ddbCharacter = result.character;
  console.log(`✅ Fetched character: ${ddbCharacter.name}`);

  // Step 2: Parse character
  console.log('\n⚙️ Parsing character data...');
  let foundryActor;
  try {
    foundryActor = CharacterParser.parseCharacter(ddbCharacter);
    console.log(`✅ Character parsed successfully: ${foundryActor.name}`);
  } catch (error) {
    console.error(`❌ Parser error: ${error.message}`);
    console.error(error.stack);
    return;
  }

  // Step 3: Display results
  console.log('\n📊 Parsing Results:');
  console.log(`   Name: ${foundryActor.name}`);
  console.log(`   Type: ${foundryActor.type}`);
  console.log(`   Race: ${foundryActor.system.details.race}`);
  console.log(`   Class: ${foundryActor.system.details.originalClass}`);
  console.log(`   Level: ${CharacterParser.getTotalLevel(ddbCharacter)}`);
  
  console.log('\n📊 Abilities:');
  Object.entries(foundryActor.system.abilities).forEach(([key, ability]) => {
    console.log(`   ${key.toUpperCase()}: ${ability.value}`);
  });

  console.log(`\n📊 Attributes:`);
  console.log(`   HP: ${foundryActor.system.attributes.hp.max}`);
  console.log(`   Proficiency: ${foundryActor.system.attributes.prof}`);

  // Step 4: Save results
  console.log('\n💾 Saving test results...');
  const outputDir = './parser-test-results';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save original DDB data
  fs.writeFileSync(
    path.join(outputDir, `ddb-character-${characterId}.json`), 
    JSON.stringify(ddbCharacter, null, 2)
  );

  // Save parsed actor
  fs.writeFileSync(
    path.join(outputDir, `foundry-actor-${characterId}.json`), 
    JSON.stringify(foundryActor, null, 2)
  );

  console.log(`📄 Results saved to ${outputDir}/`);
  
  return {
    success: true,
    actor: foundryActor,
    character: ddbCharacter
  };
}

// Main execution
const cobaltToken = process.argv[2];
const characterId = process.argv[3] || '147239148';

if (!cobaltToken) {
  console.log('❌ Usage: node test-parser-standalone.js <cobalt-token> [character-id]');
  console.log('\n📋 This script will:');
  console.log('   1. Fetch character data from D&D Beyond via ddb-proxy');
  console.log('   2. Parse it using a simplified CharacterParser');
  console.log('   3. Display parsing results');
  console.log('   4. Save results to files');
  console.log('\n💡 Get your cobalt token from D&D Beyond cookies');
  process.exit(1);
}

testCharacterParser(cobaltToken, characterId).catch(error => {
  console.error(`Test failed: ${error.message}`);
  process.exit(1);
});
