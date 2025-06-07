#!/usr/bin/env node

/**
 * Parser Validation Script for Beyond Foundry
 * 
 * This script tests the CharacterParser against real D&D Beyond data
 * and validates the output matches FoundryVTT D&D 5e system expectations.
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

// Make logger globally available
global.Logger = Logger;

/**
 * Import the CharacterParser - we need to handle ES modules
 */
async function importCharacterParser() {
  try {
    // Try to import the compiled version first
    const module = await import('./character-parser-wrapper.js');
    
    // Check if CharacterParser is directly available
    if (module.CharacterParser) {
      return module.CharacterParser;
    }
    
    // Check if it's in a default export
    if (module.default && module.default.CharacterParser) {
      return module.default.CharacterParser;
    }
    
    // The module might have been loaded but CharacterParser is global
    // Let's try to evaluate the module and access CharacterParser
    if (typeof global !== 'undefined' && global.CharacterParser) {
      return global.CharacterParser;
    }
    
    throw new Error('CharacterParser not found in module exports');
  } catch (error) {
    console.log('Could not import compiled module, trying direct access...');
    throw new Error('CharacterParser not available. Check module exports.');
  }
}

/**
 * Expected FoundryVTT D&D 5e actor structure for validation
 */
const EXPECTED_ACTOR_STRUCTURE = {
  name: 'string',
  type: 'character',
  img: 'string',
  system: {
    abilities: {
      str: { value: 'number', proficient: 'number', bonuses: { check: 'string', save: 'string' }},
      dex: { value: 'number', proficient: 'number', bonuses: { check: 'string', save: 'string' }},
      con: { value: 'number', proficient: 'number', bonuses: { check: 'string', save: 'string' }},
      int: { value: 'number', proficient: 'number', bonuses: { check: 'string', save: 'string' }},
      wis: { value: 'number', proficient: 'number', bonuses: { check: 'string', save: 'string' }},
      cha: { value: 'number', proficient: 'number', bonuses: { check: 'string', save: 'string' }}
    },
    attributes: {
      ac: { flat: 'number|null', calc: 'string', formula: 'string' },
      hp: { value: 'number', max: 'number', temp: 'number', tempmax: 'number' },
      init: { ability: 'string', bonus: 'number' },
      movement: 'object',
      senses: 'object',
      spellcasting: 'string',
      prof: 'number',
      spelldc: 'number'
    },
    details: {
      biography: { value: 'string', public: 'string' },
      alignment: 'string',
      race: 'string',
      background: 'string',
      originalClass: 'string',
      xp: { value: 'number', max: 'number', pct: 'number' }
    },
    traits: 'object',
    currency: 'object',
    skills: 'object',
    spells: 'object',
    resources: 'object'
  },
  items: 'array',
  effects: 'array',
  flags: {
    'beyond-foundry': {
      ddbCharacterId: 'string|number',
      lastSync: 'number',
      originalData: 'object'
    }
  }
};

/**
 * Validate actor structure against expected format
 */
function validateActorStructure(actor, path = '', errors = []) {
  function checkStructure(actual, expected, currentPath) {
    if (expected === 'string' || expected === 'number' || expected === 'boolean' || expected === 'array' || expected === 'object') {
      const actualType = Array.isArray(actual) ? 'array' : typeof actual;
      const expectedTypes = expected.split('|');
      
      if (!expectedTypes.includes(actualType) && !(expected.includes('null') && actual === null)) {
        errors.push(`${currentPath}: Expected ${expected}, got ${actualType}`);
      }
      return;
    }

    if (typeof expected === 'object' && expected !== null) {
      if (typeof actual !== 'object' || actual === null) {
        errors.push(`${currentPath}: Expected object, got ${typeof actual}`);
        return;
      }

      // Check required properties
      Object.keys(expected).forEach(key => {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        if (!(key in actual)) {
          errors.push(`${newPath}: Missing required property`);
        } else {
          checkStructure(actual[key], expected[key], newPath);
        }
      });
    } else if (expected !== actual) {
      errors.push(`${currentPath}: Expected ${expected}, got ${actual}`);
    }
  }

  checkStructure(actor, EXPECTED_ACTOR_STRUCTURE, '');
  return errors;
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
  console.log('🧪 Testing CharacterParser with Real Data\n');

  // Step 1: Fetch character data
  console.log('📥 Fetching character data...');
  const result = await fetchCharacterData(cobaltToken, characterId);
  
  if (!result.success) {
    console.error(`❌ Failed to fetch character: ${result.error}`);
    return;
  }

  const ddbCharacter = result.character;
  console.log(`✅ Fetched character: ${ddbCharacter.name}`);

  // Step 2: Import and test parser
  console.log('\n🔧 Loading CharacterParser...');
  let CharacterParser;
  try {
    CharacterParser = await importCharacterParser();
    console.log('✅ CharacterParser loaded successfully');
  } catch (error) {
    console.error(`❌ Failed to load CharacterParser: ${error.message}`);
    console.log('💡 Make sure to run "npm run build" first');
    return;
  }

  // Step 3: Parse character
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

  // Step 4: Validate structure
  console.log('\n🔍 Validating actor structure...');
  const validationErrors = validateActorStructure(foundryActor);
  
  if (validationErrors.length === 0) {
    console.log('✅ Actor structure is valid!');
  } else {
    console.log(`❌ Found ${validationErrors.length} validation errors:`);
    validationErrors.forEach(error => console.log(`   - ${error}`));
  }

  // Step 5: Save results
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

  // Save validation report
  const report = {
    characterId,
    characterName: ddbCharacter.name,
    timestamp: new Date().toISOString(),
    validationErrors: validationErrors,
    isValid: validationErrors.length === 0,
    summary: {
      hasAbilities: foundryActor.system?.abilities ? Object.keys(foundryActor.system.abilities).length : 0,
      hasSkills: foundryActor.system?.skills ? Object.keys(foundryActor.system.skills).length : 0,
      hasSpells: foundryActor.system?.spells ? true : false,
      itemCount: foundryActor.items?.length || 0,
      effectCount: foundryActor.effects?.length || 0
    }
  };

  fs.writeFileSync(
    path.join(outputDir, `validation-report-${characterId}.json`), 
    JSON.stringify(report, null, 2)
  );

  console.log(`📄 Results saved to ${outputDir}/`);

  // Step 6: Summary
  console.log('\n📊 Test Summary:');
  console.log(`   Character: ${foundryActor.name}`);
  console.log(`   Type: ${foundryActor.type}`);
  console.log(`   Abilities: ${Object.keys(foundryActor.system?.abilities || {}).length}/6`);
  console.log(`   Items: ${foundryActor.items?.length || 0}`);
  console.log(`   Effects: ${foundryActor.effects?.length || 0}`);
  console.log(`   Validation: ${validationErrors.length === 0 ? '✅ PASSED' : '❌ FAILED'}`);

  if (validationErrors.length > 0) {
    console.log('\n🔧 Recommended Parser Improvements:');
    const uniqueIssues = [...new Set(validationErrors.map(error => error.split(':')[0]))];
    uniqueIssues.forEach(issue => {
      console.log(`   - Fix ${issue} property structure`);
    });
  }

  return {
    success: true,
    actor: foundryActor,
    validationErrors,
    isValid: validationErrors.length === 0
  };
}

// Main execution
const cobaltToken = process.argv[2];
const characterId = process.argv[3] || '147239148';

if (!cobaltToken) {
  console.log('❌ Usage: node test-parser.js <cobalt-token> [character-id]');
  console.log('\n📋 This script will:');
  console.log('   1. Fetch character data from D&D Beyond via ddb-proxy');
  console.log('   2. Parse it using CharacterParser');
  console.log('   3. Validate the output against FoundryVTT D&D 5e format');
  console.log('   4. Generate detailed validation reports');
  console.log('\n💡 Get your cobalt token from D&D Beyond cookies');
  process.exit(1);
}

testCharacterParser(cobaltToken, characterId).catch(error => {
  console.error(`Test failed: ${error.message}`);
  process.exit(1);
});
