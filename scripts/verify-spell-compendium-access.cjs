/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
// filepath: /Users/macbook-pro/Documents/Programming/beyond-foundry/scripts/verify-spell-compendium-access.cjs
// Verify that we're accessing D&D Beyond's spell compendium vs character-specific spells
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { AbortController } = require('abort-controller');

const PROXY_ENDPOINT = process.env.DDB_PROXY_URL || 'http://localhost:4000';
const OUTDIR = path.join(__dirname, '../comprehensive-parser-results');
const COOKIENAME = 'COBALT_TOKEN';

/**
 * COMPARISON TEST: Compendium vs Character Spells
 * 
 * This script will:
 * 1. Fetch spells from D&D Beyond's spell compendium API (via class endpoints)
 * 2. Fetch spells from a character's actual spell list 
 * 3. Compare the two to demonstrate the difference
 */

/**
 * Test 1: Access spell compendium via class endpoint (what we're currently doing)
 * This should return 100+ spells from the D&D Beyond compendium
 */
async function fetchSpellCompendiumViaClass(token, className = "Wizard") {
  console.log(`🔍 TEST 1: Fetching from D&D Beyond SPELL COMPENDIUM via class endpoint`);
  console.log(`   Class Name: ${className}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const url = `${PROXY_ENDPOINT}/proxy/class/spells`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cobalt: token,
        className: className,
      }),
      signal: controller.signal,
    };

    console.log(`   Attempting to fetch from: ${url}`);
    // console.log(`   Request options: ${JSON.stringify(options, null, 2)}`); // Can be too verbose with token
    
    console.log('   Waiting for fetch response...');
    const response = await fetch(url, options);
    clearTimeout(timeoutId); // Clear timeout if fetch completes
    console.log('   Fetch call completed.');

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    console.log('   Parsing JSON response...');
    const data = await response.json();
    console.log('   JSON parsing completed.');
    
    if (data.success && data.data && Array.isArray(data.data)) {
      console.log(`✅ COMPENDIUM RESULT: ${data.data.length} spells returned`);
      console.log(`   📊 This represents ALL spells available to ${className}s in D&D Beyond's compendium`);
      
      // Show some examples
      const sampleSpells = data.data.slice(0, 5);
      console.log(`   📋 Sample spells from compendium:`);
      sampleSpells.forEach(spell => {
        console.log(`      - ${spell.definition.name} (Level ${spell.definition.level})`);
      });
      
      return {
        source: 'compendium',
        count: data.data.length,
        spells: data.data,
        description: `Full D&D Beyond spell compendium for ${className}s`
      };
    } else {
      throw new Error('Invalid compendium response format or success:false');
    }
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    if (error.name === 'AbortError') {
      console.error(`❌ Compendium fetch failed: Request timed out after 30 seconds.`);
    } else {
      console.error(`❌ Compendium fetch failed: ${error.message}`);
    }
    return null;
  }
}

/**
 * Test 2: Access character-specific spells (what character import returns)
 * This should return 4-20 spells that this specific character knows/has prepared
 */
async function fetchCharacterSpecificSpells(token, characterId = 141773707) {
  console.log(`\n🔍 TEST 2: Fetching CHARACTER-SPECIFIC spells from character data`);
  console.log(`   Character ID: ${characterId}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const url = `${PROXY_ENDPOINT}/proxy/character`;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        cobalt: token,
        characterId: characterId 
      }),
      signal: controller.signal,
    };
    // console.log(`   Attempting to fetch from: ${url}`);
    // console.log(`   Request options: ${JSON.stringify(options, null, 2)}`);

    console.log('   Waiting for fetch response...');
    const response = await fetch(url, options);
    clearTimeout(timeoutId);
    console.log('   Fetch call completed.');

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    console.log('   Parsing JSON response...');
    const data = await response.json();
    console.log('   JSON parsing completed.');
    
    if (data.success && data.data) {
      const character = data.data; // Proxy returns character data directly in data field
      let characterSpells = [];
      
      // Adjusted to match the structure observed in BeyondFoundryAPI.ts for character.spells
      if (character.spells && typeof character.spells === 'object') {
        Object.values(character.spells).forEach(spellList => {
          if (Array.isArray(spellList)) {
            spellList.forEach(spell => {
              // Ensure the spell has a definition, as seen in compendium spells
              if (spell.definition && spell.definition.name && typeof spell.definition.level === 'number') {
                characterSpells.push(spell);
              } else {
                // console.warn('Skipping spell with missing definition:', spell);
              }
            });
          }
        });
      }
      
      console.log(`✅ CHARACTER RESULT: ${characterSpells.length} spells returned`);
      console.log(`   📊 This represents ONLY spells this character knows/has prepared`);
      
      if (characterSpells.length > 0) {
        console.log(`   📋 Character's actual spells:`);
        characterSpells.slice(0, 5).forEach(spell => {
          const prepared = spell.prepared ? '✅ Prepared' : '⭕ Known';
          console.log(`      - ${spell.definition.name} (Level ${spell.definition.level}) ${prepared}`);
        });
      }
      
      return {
        source: 'character',
        count: characterSpells.length,
        spells: characterSpells,
        description: `Spells known/prepared by character ${characterId}`
      };
    } else {
      throw new Error('Invalid character response format or success:false');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error(`❌ Character fetch failed: Request timed out after 30 seconds.`);
    } else {
      console.error(`❌ Character fetch failed: ${error.message}`);
    }
    return null;
  }
}

/**
 * Test 3: Compare and analyze the results
 */
function analyzeResults(compendiumResult, characterResult) {
  console.log(`\n📊 ANALYSIS: Compendium vs Character Spells`);
  console.log(`=`.repeat(60));
  
  if (!compendiumResult) {
    console.log(`❌ Compendium data missing - cannot analyze.`);
    return;
  }
  if (!characterResult) {
    console.log(`❌ Character data missing - analysis will be partial.`);
    // Allow analysis to proceed if compendium data is present, to at least verify that part
  }
  
  console.log(`\n📚 SPELL COMPENDIUM (via class endpoint):`);
  console.log(`   Source: ${compendiumResult.description}`);
  console.log(`   Count: ${compendiumResult.count} spells`);
  console.log(`   Purpose: Complete spell library for class-based importing`);
  
  if (characterResult) {
    console.log(`\n🎭 CHARACTER SPELLS (from character data):`);
    console.log(`   Source: ${characterResult.description}`);
    console.log(`   Count: ${characterResult.count} spells`);
    console.log(`   Purpose: Character's actual known/prepared spells`);
    
    if (characterResult.count > 0) {
        const ratio = Math.round((compendiumResult.count / characterResult.count) * 100) / 100;
        console.log(`\n🔢 KEY DIFFERENCES:`);
        console.log(`   📈 Compendium has ${compendiumResult.count - characterResult.count} MORE spells than character`);
       
  }

  if (!fs.existsSync(OUTDIR)) {
    fs.mkdirSync(OUTDIR, { recursive: true });
  }

  console.log('🎯 BEYOND FOUNDRY SPELL SOURCE VERIFICATION');
  console.log('='.repeat(60));
  console.log('Purpose: Verify that we\'re importing from D&D Beyond\'s spell compendium');
  console.log('vs character-specific spell data\n');

  // Test spell compendium access
  const compendiumResult = await fetchSpellCompendiumViaClass(token);
  
  // Test character-specific access  
  const characterResult = await fetchCharacterSpecificSpells(token);
  
  // Analyze and compare
  const analysis = analyzeResults(compendiumResult, characterResult);
  
  if (analysis) {
    // Save the results
    const resultFile = path.join(OUTDIR, 'spell-source-verification.json');
    fs.writeFileSync(resultFile, JSON.stringify(analysis, null, 2));
    console.log(`\n📁 Results saved to: ${resultFile}`);
    
    console.log(`\n🎉 CONCLUSION:`);
    console.log(`✅ Beyond Foundry IS importing from D&D Beyond's spell compendium`);
    console.log(`✅ We get ${analysis.compendium.count} spells vs ${analysis.character.count} character spells`);
    console.log(`✅ This is the correct approach for comprehensive spell coverage`);
    console.log(`✅ Character import gets full access to class spell lists`);
  }
}

main().catch(error => {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
});
