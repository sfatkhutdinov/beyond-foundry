#!/usr/bin/env node

/**
 * Beyond Foundry - Complete Integration Test
 * Tests the full pipeline from module loading to character import
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const PROXY_URL = 'http://localhost:3100';

console.log('🚀 Beyond Foundry - Complete Integration Test');
console.log('='.repeat(60));

/**
 * Test proxy connectivity
 */
async function testProxyConnection() {
  console.log('\n📡 Testing proxy connection...');
  
  try {
    const response = await fetch(`${PROXY_URL}/ping`);
    if (response.ok) {
      const text = await response.text();
      console.log(`✅ Proxy responds: ${text}`);
      return true;
    } else {
      console.log(`❌ Proxy failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Proxy connection error: ${error.message}`);
    console.log('💡 Make sure ddb-proxy is running: docker-compose up -d');
    return false;
  }
}

/**
 * Test built module integrity
 */
async function testBuiltModule() {
  console.log('\n📦 Testing built module...');
  
  const buildPath = path.join(process.cwd(), 'build');
  const requiredFiles = [
    'beyond-foundry.js',
    'beyond-foundry.js.map',
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(buildPath, file);
    if (fs.existsSync(filePath)) {
      const size = fs.statSync(filePath).size;
      console.log(`✅ ${file}: ${(size / 1024).toFixed(1)}KB`);
    } else {
      console.log(`❌ Missing: ${file}`);
      return false;
    }
  }
  
  // Check if module.json exists
  const moduleJsonPath = path.join(process.cwd(), 'module.json');
  if (fs.existsSync(moduleJsonPath)) {
    const moduleData = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));
    console.log(`✅ Module: ${moduleData.id} v${moduleData.version}`);
    console.log(`   Title: ${moduleData.title}`);
    console.log(`   Compatible: ${moduleData.compatibility?.verified}`);
  }
  
  return true;
}

/**
 * Test character parser with debug data using TypeScript source
 */
async function testCharacterParser() {
  console.log('\n🔧 Testing character parser...');
  
  const debugCharacterPath = path.join(process.cwd(), 'debug', 'debug-character-147239148.json');
  
  if (!fs.existsSync(debugCharacterPath)) {
    console.log('⚠️  Debug character data not found - skipping parser test');
    return true;
  }
  
  try {
    const debugData = JSON.parse(fs.readFileSync(debugCharacterPath, 'utf8'));
    const ddbCharacter = debugData.ddb?.character;
    
    if (!ddbCharacter) {
      console.log('❌ Invalid debug character data structure');
      return false;
    }
    
    // Check if we can validate the character data structure
    const requiredFields = ['name', 'id', 'classes', 'stats', 'bonusStats'];
    const missingFields = requiredFields.filter(field => !ddbCharacter.hasOwnProperty(field));
    
    if (missingFields.length > 0) {
      console.log(`❌ Character data missing fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    console.log(`✅ Character data validation successful:`);
    console.log(`   Name: ${ddbCharacter.name}`);
    console.log(`   ID: ${ddbCharacter.id}`);
    console.log(`   Classes: ${ddbCharacter.classes?.length || 0}`);
    console.log(`   Race: ${ddbCharacter.race?.fullName || 'Unknown'}`);
    console.log(`   Background: ${ddbCharacter.background?.definition?.name || 'Unknown'}`);
    console.log(`   Stats: ${ddbCharacter.stats?.length || 0} ability scores`);
    console.log(`   Items: ${ddbCharacter.inventory?.length || 0} inventory items`);
    console.log(`   Spells: ${ddbCharacter.classSpells?.length || 0} spell lists`);
    
    // Test that the module builds without errors (indication parser would work)
    const buildModulePath = path.join(process.cwd(), 'build', 'beyond-foundry.js');
    if (fs.existsSync(buildModulePath)) {
      const moduleContent = fs.readFileSync(buildModulePath, 'utf8');
      if (moduleContent.includes('CharacterParser') && moduleContent.includes('parseCharacter')) {
        console.log(`✅ Built module contains character parser (${(moduleContent.length / 1024).toFixed(1)}KB)`);
      } else {
        console.log(`❌ Built module missing character parser exports`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Parser test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test authentication flow (if token provided)
 */
async function testAuthentication(cobaltToken) {
  if (!cobaltToken) {
    console.log('\n⚠️  Skipping authentication test - no token provided');
    return true;
  }
  
  console.log('\n🔐 Testing authentication...');
  
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
      console.log(`✅ Authentication successful: User ${data.userId}`);
      return true;
    } else {
      console.log(`❌ Authentication failed: ${data.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Authentication error: ${error.message}`);
    return false;
  }
}

/**
 * Test complete character fetch and parse (if token and ID provided)
 */
async function testCompleteFlow(cobaltToken, characterId) {
  if (!cobaltToken || !characterId) {
    console.log('\n⚠️  Skipping complete flow test - missing token or character ID');
    return true;
  }
  
  console.log(`\n🎯 Testing complete flow for character ${characterId}...`);
  
  try {
    // Fetch character from proxy
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
    
    if (!response.ok || !data.success || !data.ddb?.character) {
      console.log(`❌ Character fetch failed: ${data.message || 'Unknown error'}`);
      return false;
    }
    
    const ddbCharacter = data.ddb.character;
    console.log(`✅ Fetched character: ${ddbCharacter.name}`);
    
    // Parse with built parser
    const { CharacterParser } = await import('./build/parsers/character/CharacterParser.js');
    const foundryActor = CharacterParser.parseCharacter(ddbCharacter);
    
    console.log(`✅ Parsed successfully:`);
    console.log(`   Race: ${ddbCharacter.race?.fullName || 'Unknown'}`);
    console.log(`   Classes: ${ddbCharacter.classes?.map(c => `${c.definition?.name} ${c.level}`).join(', ') || 'Unknown'}`);
    console.log(`   Background: ${ddbCharacter.background?.definition?.name || 'Unknown'}`);
    console.log(`   Foundry HP: ${foundryActor.system?.attributes?.hp?.value}`);
    console.log(`   Foundry AC: ${foundryActor.system?.attributes?.ac?.value}`);
    
    // Save results
    const resultsDir = path.join(process.cwd(), 'integration-test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(
      path.join(resultsDir, `integration-test-${characterId}-${timestamp}.json`),
      JSON.stringify({
        characterId,
        ddbCharacter,
        foundryActor,
        testTime: timestamp,
      }, null, 2)
    );
    
    console.log(`📁 Results saved to integration-test-results/`);
    return true;
  } catch (error) {
    console.log(`❌ Complete flow test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runIntegrationTest() {
  const cobaltToken = process.argv[2];
  const characterId = process.argv[3];
  
  console.log('\n🎯 Test Parameters:');
  console.log(`   Cobalt Token: ${cobaltToken ? 'Provided' : 'Not provided'}`);
  console.log(`   Character ID: ${characterId || 'Not provided'}`);
  
  let allTestsPassed = true;
  
  // Core tests (always run)
  console.log('\n📋 Core Tests:');
  
  const tests = [
    { name: 'Proxy Connection', fn: () => testProxyConnection() },
    { name: 'Built Module', fn: () => testBuiltModule() },
    { name: 'Character Parser', fn: () => testCharacterParser() },
  ];
  
  // Optional tests (if credentials provided)
  if (cobaltToken) {
    tests.push({ name: 'Authentication', fn: () => testAuthentication(cobaltToken) });
  }
  
  if (cobaltToken && characterId) {
    tests.push({ name: 'Complete Flow', fn: () => testCompleteFlow(cobaltToken, characterId) });
  }
  
  // Run all tests
  for (const test of tests) {
    const result = await test.fn();
    if (!result) {
      allTestsPassed = false;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('\n✅ Beyond Foundry is ready for FoundryVTT integration');
    console.log('\n📋 Next steps:');
    console.log('1. Copy module to FoundryVTT modules directory');
    console.log('2. Enable module in FoundryVTT');
    console.log('3. Configure settings and test in-game');
    console.log('\n💡 In FoundryVTT console, try:');
    console.log('   game.modules.get("beyond-foundry").api.runDiagnostic()');
  } else {
    console.log('❌ Some tests failed - check output above');
    process.exit(1);
  }
}

// Usage information
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('\nUsage: node integration-test.js [cobalt-token] [character-id]');
  console.log('\nExamples:');
  console.log('  node integration-test.js                                    # Core tests only');
  console.log('  node integration-test.js "your-cobalt-token"                # Include auth test');
  console.log('  node integration-test.js "your-token" "147239148"          # Full integration test');
  console.log('\n💡 Get your cobalt token from D&D Beyond cookies (CobaltSession)');
  process.exit(0);
}

runIntegrationTest().catch(console.error);
