/**
 * REAL D&D Beyond API Test
 * This test makes actual API calls to ddb-proxy using the real cobalt token
 * to validate that the Beyond Foundry integration works with live data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const COBALT_TOKEN = process.env.COBALT_TOKEN;
const PROXY_ENDPOINT = 'http://localhost:3100';
const TEST_CHARACTER_ID = process.env.TEST_CHARACTER_ID || '147239148'; // From docs

console.log('🧪 Real D&D Beyond API Test');
console.log('='.repeat(50));

/**
 * Test ddb-proxy connection
 */
async function testProxyConnection() {
  console.log('\n📡 Testing ddb-proxy connection...');
  
  try {
    const response = await fetch(`${PROXY_ENDPOINT}/ping`);
    const result = await response.text();
    
    if (result.includes('pong')) {
      console.log('✅ ddb-proxy is responding');
      return true;
    } else {
      console.log('❌ ddb-proxy responded but not with pong:', result);
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to connect to ddb-proxy:', error.message);
    return false;
  }
}

/**
 * Test cobalt token authentication
 */
async function testAuthentication() {
  console.log('\n🔐 Testing cobalt token authentication...');
  
  if (!COBALT_TOKEN || COBALT_TOKEN.length < 10) {
    console.log('❌ No valid cobalt token found in .env file');
    return false;
  }
  
  console.log(`✅ Cobalt token loaded: ${COBALT_TOKEN.substring(0, 20)}...`);
  
  try {
    const response = await fetch(`${PROXY_ENDPOINT}/proxy/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cobalt: COBALT_TOKEN
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Authentication successful');
      console.log(`👤 User ID: ${data.userId}`);
      return true;
    } else {
      console.log(`❌ Authentication failed: ${data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.message);
    return false;
  }
}

/**
 * Fetch character data using correct ddb-proxy endpoint
 */
async function fetchCharacterData(characterId) {
  console.log(`\n🎯 Fetching character data for ID: ${characterId}...`);
  
  try {
    const response = await fetch(`${PROXY_ENDPOINT}/proxy/character`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cobalt: COBALT_TOKEN,
        betaKey: null,
        characterId: parseInt(characterId, 10)
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Character data is nested under ddb.character
      const character = data.ddb?.character;
      if (character) {
        console.log('✅ Successfully fetched character data');
        console.log(`📊 Character: ${character.name || 'Unknown'}`);
        console.log(`🎭 Race: ${character.race?.fullName || 'Unknown'}`);
        console.log(`⚔️ Classes: ${character.classes?.map(c => `${c.definition?.name || 'Unknown'} (Level ${c.level})`).join(', ') || 'Unknown'}`);
        console.log(`❤️ Hit Points: ${character.baseHitPoints || 'Unknown'}`);
        console.log(`🎒 Items: ${character.inventory?.length || 0}`);
        
        return { success: true, character, fullResponse: data };
      } else {
        console.log('❌ Character data not found in response');
        return { success: false, error: 'Character data not found in response' };
      }
    } else {
      console.log(`❌ Failed to fetch character: ${data.message || 'Unknown error'}`);
      return { success: false, error: data.message || 'Unknown error' };
    }
  } catch (error) {
    console.log('❌ Error fetching character:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Save real character data for analysis
 */
async function saveCharacterData(character, fullResponse, filename) {
  const outputDir = path.join(__dirname, '..', 'analysis', 'real-character-data');
  
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save the parsed character data
  const characterFile = path.join(outputDir, filename);
  fs.writeFileSync(characterFile, JSON.stringify(character, null, 2));
  console.log(`💾 Saved character data to: ${characterFile}`);
  
  // Save the full API response for analysis
  const fullResponseFile = path.join(outputDir, `full-${filename}`);
  fs.writeFileSync(fullResponseFile, JSON.stringify(fullResponse, null, 2));
  console.log(`💾 Saved full API response to: ${fullResponseFile}`);
  
  return { characterFile, fullResponseFile };
}

/**
 * Analyze character data structure
 */
function analyzeCharacterData(character) {
  console.log('\n📊 Character Data Structure Analysis:');
  console.log(`🏷️  Name: ${character?.name || 'Missing'}`);
  console.log(`📈 Level: ${character?.level || 'Missing'}`);
  console.log(`👤 Race: ${character?.race?.fullName || 'Missing'}`);
  console.log(`🎓 Classes: ${character?.classes?.length || 0} found`);
  console.log(`📊 Stats: ${character?.stats?.length || 0} ability scores`);
  console.log(`🎒 Inventory: ${character?.inventory?.length || 0} items`);
  console.log(`🪄 Spells: ${character?.spells ? Object.keys(character.spells).length + ' spell levels' : 'No spells'}`);
  console.log(`🎯 Features: ${character?.classFeatures?.length || 0} class features`);
  console.log(`🏃 Speed: ${character?.race?.weightSpeeds?.normal?.walk || 'Unknown'} ft`);
  console.log(`🛡️  AC: ${character?.armorClass || 'Unknown'}`);
  
  // Check for potential parsing issues
  const issues = [];
  if (!character?.name) issues.push('Missing character name');
  if (!character?.race) issues.push('Missing race data');
  if (!character?.classes || character.classes.length === 0) issues.push('Missing class data');
  if (!character?.stats) issues.push('Missing ability scores');
  
  if (issues.length > 0) {
    console.log('\n⚠️  Potential parsing issues:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('\n✅ Character data structure looks complete!');
  }
}

/**
 * Main test execution
 */
async function main() {
  try {
    // Step 1: Test proxy connection
    const proxyConnected = await testProxyConnection();
    if (!proxyConnected) {
      console.log('\n❌ Cannot continue without ddb-proxy connection');
      console.log('💡 Make sure ddb-proxy is running on localhost:3100');
      return;
    }
    
    // Step 2: Test authentication
    const authValid = await testAuthentication();
    if (!authValid) {
      console.log('\n❌ Cannot continue without valid authentication');
      console.log('💡 Check your COBALT_TOKEN in .env file');
      return;
    }
    
    // Note about character list limitation
    console.log('\n📝 Note: ddb-proxy does not provide character list endpoint');
    console.log('💡 To get character IDs:');
    console.log('  1. Go to https://www.dndbeyond.com/characters');
    console.log('  2. Click on a character');
    console.log('  3. Copy ID from URL: dndbeyond.com/characters/{ID}');
    console.log(`🎯 Testing with character ID: ${TEST_CHARACTER_ID}`);
    console.log('💡 To test with your own character, set TEST_CHARACTER_ID environment variable');
    
    // Step 3: Fetch character data using known character ID
    const result = await fetchCharacterData(TEST_CHARACTER_ID);
    if (!result.success) {
      console.log('\n❌ Failed to fetch character data');
      console.log(`💡 Error: ${result.error}`);
      console.log('💡 Make sure the character ID is correct and accessible with your account');
      return;
    }
    
    // Step 4: Save the real data for analysis
    const files = await saveCharacterData(
      result.character, 
      result.fullResponse, 
      `real-character-${TEST_CHARACTER_ID}.json`
    );
    
    // Step 5: Analyze character data structure
    analyzeCharacterData(result.character);
    
    // Step 6: Compare with mock data structure
    console.log('\n🔄 Data Structure Comparison:');
    try {
      const mockDataPath = path.join(__dirname, '..', 'tests', 'data', 'sample-character.json');
      if (fs.existsSync(mockDataPath)) {
        const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
        
        console.log('📋 Mock data fields:', Object.keys(mockData).join(', '));
        console.log('📋 Real data fields:', Object.keys(result.character).join(', '));
        
        // Check for missing fields
        const mockFields = new Set(Object.keys(mockData));
        const realFields = new Set(Object.keys(result.character));
        
        const missingInReal = [...mockFields].filter(field => !realFields.has(field));
        const extraInReal = [...realFields].filter(field => !mockFields.has(field));
        
        if (missingInReal.length > 0) {
          console.log('⚠️  Fields in mock but missing in real data:', missingInReal.join(', '));
        }
        if (extraInReal.length > 0) {
          console.log('ℹ️  Extra fields in real data:', extraInReal.join(', '));
        }
        
        console.log('✅ Data structure comparison complete');
      } else {
        console.log('📝 No mock data found for comparison');
      }
    } catch (error) {
      console.log('⚠️  Could not compare with mock data:', error.message);
    }
    
    console.log('\n🎉 SUCCESS: Real D&D Beyond API integration working!');
    console.log('✅ ddb-proxy connection established');
    console.log('✅ Cobalt token authentication successful');
    console.log('✅ Character data fetched from D&D Beyond');
    console.log('✅ Real data saved for parser testing');
    console.log('✅ Data structure analysis complete');
    
    console.log('\n📝 Next Steps:');
    console.log('1. Run CharacterParser with this real data');
    console.log('2. Update parsers for any differences found');
    console.log('3. Test spell and item import with real data');
    console.log('4. Test full character import in FoundryVTT');
    console.log(`5. Files saved: ${files.characterFile} and ${files.fullResponseFile}`);
    
  } catch (error) {
    console.error('\n💥 Unexpected error:', error);
  }
}

// Run the test
main().catch(console.error);
