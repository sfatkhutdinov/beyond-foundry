#!/usr/bin/env node

/**
 * Comprehensive Beyond Foundry Proxy Endpoint Testing
 * Tests all available proxy endpoints and validates configuration
 */

import fetch from 'node-fetch';

const PROXY_URL = 'http://localhost:4000';
const TEST_TOKEN = 'test_token_invalid';
const TEST_CHARACTER_ID = '123456789';

console.log('🔍 Beyond Foundry Proxy Endpoint Analysis');
console.log('=' .repeat(50));

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

async function runTests() {
  console.log('\n📡 Basic Connectivity Tests');
  console.log('-'.repeat(30));
  
  // Test 1: Basic health check
  const health = await testEndpoint('GET', '/');
  console.log(`✅ Health Check: ${health.ok ? 'PASS' : 'FAIL'} (${health.status})`);
  if (health.data) console.log(`   Response: ${health.data}`);
  
  // Test 2: Configuration endpoint
  const config = await testEndpoint('GET', '/proxy/config');
  console.log(`✅ Config Endpoint: ${config.ok ? 'PASS' : 'FAIL'} (${config.status})`);
  if (config.ok && config.data.classMap) {
    console.log(`   Classes Available: ${config.data.classMap.length}`);
    console.log(`   Sample Classes: ${config.data.classMap.slice(0, 3).map(c => c.name).join(', ')}`);
  }
  
  console.log('\n🔐 Authentication Tests');
  console.log('-'.repeat(30));
  
  // Test 3: Auth token endpoint
  const auth = await testEndpoint('POST', '/proxy/auth/token', {
    id: 'test_user',
    cobalt: TEST_TOKEN
  });
  console.log(`✅ Auth Token: ${auth.status === 401 ? 'EXPECTED_FAIL' : auth.ok ? 'PASS' : 'FAIL'} (${auth.status})`);
  console.log(`   Response: ${auth.data?.error || auth.data?.message || auth.data}`);
  
  console.log('\n📚 Content Endpoint Tests');
  console.log('-'.repeat(30));
  
  // Test 4: Spells endpoint (bulk)
  const spells = await testEndpoint('POST', '/proxy/spells/spells', {
    cobalt: TEST_TOKEN
  });
  console.log(`✅ Spells (Bulk): ${spells.ok ? 'PASS' : 'FAIL'} (${spells.status})`);
  if (spells.ok && spells.data) {
    console.log(`   Spells Returned: ${spells.data.data?.length || 0}`);
  }
  
  // Test 5: Class spells endpoint
  const classSpells = await testEndpoint('POST', '/proxy/spells/class/spells', {
    className: 'Wizard',
    cobaltToken: TEST_TOKEN
  });
  console.log(`✅ Class Spells: ${classSpells.status === 401 ? 'EXPECTED_FAIL' : classSpells.ok ? 'PASS' : 'FAIL'} (${classSpells.status})`);
  
  // Test 6: Character endpoint
  const character = await testEndpoint('GET', `/proxy/character/${TEST_CHARACTER_ID}`, null, {
    'x-cobalt-id': TEST_TOKEN
  });
  console.log(`✅ Character: ${character.status === 500 ? 'EXPECTED_FAIL' : character.ok ? 'PASS' : 'FAIL'} (${character.status})`);
  
  // Test 7: Backgrounds endpoint
  const backgrounds = await testEndpoint('POST', '/proxy/backgrounds/backgrounds', {
    cobalt: TEST_TOKEN
  });
  console.log(`✅ Backgrounds: ${backgrounds.status === 401 ? 'EXPECTED_FAIL' : backgrounds.ok ? 'PASS' : 'FAIL'} (${backgrounds.status})`);
  
  // Test 8: Races endpoint  
  const races = await testEndpoint('POST', '/proxy/races/races', {
    cobalt: TEST_TOKEN
  });
  console.log(`✅ Races: ${races.status === 401 ? 'EXPECTED_FAIL' : races.ok ? 'PASS' : 'FAIL'} (${races.status})`);
  
  // Test 9: Feats endpoint
  const feats = await testEndpoint('POST', '/proxy/feats/feats', {
    cobalt: TEST_TOKEN
  });
  console.log(`✅ Feats: ${feats.status === 401 ? 'EXPECTED_FAIL' : feats.ok ? 'PASS' : 'FAIL'} (${feats.status})`);
  
  console.log('\n📋 Available Proxy Routes Summary');
  console.log('-'.repeat(40));
  
  // Summary based on discovered endpoints
  const routes = [
    'GET  /                           - Health check',
    'GET  /proxy/config               - Configuration & class mappings',
    'POST /proxy/auth/token           - Authentication (needs id + cobalt)',
    'POST /proxy/spells/spells        - Bulk spell import',
    'POST /proxy/spells/class/spells  - Class-specific spells',
    'GET  /proxy/character/:id        - Character data (needs x-cobalt-id header)',
    'POST /proxy/items                - Item import',
    'POST /proxy/monsters             - Monster import',
    'POST /proxy/backgrounds          - Background import',
    'POST /proxy/races                - Race import',
    'POST /proxy/feats                - Feat import',
    'POST /proxy/class                - Class import',
    'POST /proxy/campaign             - Campaign data',
    'POST /proxy/adventures           - Adventure import',
    'POST /proxy/rules                - Rules import'
  ];
  
  routes.forEach(route => console.log(`  ${route}`));
  
  console.log('\n🔗 Main Module Connection Test');
  console.log('-'.repeat(35));
  
  // Test main module configuration matches
  const proxyUrl = config.ok ? PROXY_URL : 'UNKNOWN';
  console.log(`  Proxy URL: ${proxyUrl}`);
  console.log(`  Config Loaded: ${config.ok ? 'YES' : 'NO'}`);
  console.log(`  Docker Network: ${process.env.NODE_ENV === 'production' ? 'LIKELY' : 'LOCAL_DEV'}`);
  
  console.log('\n💡 Next Steps for Testing with Real Data');
  console.log('-'.repeat(45));
  console.log('1. Get your CobaltSession token from D&D Beyond:');
  console.log('   - Login to dndbeyond.com');
  console.log('   - Open browser dev tools (F12)');
  console.log('   - Go to Application/Storage > Cookies');
  console.log('   - Copy the "CobaltSession" cookie value');
  console.log('');
  console.log('2. Test authentication:');
  console.log(`   curl -X POST ${PROXY_URL}/proxy/auth/token \\`);
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"id": "your_username", "cobalt": "YOUR_COBALT_TOKEN"}\'');
  console.log('');
  console.log('3. Test character import:');
  console.log(`   curl -X GET ${PROXY_URL}/proxy/character/YOUR_CHARACTER_ID \\`);
  console.log('     -H "x-cobalt-id: YOUR_COBALT_TOKEN"');
  console.log('');
  console.log('4. In FoundryVTT, test module connection:');
  console.log('   game.modules.get("beyond-foundry").api.testProxyConnection()');
}

// Run the tests
runTests().catch(console.error);
