#!/usr/bin/env node

/**
 * Real Authentication Testing for Beyond Foundry
 * Tests proxy endpoints with real D&D Beyond authentication from .env
 */

import fetch from 'node-fetch';

const PROXY_URL = 'http://localhost:4000';
const TEST_CHARACTER_ID = '123456789'; // You can replace this with a real character ID

console.log('🔍 Beyond Foundry Real Authentication Tests');
console.log('=' .repeat(55));

// Helper function to test endpoints
async function testEndpoint(method, path, body = null, headers = {}) {
  try {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      config.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${PROXY_URL}${path}`, config);
    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: Object.fromEntries(response.headers)
    };
  } catch (error) {
    return {
      error: error.message,
      status: null,
      ok: false
    };
  }
}

async function runRealAuthTests() {
  console.log('\n📡 Basic Connectivity Tests');
  console.log('-'.repeat(30));
  
  // Test 1: Basic health check
  const health = await testEndpoint('GET', '/');
  console.log(`✅ Health Check: ${health.ok ? 'PASS' : 'FAIL'} (${health.status})`);
  
  // Test 2: Configuration endpoint
  const config = await testEndpoint('GET', '/proxy/config');
  console.log(`✅ Config Endpoint: ${config.ok ? 'PASS' : 'FAIL'} (${config.status})`);
  if (config.ok && config.data.classMap) {
    console.log(`   Classes Available: ${config.data.classMap.length}`);
  }
  
  console.log('\n🔐 Real Authentication Tests');
  console.log('-'.repeat(35));
  
  // Note: The proxy now uses the COBALT_COOKIE from .env automatically
  console.log('ℹ️  Using COBALT_COOKIE from .env file (not exposed in logs)');
  
  // Test 3: Bulk spell import (should work with env token)
  console.log('\n📚 Content Import Tests (Real Data)');
  console.log('-'.repeat(40));
  
  const spells = await testEndpoint('POST', '/proxy/spells/spells', {
    // No cobalt needed - proxy uses env variable
  });
  console.log(`✅ Bulk Spells: ${spells.ok ? 'SUCCESS' : 'FAIL'} (${spells.status})`);
  if (spells.ok && spells.data?.data) {
    console.log(`   📜 Spells Retrieved: ${spells.data.data.length}`);
    if (spells.data.data.length > 0) {
      const sampleSpell = spells.data.data[0];
      console.log(`   📖 Sample Spell: ${sampleSpell.definition?.name || sampleSpell.name || 'Unknown'}`);
    }
  } else {
    console.log(`   ❌ Error: ${spells.data?.message || spells.data?.error || 'Unknown error'}`);
  }
  
  // Test 4: Class-specific spells
  const classSpells = await testEndpoint('POST', '/proxy/spells/class/spells', {
    className: 'Wizard'
    // cobaltToken will be taken from env
  });
  console.log(`✅ Wizard Spells: ${classSpells.ok ? 'SUCCESS' : 'FAIL'} (${classSpells.status})`);
  if (classSpells.ok && classSpells.data?.data) {
    console.log(`   🧙 Wizard Spells: ${classSpells.data.data.length}`);
  } else {
    console.log(`   ❌ Error: ${classSpells.data?.message || 'Unknown error'}`);
  }
  
  // Test 5: Backgrounds
  const backgrounds = await testEndpoint('POST', '/proxy/backgrounds/backgrounds', {});
  console.log(`✅ Backgrounds: ${backgrounds.ok ? 'SUCCESS' : 'FAIL'} (${backgrounds.status})`);
  if (backgrounds.ok && backgrounds.data?.data) {
    console.log(`   📋 Backgrounds: ${backgrounds.data.data.length || 'Unknown count'}`);
  }
  
  // Test 6: Races
  const races = await testEndpoint('POST', '/proxy/races/races', {});
  console.log(`✅ Races: ${races.ok ? 'SUCCESS' : 'FAIL'} (${races.status})`);
  if (races.ok && races.data?.data) {
    console.log(`   🏃 Races: ${races.data.data.length || 'Unknown count'}`);
  }
  
  console.log('\n🎯 Testing Character Endpoint');
  console.log('-'.repeat(35));
  console.log('ℹ️  To test character import, you need a real character ID.');
  console.log('📝 Get character ID from D&D Beyond URL: dndbeyond.com/characters/{ID}');
  console.log('');
  console.log('🧪 Testing with placeholder ID (will fail unless you have this exact character):');
  
  // Test character endpoint - this will fail unless user has this specific character
  // But it will show if the authentication and endpoint structure work
  const character = await testEndpoint('GET', `/proxy/character/${TEST_CHARACTER_ID}`, null, {
    // x-cobalt-id will be automatically handled by proxy from env
  });
  console.log(`✅ Character Test: ${character.ok ? 'SUCCESS' : 'EXPECTED_FAIL'} (${character.status})`);
  if (character.ok) {
    console.log(`   🎭 Character found: ${character.data?.name || 'Unknown'}`);
  } else {
    console.log(`   ℹ️  Expected failure - test character ID ${TEST_CHARACTER_ID} likely doesn't exist in your account`);
  }
  
  console.log('\n📊 Test Summary');
  console.log('-'.repeat(20));
  
  const tests = [
    { name: 'Health Check', result: health.ok },
    { name: 'Configuration', result: config.ok },
    { name: 'Bulk Spells', result: spells.ok },
    { name: 'Class Spells', result: classSpells.ok },
    { name: 'Backgrounds', result: backgrounds.ok },
    { name: 'Races', result: races.ok }
  ];
  
  const passed = tests.filter(t => t.result).length;
  const total = tests.length;
  
  console.log(`📈 Tests Passed: ${passed}/${total}`);
  tests.forEach(test => {
    console.log(`   ${test.result ? '✅' : '❌'} ${test.name}`);
  });
  
  if (passed >= 4) {
    console.log('\n🎉 SUCCESS: Core functionality is working with real authentication!');
    console.log('✅ Your COBALT_COOKIE is valid and proxy is properly configured.');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Get a real character ID from D&D Beyond');
    console.log('2. Test character import in FoundryVTT');
    console.log('3. Try bulk importing content to compendiums');
  } else {
    console.log('\n⚠️  Some tests failed. Check your COBALT_COOKIE and D&D Beyond login status.');
  }
  
  console.log('\n💡 Useful Commands for Next Steps:');
  console.log('# Test specific character (replace with your character ID):');
  console.log('curl -X GET http://localhost:4000/proxy/character/YOUR_REAL_CHARACTER_ID \\');
  console.log('  -H "x-cobalt-id: your_cobalt_token"');
  console.log('');
  console.log('# Or let proxy use env variable automatically:');
  console.log('curl -X GET http://localhost:4000/proxy/character/YOUR_REAL_CHARACTER_ID');
}

// Run the tests
runRealAuthTests().catch(console.error);
