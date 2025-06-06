#!/usr/bin/env node

/**
 * Test script for Beyond Foundry API
 * Tests authentication and character list functionality with ddb-proxy
 */

import fetch from 'node-fetch';

// Test configuration
const PROXY_ENDPOINT = 'http://localhost:3100';
const API_ENDPOINT = 'https://www.dndbeyond.com/api';

/**
 * Logger for testing
 */
class TestLogger {
  static info(message) {
    console.log(`[INFO] ${message}`);
  }
  
  static warn(message) {
    console.log(`[WARN] ${message}`);
  }
  
  static error(message) {
    console.error(`[ERROR] ${message}`);
  }
  
  static debug(message) {
    console.log(`[DEBUG] ${message}`);
  }
}

/**
 * Test proxy connection
 */
async function testProxyConnection() {
  try {
    TestLogger.debug(`Testing proxy connection to: ${PROXY_ENDPOINT}`);
    const response = await fetch(`${PROXY_ENDPOINT}/ping`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      TestLogger.info('✅ Proxy connection successful');
      return true;
    } else {
      TestLogger.warn(`❌ Proxy connection failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    TestLogger.error(`❌ Proxy connection error: ${error.message}`);
    return false;
  }
}

/**
 * Test authentication with D&D Beyond
 */
async function testAuthentication(cobaltToken) {
  try {
    if (!cobaltToken) {
      TestLogger.error('❌ No cobalt token provided');
      return { success: false, message: 'No cobalt token provided' };
    }

    TestLogger.debug('Testing authentication with D&D Beyond...');
    
    const response = await fetch(`${PROXY_ENDPOINT}/proxy/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cobalt: cobaltToken
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      TestLogger.info('✅ Authentication successful');
      return {
        success: true,
        userId: data.userId,
        message: 'Authentication successful'
      };
    } else {
      TestLogger.warn(`❌ Authentication failed: ${data.message || 'Unknown error'}`);
      return {
        success: false,
        message: data.message || 'Authentication failed'
      };
    }
  } catch (error) {
    TestLogger.error(`❌ Authentication error: ${error.message}`);
    return {
      success: false,
      message: `Authentication error: ${error.message}`
    };
  }
}

/**
 * Test character list retrieval (NOTE: ddb-proxy does not have a character list endpoint)
 * This function demonstrates the limitation and provides guidance
 */
async function testCharacterList(cobaltToken) {
  TestLogger.warn('⚠️  ddb-proxy does not provide a character list endpoint');
  TestLogger.info('📝 To get characters, you need to know the character ID');
  TestLogger.info('💡 How to find character IDs:');
  TestLogger.info('  1. Go to https://www.dndbeyond.com/characters');
  TestLogger.info('  2. Click on a character');
  TestLogger.info('  3. Look at the URL: dndbeyond.com/characters/{YOUR_CHARACTER_ID}');
  TestLogger.info('  4. Copy the numeric ID from the URL');
  TestLogger.info('');
  TestLogger.info('🔍 Example:');
  TestLogger.info('  URL: https://www.dndbeyond.com/characters/123456789');
  TestLogger.info('  Character ID: 123456789');
  TestLogger.info('');
  TestLogger.info('🧪 To test with a character ID, run:');
  TestLogger.info('  node test-api.js <cobalt-token> <character-id>');
  
  return {
    success: false,
    error: 'Character list endpoint not available in ddb-proxy. Use direct character ID instead.'
  };
}

/**
 * Test character data retrieval
 */
async function testCharacterData(cobaltToken, characterId) {
  try {
    TestLogger.debug(`Testing character data retrieval for ID: ${characterId}...`);
    
    const response = await fetch(`${PROXY_ENDPOINT}/proxy/character`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cobalt: cobaltToken,
        characterId: parseInt(characterId)
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Character data is nested under ddb.character
      const character = data.ddb?.character;
      if (character) {
        TestLogger.info(`✅ Character data retrieved: ${character.name || 'Unknown'}`);
        return {
          success: true,
          character: character
        };
      } else {
        TestLogger.warn('❌ Character data not found in response');
        return {
          success: false,
          error: 'Character data not found in response'
        };
      }
    } else {
      TestLogger.warn(`❌ Failed to retrieve character: ${data.message || 'Unknown error'}`);
      return {
        success: false,
        error: data.message || 'Failed to retrieve character'
      };
    }
  } catch (error) {
    TestLogger.error(`❌ Character fetch error: ${error.message}`);
    return {
      success: false,
      error: `Character fetch error: ${error.message}`
    };
  }
}

/**
 * Run complete API test
 */
async function runCompleteTest(cobaltToken, characterId) {
  console.log('🧪 Starting Beyond Foundry API Test...\n');
  
  // Test 1: Proxy connection
  console.log('=== Test 1: Proxy Connection ===');
  const proxyTest = await testProxyConnection();
  if (!proxyTest) {
    console.log('❌ Cannot continue without proxy connection');
    console.log('💡 Make sure ddb-proxy is running on localhost:3100');
    return;
  }
  console.log();
  
  // Test 2: Authentication
  console.log('=== Test 2: Authentication ===');
  const authResult = await testAuthentication(cobaltToken);
  if (!authResult.success) {
    console.log('❌ Cannot continue without authentication');
    console.log('💡 Check your cobalt token is valid and not expired');
    return;
  }
  console.log();
  
  // Test 3: Character list limitation
  console.log('=== Test 3: Character List Limitation ===');
  await testCharacterList(cobaltToken);
  console.log();
  
  // Test 4: Character data (if ID provided)
  if (characterId) {
    console.log('=== Test 4: Character Data Retrieval ===');
    const characterData = await testCharacterData(cobaltToken, characterId);
    
    if (characterData.success) {
      console.log(`\n📄 Character Details for ${characterData.character.name}:`);
      console.log(`  - Race: ${characterData.character.race?.fullName || 'Unknown'}`);
      console.log(`  - Classes: ${characterData.character.classes?.map(c => `${c.definition?.name} ${c.level}`).join(', ') || 'Unknown'}`);
      console.log(`  - Background: ${characterData.character.background?.definition?.name || 'Unknown'}`);
      console.log(`  - HP: ${characterData.character.baseHitPoints || 'Unknown'}`);
      
      console.log('\n✅ Character data retrieval successful!');
      console.log('\n🎯 Next steps for FoundryVTT testing:');
      console.log('  1. Copy the built module (beyond-foundry.js) to your FoundryVTT modules folder');
      console.log('  2. Enable the Beyond Foundry module in FoundryVTT');
      console.log('  3. In the FoundryVTT console, run:');
      console.log(`     game.modules.get("beyond-foundry").api.quickTest("${cobaltToken}", "${characterId}")`);
      console.log('  4. Then try importing the character:');
      console.log(`     game.modules.get("beyond-foundry").api.importCharacter("${characterId}")`);
    } else {
      console.log('\n❌ Character data retrieval failed');
      console.log('💡 Double-check the character ID and make sure it belongs to your account');
    }
  } else {
    console.log('=== Test 4: Character Testing ===');
    console.log('🔍 No character ID provided for testing');
    console.log('📝 To test character retrieval, rerun with a character ID:');
    console.log(`   node test-api.js "${cobaltToken}" <character-id>`);
  }
  
  console.log('\n🎉 API test complete!');
  console.log('\n📋 Summary:');
  console.log('  ✅ Proxy connection: Working');
  console.log('  ✅ Authentication: Working');
  console.log('  ⚠️  Character list: Not available (ddb-proxy limitation)');
  if (characterId) {
    console.log(`  ${characterData?.success ? '✅' : '❌'} Character retrieval: ${characterData?.success ? 'Working' : 'Failed'}`);
  } else {
    console.log('  ⏭️  Character retrieval: Not tested (no character ID provided)');
  }
}

// Main execution
const cobaltToken = process.argv[2];
const characterId = process.argv[3];

if (!cobaltToken) {
  console.log('❌ Usage: node test-api.js <cobalt-token> [character-id]');
  console.log('\n💡 To get your cobalt token:');
  console.log('  1. Log in to D&D Beyond in your browser');
  console.log('  2. Open Developer Tools (F12)');
  console.log('  3. Go to Application > Cookies > https://www.dndbeyond.com');
  console.log('  4. Find the "CobaltSession" cookie and copy its value');
  console.log('\n💡 To get your character ID:');
  console.log('  1. Go to https://www.dndbeyond.com/characters');
  console.log('  2. Click on a character');
  console.log('  3. Copy the ID from the URL: dndbeyond.com/characters/{ID}');
  console.log('\n🔍 Examples:');
  console.log('  node test-api.js "your-cobalt-token"');
  console.log('  node test-api.js "your-cobalt-token" "123456789"');
  process.exit(1);
}

runCompleteTest(cobaltToken, characterId).catch(error => {
  console.error('Test failed:', error.message);
  process.exit(1);
});

export {
  testProxyConnection,
  testAuthentication,
  testCharacterList,
  testCharacterData,
  runCompleteTest
};
