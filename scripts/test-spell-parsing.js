#!/usr/bin/env node

/**
 * Test Spell Parsing Functionality
 * Tests the SpellParser with mock D&D Beyond spell data
 */

import fs from 'fs';
import path from 'path';

// Mock D&D Beyond spell data based on ddb-importer patterns
const mockDDBSpells = [
  {
    "id": 1234,
    "definition": {
      "id": 136,
      "name": "Fireball",
      "level": 3,
      "school": "Evocation",
      "description": "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much damage on a successful one. The flames spread around corners. It ignites flammable objects in the area that aren't being worn or carried.",
      "higherLevelDescription": "When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.",
      "range": "150 feet",
      "duration": "Instantaneous",
      "castingTime": "1 action",
      "components": "V, S, M (a tiny ball of bat guano and sulfur)",
      "ritual": false,
      "concentration": false,
      "sources": [
        {
          "sourceId": 1,
          "pageNumber": 241
        }
      ],
      "saveDcAbilityId": 2,
      "damageTypeId": 4,
      "areaOfEffectId": 3,
      "areaOfEffectSize": 20,
      "areaOfEffectSizeSecondary": null
    },
    "prepared": true,
    "alwaysPrepared": false,
    "usesSpellSlot": true,
    "castAtLevel": null,
    "alwaysKnown": false,
    "countAsKnownSpell": true,
    "spellCastingAbilityId": 5,
    "displayAsAttack": null,
    "overrideSaveDc": null,
    "limitedUse": null,
    "id": 2609
  },
  {
    "id": 5678,
    "definition": {
      "id": 2019,
      "name": "Cure Wounds",
      "level": 1,
      "school": "Evocation",
      "description": "A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs.",
      "higherLevelDescription": "When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d8 for each slot level above 1st.",
      "range": "Touch",
      "duration": "Instantaneous", 
      "castingTime": "1 action",
      "components": "V, S",
      "ritual": false,
      "concentration": false,
      "sources": [
        {
          "sourceId": 1,
          "pageNumber": 230
        }
      ],
      "saveDcAbilityId": null,
      "damageTypeId": null,
      "areaOfEffectId": null,
      "areaOfEffectSize": null,
      "areaOfEffectSizeSecondary": null
    },
    "prepared": true,
    "alwaysPrepared": false,
    "usesSpellSlot": true,
    "castAtLevel": null,
    "alwaysKnown": false,
    "countAsKnownSpell": true,
    "spellCastingAbilityId": 5,
    "displayAsAttack": null,
    "overrideSaveDc": null,
    "limitedUse": null,
    "id": 2610
  }
];

async function testSpellParsing() {
  console.log('🧪 Testing Spell Parsing Functionality');
  console.log('='.repeat(50));

  try {
    // Import the SpellParser from source
    const { SpellParser } = await import('../src/parsers/spells/SpellParser.js');
    
    console.log(`\n📜 Testing ${mockDDBSpells.length} mock spells...\n`);
    
    mockDDBSpells.forEach((ddbSpell, index) => {
      console.log(`${index + 1}. Testing: ${ddbSpell.definition.name}`);
      
      try {
        const foundrySpell = SpellParser.parseSpell(ddbSpell);
        
        console.log(`   ✅ Parsed successfully:`);
        console.log(`      Name: ${foundrySpell.name}`);
        console.log(`      Type: ${foundrySpell.type}`);
        console.log(`      Level: ${foundrySpell.system?.level || 'Unknown'}`);
        console.log(`      School: ${foundrySpell.system?.school || 'Unknown'}`);
        console.log(`      Components: ${JSON.stringify(foundrySpell.system?.components || {})}`);
        console.log(`      Range: ${JSON.stringify(foundrySpell.system?.range || {})}`);
        console.log(`      Damage: ${JSON.stringify(foundrySpell.system?.damage || {})}`);
        
      } catch (error) {
        console.log(`   ❌ Parsing failed: ${error.message}`);
      }
      
      console.log('');
    });
    
    console.log('✅ Spell parsing test complete!');
    
  } catch (error) {
    console.log(`❌ Failed to import SpellParser: ${error.message}`);
    console.log('💡 Make sure to build the project first: npm run build');
  }
}

// Run the test
testSpellParsing().catch(console.error);
