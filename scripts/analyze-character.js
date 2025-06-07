#!/usr/bin/env node

/**
 * Character Data Analysis Script for Beyond Foundry
 * 
 * This script fetches character data from D&D Beyond via ddb-proxy
 * and provides detailed analysis of the data structure to help improve
 * the CharacterParser implementation.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Configuration
const PROXY_ENDPOINT = 'http://localhost:3100';
const CHARACTER_ID = '147239148'; // Target character for analysis

/**
 * Logger with colors for better readability
 */
class Logger {
  static info(message) {
    console.log(`\x1b[32m[INFO]\x1b[0m ${message}`);
  }
  
  static warn(message) {
    console.log(`\x1b[33m[WARN]\x1b[0m ${message}`);
  }
  
  static error(message) {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`);
  }
  
  static debug(message) {
    console.log(`\x1b[36m[DEBUG]\x1b[0m ${message}`);
  }
  
  static section(title) {
    console.log(`\n\x1b[35m=== ${title} ===\x1b[0m`);
  }
}

/**
 * Deep object analysis utility
 */
class DataAnalyzer {
  /**
   * Analyze object structure and provide insights
   */
  static analyzeStructure(obj, path = '', depth = 0, maxDepth = 3) {
    if (depth > maxDepth) return;
    
    const indent = '  '.repeat(depth);
    
    if (Array.isArray(obj)) {
      console.log(`${indent}${path}: Array[${obj.length}]`);
      if (obj.length > 0) {
        console.log(`${indent}  Sample item:`);
        this.analyzeStructure(obj[0], `${path}[0]`, depth + 1, maxDepth);
      }
    } else if (obj && typeof obj === 'object') {
      console.log(`${indent}${path}: Object`);
      Object.keys(obj).slice(0, 10).forEach(key => { // Limit to first 10 keys
        this.analyzeStructure(obj[key], `${path}.${key}`, depth + 1, maxDepth);
      });
      if (Object.keys(obj).length > 10) {
        console.log(`${indent}  ... and ${Object.keys(obj).length - 10} more properties`);
      }
    } else {
      const value = typeof obj === 'string' && obj.length > 50 
        ? `"${obj.substring(0, 50)}..."` 
        : JSON.stringify(obj);
      console.log(`${indent}${path}: ${typeof obj} = ${value}`);
    }
  }

  /**
   * Extract key information for character parsing
   */
  static extractCharacterInsights(character) {
    const insights = {
      basic: {
        id: character.id,
        name: character.name,
        level: character.classes?.reduce((total, cls) => total + (cls.level || 0), 0) || 0,
        race: character.race?.fullName,
        classes: character.classes?.map(cls => `${cls.definition?.name} ${cls.level}`).join(', ')
      },
      abilities: {},
      skills: [],
      spells: {
        count: 0,
        levels: []
      },
      equipment: {
        count: 0,
        types: []
      },
      features: {
        count: 0,
        sources: []
      }
    };

    // Analyze abilities
    if (character.stats) {
      character.stats.forEach(stat => {
        const abilityNames = {1: 'STR', 2: 'DEX', 3: 'CON', 4: 'INT', 5: 'WIS', 6: 'CHA'};
        insights.abilities[abilityNames[stat.id]] = stat.value;
      });
    }

    // Analyze modifiers for skills
    if (character.modifiers) {
      insights.skills = [];
      // modifiers is an object with categories (race, class, background, etc.)
      Object.keys(character.modifiers).forEach(category => {
        if (Array.isArray(character.modifiers[category])) {
          const skillMods = character.modifiers[category]
            .filter(mod => mod.type === 'skill')
            .map(mod => ({
              type: mod.subType,
              value: mod.value,
              source: mod.componentName || category,
              category: category
            }));
          insights.skills.push(...skillMods);
        }
      });
    }

    // Analyze spells
    if (character.spells) {
      const allSpells = [];
      Object.keys(character.spells).forEach(category => {
        if (Array.isArray(character.spells[category])) {
          allSpells.push(...character.spells[category]);
        }
      });
      insights.spells.count = allSpells.length;
      insights.spells.levels = [...new Set(allSpells.map(spell => spell.definition?.level).filter(level => level !== undefined))];
    }

    // Analyze inventory
    if (character.inventory) {
      insights.equipment.count = character.inventory.length;
      insights.equipment.types = [...new Set(character.inventory.map(item => item.definition?.type))];
    }

    return insights;
  }
}

/**
 * Fetch character data from ddb-proxy
 */
async function fetchCharacterData(cobaltToken, characterId) {
  try {
    Logger.debug(`Fetching character ${characterId} from D&D Beyond via proxy...`);
    
    const response = await fetch(`${PROXY_ENDPOINT}/proxy/character`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cobalt: cobaltToken,
        betaKey: null,
        characterId: parseInt(characterId, 10)
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Character data is nested under ddb.character  
      const character = data.ddb?.character;
      if (character) {
        Logger.info(`✅ Character data retrieved: ${character.name || 'Unknown'}`);
        return {
          success: true,
          character: character
        };
      } else {
        Logger.error('❌ Character data not found in response');
        return {
          success: false,
          error: 'Character data not found in response'
        };
      }
    } else {
      Logger.error(`❌ Failed to retrieve character: ${data.message || 'Unknown error'}`);
      return {
        success: false,
        error: data.message || 'Failed to retrieve character'
      };
    }
  } catch (error) {
    Logger.error(`❌ Network error: ${error.message}`);
    return {
      success: false,
      error: `Network error: ${error.message}`
    };
  }
}

/**
 * Save analysis results to files
 */
async function saveAnalysisResults(character, insights) {
  const outputDir = './character-analysis';
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save raw character data
  const rawDataFile = path.join(outputDir, `character-${character.id}-raw.json`);
  fs.writeFileSync(rawDataFile, JSON.stringify(character, null, 2));
  Logger.info(`💾 Raw character data saved to: ${rawDataFile}`);

  // Save insights
  const insightsFile = path.join(outputDir, `character-${character.id}-insights.json`);
  fs.writeFileSync(insightsFile, JSON.stringify(insights, null, 2));
  Logger.info(`💾 Character insights saved to: ${insightsFile}`);

  // Save structure analysis
  const structureFile = path.join(outputDir, `character-${character.id}-structure.txt`);
  const originalLog = console.log;
  let structureOutput = '';
  console.log = (message) => { structureOutput += message + '\n'; };
  
  Logger.section('COMPLETE DATA STRUCTURE ANALYSIS');
  DataAnalyzer.analyzeStructure(character, 'character', 0, 4);
  
  console.log = originalLog;
  fs.writeFileSync(structureFile, structureOutput);
  Logger.info(`💾 Structure analysis saved to: ${structureFile}`);
}

/**
 * Main analysis function
 */
async function analyzeCharacter(cobaltToken, characterId = CHARACTER_ID) {
  Logger.section('D&D Beyond Character Data Analysis');
  Logger.info(`Target Character ID: ${characterId}`);
  Logger.info(`Using ddb-proxy at: ${PROXY_ENDPOINT}`);

  // Fetch character data
  const result = await fetchCharacterData(cobaltToken, characterId);
  
  if (!result.success) {
    Logger.error('Cannot proceed without character data');
    return;
  }

  const character = result.character;
  
  // Extract insights
  Logger.section('CHARACTER INSIGHTS');
  const insights = DataAnalyzer.extractCharacterInsights(character);
  
  console.log(`📊 Basic Information:`);
  console.log(`   Name: ${insights.basic.name}`);
  console.log(`   ID: ${insights.basic.id}`);
  console.log(`   Level: ${insights.basic.level}`);
  console.log(`   Race: ${insights.basic.race}`);
  console.log(`   Classes: ${insights.basic.classes}`);

  console.log(`\n📊 Ability Scores:`);
  Object.entries(insights.abilities).forEach(([ability, score]) => {
    console.log(`   ${ability}: ${score}`);
  });

  console.log(`\n📊 Content Summary:`);
  console.log(`   Skills: ${insights.skills.length} modifiers`);
  console.log(`   Spells: ${insights.spells.count} (levels: ${insights.spells.levels.join(', ')})`);
  console.log(`   Equipment: ${insights.equipment.count} items`);
  console.log(`   Features: ${insights.features.count} features`);

  // Analyze structure
  Logger.section('DATA STRUCTURE PREVIEW');
  DataAnalyzer.analyzeStructure(character, 'character', 0, 2);

  // Save results
  Logger.section('SAVING ANALYSIS RESULTS');
  await saveAnalysisResults(character, insights);

  // Provide parser recommendations
  Logger.section('PARSER IMPROVEMENT RECOMMENDATIONS');
  console.log('📝 Based on this character data, consider improving:');
  
  if (character.modifiers?.length > 0) {
    console.log('   ✅ Modifier parsing (found modifiers for skills, abilities, etc.)');
  }
  
  if (character.spells?.length > 0) {
    console.log('   ✅ Spell parsing (character has spellcasting)');
  }
  
  if (character.inventory?.length > 0) {
    console.log('   ✅ Equipment/inventory parsing');
  }
  
  if (character.classFeatures?.length > 0) {
    console.log('   ✅ Class feature parsing');
  }
  
  if (character.choices?.length > 0) {
    console.log('   ✅ Character choice/option parsing');
  }

  Logger.info('🎉 Analysis complete! Check the character-analysis/ directory for detailed results.');
}

// Main execution
const cobaltToken = process.argv[2];
const characterId = process.argv[3] || CHARACTER_ID;

if (!cobaltToken) {
  console.log('❌ Usage: node analyze-character.js <cobalt-token> [character-id]');
  console.log(`\n💡 Default character ID: ${CHARACTER_ID}`);
  console.log('\n🔍 To get your cobalt token:');
  console.log('   1. Log in to D&D Beyond in your browser');
  console.log('   2. Open Developer Tools (F12)');
  console.log('   3. Go to Application > Cookies > https://www.dndbeyond.com');
  console.log('   4. Find the "CobaltSession" cookie and copy its value');
  console.log('\n📊 This script will:');
  console.log('   - Fetch character data from D&D Beyond');
  console.log('   - Analyze the data structure');
  console.log('   - Save detailed analysis files');
  console.log('   - Provide parser improvement recommendations');
  process.exit(1);
}

analyzeCharacter(cobaltToken, characterId).catch(error => {
  Logger.error(`Analysis failed: ${error.message}`);
  process.exit(1);
});
