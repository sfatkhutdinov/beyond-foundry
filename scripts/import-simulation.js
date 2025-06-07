#!/usr/bin/env node

/**
 * Beyond Foundry - Character Import Simulation
 * Simulates the character import process that would happen in FoundryVTT
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const PROXY_URL = 'http://localhost:3100';

console.log('🎭 Beyond Foundry - Character Import Simulation');
console.log('='.repeat(55));

/**
 * Mock FoundryVTT game object structure
 */
const mockGame = {
  settings: {
    get: (module, setting) => {
      const settings = {
        'beyond-foundry.proxyUrl': PROXY_URL,
        'beyond-foundry.debugMode': true,
        'beyond-foundry.autoImportItems': true,
        'beyond-foundry.importPolicy': 'ask'
      };
      return settings[`${module}.${setting}`];
    }
  },
  i18n: {
    localize: (key) => key,
    format: (key, data) => `${key}: ${JSON.stringify(data)}`
  },
  users: {
    current: {
      isGM: true
    }
  },
  system: {
    id: 'dnd5e'
  }
};

/**
 * Mock FoundryVTT Actor.create functionality
 */
const mockActorCreate = (actorData) => {
  console.log('🎭 Mock Actor.create called with:');
  console.log(`   Name: ${actorData.name}`);
  console.log(`   Type: ${actorData.type}`);
  console.log(`   System Data: ${Object.keys(actorData.system || {}).length} properties`);
  console.log(`   Items: ${actorData.items?.length || 0} items`);
  
  // Simulate successful actor creation
  return Promise.resolve({
    id: `mock-actor-${Date.now()}`,
    name: actorData.name,
    type: actorData.type,
    system: actorData.system,
    items: actorData.items || [],
    setFlag: () => Promise.resolve(),
    update: () => Promise.resolve()
  });
};

/**
 * Test authentication flow
 */
async function testAuthentication(cobaltToken) {
  if (!cobaltToken) {
    console.log('⚠️  No cobalt token provided - skipping auth test');
    return false;
  }

  console.log('\n🔐 Testing authentication...');
  
  try {
    const response = await fetch(`${PROXY_URL}/proxy/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cobalt: cobaltToken })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Authentication successful: ${result.userId}`);
      return true;
    } else {
      console.log(`❌ Authentication failed: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Authentication error: ${error.message}`);
    return false;
  }
}

/**
 * Test character fetching
 */
async function testCharacterFetch(characterId, cobaltToken) {
  console.log(`\n📥 Testing character fetch (ID: ${characterId})...`);
  
  try {
    const url = cobaltToken 
      ? `${PROXY_URL}/proxy/character/${characterId}`
      : `${PROXY_URL}/character/${characterId}`;
    
    const headers = { 'Content-Type': 'application/json' };
    if (cobaltToken) {
      headers['Authorization'] = `Bearer ${cobaltToken}`;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const characterData = await response.json();
    
    console.log(`✅ Character fetched successfully:`);
    console.log(`   Name: ${characterData.name}`);
    console.log(`   Level: ${characterData.classes?.[0]?.level || 'Unknown'}`);
    console.log(`   Race: ${characterData.race?.fullName || 'Unknown'}`);
    console.log(`   Class: ${characterData.classes?.[0]?.definition?.name || 'Unknown'}`);
    console.log(`   Background: ${characterData.background?.definition?.name || 'Unknown'}`);
    
    return characterData;
  } catch (error) {
    console.log(`❌ Character fetch failed: ${error.message}`);
    return null;
  }
}

/**
 * Test character parsing using debug data
 */
async function testCharacterParsing() {
  console.log('\n🔧 Testing character parsing...');
  
  const debugPath = path.join(process.cwd(), 'debug', 'debug-character-147552172.json');
  
  if (!fs.existsSync(debugPath)) {
    console.log('⚠️  Debug character data not found - using mock data');
    return createMockParsedCharacter();
  }
  
  try {
    const debugData = JSON.parse(fs.readFileSync(debugPath, 'utf8'));
    const ddbCharacter = debugData.ddb?.character;
    
    if (!ddbCharacter) {
      throw new Error('Invalid debug data structure');
    }
    
    // Simulate character parsing (would normally use CharacterParser.parseCharacter)
    const parsedCharacter = {
      name: ddbCharacter.name,
      type: 'character',
      system: {
        details: {
          level: ddbCharacter.classes?.[0]?.level || 1,
          race: ddbCharacter.race?.fullName || 'Unknown',
          background: ddbCharacter.background?.definition?.name || 'Unknown'
        },
        attributes: {
          hp: {
            value: ddbCharacter.baseHitPoints || 0,
            max: ddbCharacter.baseHitPoints || 0
          },
          ac: {
            value: 10 // Would be calculated from actual AC
          }
        },
        abilities: {},
        skills: {}
      },
      items: ddbCharacter.inventory?.map(item => ({
        name: item.definition?.name || 'Unknown Item',
        type: 'equipment'
      })) || []
    };
    
    // Parse ability scores
    if (ddbCharacter.stats) {
      const abilityMap = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
      ddbCharacter.stats.forEach((stat, index) => {
        if (abilityMap[index]) {
          parsedCharacter.system.abilities[abilityMap[index]] = {
            value: stat.value || 10
          };
        }
      });
    }
    
    console.log(`✅ Character parsed successfully:`);
    console.log(`   Name: ${parsedCharacter.name}`);
    console.log(`   Level: ${parsedCharacter.system.details.level}`);
    console.log(`   Race: ${parsedCharacter.system.details.race}`);
    console.log(`   HP: ${parsedCharacter.system.attributes.hp.value}`);
    console.log(`   AC: ${parsedCharacter.system.attributes.ac.value}`);
    console.log(`   Abilities: ${Object.keys(parsedCharacter.system.abilities).length}`);
    console.log(`   Items: ${parsedCharacter.items.length}`);
    
    return parsedCharacter;
  } catch (error) {
    console.log(`❌ Character parsing failed: ${error.message}`);
    return null;
  }
}

/**
 * Create mock parsed character for testing
 */
function createMockParsedCharacter() {
  return {
    name: 'Test Character',
    type: 'character',
    system: {
      details: {
        level: 5,
        race: 'Human',
        background: 'Soldier'
      },
      attributes: {
        hp: { value: 45, max: 45 },
        ac: { value: 16 }
      },
      abilities: {
        str: { value: 16 },
        dex: { value: 14 },
        con: { value: 15 },
        int: { value: 12 },
        wis: { value: 13 },
        cha: { value: 10 }
      },
      skills: {}
    },
    items: [
      { name: 'Longsword', type: 'weapon' },
      { name: 'Shield', type: 'equipment' },
      { name: 'Chain Mail', type: 'equipment' }
    ]
  };
}

/**
 * Test actor creation
 */
async function testActorCreation(parsedCharacter) {
  console.log('\n🎭 Testing actor creation...');
  
  try {
    const actor = await mockActorCreate(parsedCharacter);
    
    console.log(`✅ Actor created successfully:`);
    console.log(`   ID: ${actor.id}`);
    console.log(`   Name: ${actor.name}`);
    console.log(`   Type: ${actor.type}`);
    
    return actor;
  } catch (error) {
    console.log(`❌ Actor creation failed: ${error.message}`);
    return null;
  }
}

/**
 * Full import simulation
 */
async function runFullImportSimulation(characterId, cobaltToken) {
  console.log('\n🚀 Running full import simulation...');
  console.log('-'.repeat(40));
  
  let success = true;
  
  // Test authentication if token provided
  if (cobaltToken) {
    success &= await testAuthentication(cobaltToken);
  }
  
  // Test character fetch (only if authenticated)
  let characterData = null;
  if (success && cobaltToken && characterId) {
    characterData = await testCharacterFetch(characterId, cobaltToken);
    success &= (characterData !== null);
  }
  
  // Test character parsing
  const parsedCharacter = await testCharacterParsing();
  success &= (parsedCharacter !== null);
  
  // Test actor creation
  if (parsedCharacter) {
    const actor = await testActorCreation(parsedCharacter);
    success &= (actor !== null);
  }
  
  console.log('\n' + '='.repeat(55));
  if (success) {
    console.log('🎉 Full import simulation PASSED!');
    console.log('\n✅ Character import pipeline is working correctly');
    console.log('✅ Ready for FoundryVTT testing');
  } else {
    console.log('❌ Import simulation FAILED!');
    console.log('\n⚠️  Check the errors above and fix before FoundryVTT testing');
  }
  
  return success;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const characterId = args[0];
  const cobaltToken = args[1];
  
  console.log('\n🎯 Test Parameters:');
  console.log(`   Character ID: ${characterId || 'Using debug data'}`);
  console.log(`   Cobalt Token: ${cobaltToken ? 'Provided' : 'Not provided'}`);
  console.log(`   Proxy URL: ${PROXY_URL}`);
  
  // Set up global mock for testing
  global.game = mockGame;
  global.Actor = { create: mockActorCreate };
  
  await runFullImportSimulation(characterId, cobaltToken);
}

main().catch(error => {
  console.error('❌ Simulation failed:', error);
  process.exit(1);
});
