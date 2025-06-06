#!/usr/bin/env node

/**
 * Debug Character Data Script
 * Shows raw character data response from ddb-proxy
 */

import fetch from 'node-fetch';

const PROXY_ENDPOINT = 'http://localhost:3100';

async function debugCharacterData(cobaltToken, characterId) {
  console.log('🔍 Debugging Character Data Response\n');
  
  try {
    console.log(`📡 Making request to: ${PROXY_ENDPOINT}/proxy/character`);
    console.log(`📋 Character ID: ${characterId}`);
    console.log(`🔑 Cobalt token length: ${cobaltToken.length} characters\n`);
    
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

    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    const rawText = await response.text();
    console.log(`📊 Raw response length: ${rawText.length} characters\n`);
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(rawText);
      console.log('✅ Response is valid JSON');
    } catch (parseError) {
      console.log('❌ Response is not valid JSON');
      console.log('📄 Raw response text:');
      console.log(rawText.substring(0, 1000)); // First 1000 chars
      return;
    }
    
    console.log('\n📋 Response Structure:');
    console.log(`  - success: ${data.success}`);
    console.log(`  - message: ${data.message || 'none'}`);
    console.log(`  - character exists: ${!!data.character}`);
    
    // Save the raw data for inspection regardless
    const fs = await import('fs');
    const outputFile = `./debug-character-${characterId}.json`;
    fs.default.writeFileSync(outputFile, JSON.stringify(data, null, 2));
    console.log(`\n💾 Full response saved to: ${outputFile}`);
    
    if (data.character) {
      console.log('\n🧙 Character Object Structure:');
      console.log(`  - id: ${data.character.id}`);
      console.log(`  - name: ${data.character.name}`);
      console.log(`  - Object keys: ${Object.keys(data.character).length}`);
      console.log(`  - Top-level keys: ${Object.keys(data.character).slice(0, 10).join(', ')}`);
    } else {
      console.log('\n❌ Character data is false/null');
      console.log('   This usually means:');
      console.log('   - Character ID doesn\'t exist');
      console.log('   - Character is private/not shared');
      console.log('   - Character doesn\'t belong to this account');
    }
    
    if (!data.success) {
      console.log(`\n❌ Request failed: ${data.message}`);
      if (data.error) {
        console.log(`❌ Error details: ${data.error}`);
      }
    }
    
  } catch (error) {
    console.error(`💥 Network error: ${error.message}`);
    console.error(error.stack);
  }
}

// Main execution
const cobaltToken = process.argv[2];
const characterId = process.argv[3] || '147239148';

if (!cobaltToken) {
  console.log('❌ Usage: node debug-character.js <cobalt-token> [character-id]');
  process.exit(1);
}

debugCharacterData(cobaltToken, characterId).catch(error => {
  console.error(`Debug failed: ${error.message}`);
  process.exit(1);
});
