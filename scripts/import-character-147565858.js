#!/usr/bin/env node

/**
 * Character Import Script for Character ID 147565858
 * This script fetches the complete raw character data from D&D Beyond
 * and saves it as 147565858.json in the tests directory
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROXY_ENDPOINT = 'http://localhost:3100';
const CHARACTER_ID = process.argv[3] || '147565858';
const OUTPUT_FILE = `${CHARACTER_ID}.json`;

console.log('🎭 Character Import Tool for D&D Beyond');
console.log('='*50);
console.log(`📋 Target Character: ${CHARACTER_ID}`);
console.log(`📁 Output File: ${OUTPUT_FILE}`);

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
    console.log('💡 Make sure ddb-proxy is running on localhost:3100');
    return false;
  }
}

/**
 * Test authentication with provided token
 */
async function testAuthentication(cobaltToken) {
  console.log('\n🔐 Testing authentication...');
  
  if (!cobaltToken || cobaltToken.length < 10) {
    console.log('❌ Invalid cobalt token provided');
    return false;
  }
  
  console.log(`✅ Cobalt token loaded: ${cobaltToken.substring(0, 20)}...`);
  
  try {
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
 * Fetch character data from D&D Beyond
 */
async function fetchCharacterData(cobaltToken, characterId) {
  console.log(`\n🎯 Fetching character data for ID: ${characterId}...`);
  
  try {
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
        console.log('✅ Successfully fetched character data');
        console.log(`📊 Character: ${character.name || 'Unknown'}`);
        console.log(`🎭 Race: ${character.race?.fullName || 'Unknown'}`);
        console.log(`⚔️ Classes: ${character.classes?.map(c => `${c.definition?.name || 'Unknown'} (Level ${c.level})`).join(', ') || 'Unknown'}`);
        console.log(`❤️ Hit Points: ${character.baseHitPoints || 'Unknown'}`);
        console.log(`🎒 Items: ${character.inventory?.length || 0}`);
        console.log(`✨ Spells: ${Object.values(character.spells || {}).reduce((sum, spellArray) => sum + (Array.isArray(spellArray) ? spellArray.length : 0), 0)}`);
        
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
 * Save character data to tests directory
 */
async function saveCharacterData(character, outputFilename) {
  const testsDir = path.join(__dirname, '..', 'tests');
  const outputPath = path.join(testsDir, outputFilename);
  
  try {
    // Ensure tests directory exists
    if (!fs.existsSync(testsDir)) {
      fs.mkdirSync(testsDir, { recursive: true });
    }
    
    // Save the complete character data as JSON
    fs.writeFileSync(outputPath, JSON.stringify(character, null, 2));
    console.log(`💾 Successfully saved character data to: ${outputPath}`);
    
    // Show file size and summary
    const stats = fs.statSync(outputPath);
    console.log(`📏 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    return outputPath;
  } catch (error) {
    console.log(`❌ Error saving character data: ${error.message}`);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Get cobalt token from command line argument
    const cobaltToken = process.argv[2];
    
    if (!cobaltToken) {
      console.log('\n❌ Missing cobalt token argument');
      console.log('\n📝 Usage:');
      console.log('  node import-character-147565858.js <cobalt-token> [character-id]');
      console.log('\n💡 To get your cobalt token:');
      console.log('  1. Go to dndbeyond.com and log in');
      console.log('  2. Open browser dev tools (F12)');
      console.log('  3. Go to Application/Storage > Cookies > dndbeyond.com');
      console.log('  4. Find and copy the "CobaltSession" cookie value');
      console.log('\n🔗 Character URL: https://www.dndbeyond.com/characters/147565858');
      return;
    }
    
    // Step 1: Test proxy connection
    const proxyConnected = await testProxyConnection();
    if (!proxyConnected) {
      console.log('\n❌ Cannot continue without ddb-proxy connection');
      console.log('💡 Start ddb-proxy with: npm start (in ddb-proxy directory)');
      return;
    }
    
    // Step 2: Test authentication
    const authValid = await testAuthentication(cobaltToken);
    if (!authValid) {
      console.log('\n❌ Cannot continue without valid authentication');
      console.log('💡 Make sure your cobalt token is valid and current');
      return;
    }
    
    // Step 3: Fetch the specific character
    console.log(`\n🎯 Fetching character ${CHARACTER_ID} from D&D Beyond...`);
    console.log(`🔗 Character URL: https://www.dndbeyond.com/characters/${CHARACTER_ID}`);
    
    const result = await fetchCharacterData(cobaltToken, CHARACTER_ID);
    if (!result.success) {
      console.log('\n❌ Failed to fetch character data');
      console.log(`💡 Error: ${result.error}`);
      console.log('💡 Make sure the character ID is correct and accessible with your account');
      console.log('💡 You may need to have access to view this character');
      return;
    }
    
    // Step 4: Save the character data
    const savedPath = await saveCharacterData(result.character, OUTPUT_FILE);
    
    // Step 5: Success summary
    console.log('\n🎉 Character import completed successfully!');
    console.log(`📁 Character data saved to: ${savedPath}`);
    console.log(`📊 Character: ${result.character.name}`);
    console.log(`🆔 D&D Beyond ID: ${CHARACTER_ID}`);
    
    console.log('\n📝 Next Steps:');
    console.log('1. The character data is now available for testing');
    console.log('2. Use this data to validate the CharacterParser');
    console.log('3. Run tests with the real character data');
    console.log('4. Update parsers if any issues are found');
    
  } catch (error) {
    console.error('\n💥 Unexpected error:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure ddb-proxy is running on localhost:3100');
    console.log('2. Verify your cobalt token is valid');
    console.log('3. Check that you have access to the character');
    console.log('4. Ensure network connectivity to D&D Beyond');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { fetchCharacterData, saveCharacterData };
