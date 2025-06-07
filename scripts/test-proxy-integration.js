#!/usr/bin/env node

/**
 * Proxy Integration Test Script
 * Tests the complete flow from proxy connection to character parsing
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const PROXY_URL = 'http://localhost:3100';

/**
 * Test proxy connectivity
 */
async function testProxyConnection() {
  console.log('🔌 Testing proxy connection...');
  
  try {
    const response = await fetch(`${PROXY_URL}/ping`);
    if (response.ok) {
      const text = await response.text();
      console.log(`✅ Proxy connection successful: ${text}`);
      return true;
    } else {
      console.log(`❌ Proxy connection failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Proxy connection error: ${error.message}`);
    return false;
  }
}

/**
 * Test authentication with a provided cobalt token
 */
async function testAuthentication(cobaltToken) {
  console.log('🔐 Testing authentication...');
  
  try {
    const response = await fetch(`${PROXY_URL}/proxy/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cobalt: cobaltToken,
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`✅ Authentication successful: User ID ${data.userId}`);
      return true;
    } else {
      console.log(`❌ Authentication failed: ${data.message || 'Unknown error'}`);
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
async function testCharacterFetch(cobaltToken, characterId) {
  console.log(`📋 Testing character fetch for ID: ${characterId}...`);
  
  try {
    const response = await fetch(`${PROXY_URL}/proxy/character`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cobalt: cobaltToken,
        characterId: parseInt(characterId),
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.success && data.ddb?.character) {
      const character = data.ddb.character;
      console.log(`✅ Character fetch successful: ${character.name}`);
      console.log(`   Race: ${character.race?.fullName || 'Unknown'}`);
      console.log(`   Classes: ${character.classes?.map(c => c.definition?.name).join(', ') || 'Unknown'}`);
      return character;
    } else {
      console.log(`❌ Character fetch failed: ${data.message || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Character fetch error: ${error.message}`);
    return null;
  }
}

/**
 * Test the built-in parser with character data
 */
async function testCharacterParsing(characterData) {
  console.log('⚙️  Testing character parsing...');
  
  try {
    // Import the built parser
    const { CharacterParser } = await import('../build/parsers/character/CharacterParser.js');
    
    const foundryActor = CharacterParser.parseCharacter(characterData);
    
    console.log(`✅ Character parsing successful:`);
    console.log(`   Name: ${foundryActor.name}`);
    console.log(`   Type: ${foundryActor.type}`);
    console.log(`   HP: ${foundryActor.system?.attributes?.hp?.value || 'Unknown'}`);
    console.log(`   AC: ${foundryActor.system?.attributes?.ac?.value || 'Unknown'}`);
    console.log(`   Level: ${foundryActor.system?.details?.level || 'Unknown'}`);
    
    return foundryActor;
  } catch (error) {
    console.log(`❌ Character parsing error: ${error.message}`);
    return null;
  }
}

/**
 * Main test function
 */
async function runIntegrationTest() {
  console.log('🚀 Beyond Foundry - Proxy Integration Test');
  console.log('='.repeat(50));

  const cobaltToken = process.argv[2];
  const characterId = process.argv[3] || '147239148'; // Default test character

  if (!cobaltToken) {
    console.log('❌ Usage: node test-proxy-integration.js <cobalt-token> [character-id]');
    console.log('');
    console.log('💡 Get your cobalt token from D&D Beyond cookies:');
    console.log('   1. Log into dndbeyond.com');
    console.log('   2. Open Developer Tools (F12)');
    console.log('   3. Go to Application > Cookies');
    console.log('   4. Find "CobaltSession" cookie');
    console.log('   5. Copy its value');
    process.exit(1);
  }

  // Test 1: Proxy Connection
  const connectionOk = await testProxyConnection();
  if (!connectionOk) {
    console.log('❌ Proxy connection failed. Ensure ddb-proxy is running on localhost:3100');
    process.exit(1);
  }

  // Test 2: Authentication
  const authOk = await testAuthentication(cobaltToken);
  if (!authOk) {
    console.log('❌ Authentication failed. Check your cobalt token.');
    process.exit(1);
  }

  // Test 3: Character Fetch
  const character = await testCharacterFetch(cobaltToken, characterId);
  if (!character) {
    console.log('❌ Character fetch failed. Check character ID and permissions.');
    process.exit(1);
  }

  // Test 4: Character Parsing
  const foundryActor = await testCharacterParsing(character);
  if (!foundryActor) {
    console.log('❌ Character parsing failed.');
    process.exit(1);
  }

  // Save test results
  const resultsDir = path.join(process.cwd(), 'integration-test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(
    path.join(resultsDir, `raw-character-${characterId}-${timestamp}.json`),
    JSON.stringify(character, null, 2)
  );
  fs.writeFileSync(
    path.join(resultsDir, `foundry-actor-${characterId}-${timestamp}.json`),
    JSON.stringify(foundryActor, null, 2)
  );

  console.log('');
  console.log('🎉 Integration test completed successfully!');
  console.log(`📁 Results saved to: ${resultsDir}`);
  console.log('');
  console.log('✅ All systems functional:');
  console.log('   • Proxy connection');
  console.log('   • D&D Beyond authentication');
  console.log('   • Character data retrieval');
  console.log('   • Character parsing');
  console.log('');
  console.log('🚀 Ready for FoundryVTT integration!');
}

runIntegrationTest().catch(console.error);
