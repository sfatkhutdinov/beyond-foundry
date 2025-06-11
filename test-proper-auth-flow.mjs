#!/usr/bin/env node

/**
 * Proper Authentication Flow Test for Beyond Foundry Proxy
 * 1. Read COBALT_COOKIE from .env
 * 2. Exchange it for Bearer token via /proxy/auth/token
 * 3. Use Bearer token for API calls
 */

import fs from 'fs';
import path from 'path';

const PROXY_URL = 'http://localhost:4000';

// Read COBALT_COOKIE from .env file
function readCobaltFromEnv() {
    try {
        const envPath = path.join(process.cwd(), 'beyond-foundry-proxy', '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        const cobaltMatch = envContent.match(/COBALT_COOKIE=(.+)/);
        if (cobaltMatch) {
            return cobaltMatch[1].trim();
        }
        return null;
    } catch (error) {
        console.error('Error reading .env file:', error.message);
        return null;
    }
}

async function testProperAuthFlow() {
    console.log('🔐 Beyond Foundry Proper Authentication Flow Test');
    console.log('='.repeat(60));
    
    // Step 1: Get COBALT_COOKIE from .env
    const cobaltCookie = readCobaltFromEnv();
    if (!cobaltCookie) {
        console.log('❌ Failed to read COBALT_COOKIE from .env file');
        return;
    }
    
    console.log(`✅ COBALT_COOKIE loaded (length: ${cobaltCookie.length})`);
    console.log('');

    // Step 2: Exchange COBALT_COOKIE for Bearer token
    console.log('🔑 Step 1: Getting Bearer Token...');
    let bearerToken = null;
    
    try {
        const response = await fetch(`${PROXY_URL}/proxy/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: 'test_user',
                cobalt: cobaltCookie
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            bearerToken = data.token;
            console.log(`✅ Bearer Token obtained: ${bearerToken.substring(0, 30)}...`);
        } else {
            const text = await response.text();
            console.log(`❌ Failed to get Bearer Token: ${response.status} - ${text}`);
            return;
        }
    } catch (error) {
        console.log(`❌ Auth Token Failed: ${error.message}`);
        return;
    }
    console.log('');

    // Step 3: Test endpoints with Bearer token
    console.log('📚 Step 2: Testing Bulk Spells with Bearer Token...');
    try {
        const response = await fetch(`${PROXY_URL}/proxy/spells/spells`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                cobalt: bearerToken // Use Bearer token, not COBALT_COOKIE
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Bulk Spells: ${response.status}`);
            console.log(`   Success: ${data.success}`);
            console.log(`   Spells Found: ${data.data ? data.data.length : 0}`);
            if (data.data && data.data.length > 0) {
                const sampleSpell = data.data[0];
                console.log(`   Sample Spell: ${sampleSpell.definition?.name || sampleSpell.name || 'Unknown'}`);
            }
        } else {
            const text = await response.text();
            console.log(`❌ Bulk Spells: ${response.status} - ${text}`);
        }
    } catch (error) {
        console.log(`❌ Bulk Spells Failed: ${error.message}`);
    }
    console.log('');

    // Step 4: Test Class Spells with Bearer token
    console.log('🎯 Step 3: Testing Class Spells with Bearer Token...');
    try {
        const response = await fetch(`${PROXY_URL}/proxy/spells/class/spells`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                className: 'Wizard',
                cobaltToken: bearerToken // Use Bearer token
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Class Spells: ${response.status}`);
            console.log(`   Success: ${data.success}`);
            console.log(`   Spells Found: ${data.spells ? data.spells.length : 0}`);
            if (data.spells && data.spells.length > 0) {
                console.log(`   Sample: ${data.spells[0].name || 'Unknown'}`);
            }
        } else {
            const text = await response.text();
            console.log(`❌ Class Spells: ${response.status} - ${text}`);
        }
    } catch (error) {
        console.log(`❌ Class Spells Failed: ${error.message}`);
    }
    console.log('');

    // Step 5: Test Character endpoint with proper header
    console.log('👤 Step 4: Testing Character Endpoint...');
    try {
        const response = await fetch(`${PROXY_URL}/proxy/character/123456789`, {
            method: 'GET',
            headers: { 
                'x-cobalt-id': bearerToken // Use Bearer token in header
            }
        });
        
        const text = await response.text();
        console.log(`📊 Character Test: ${response.status}`);
        console.log(`   Response: ${text.substring(0, 150)}...`);
        
        if (response.status === 404) {
            console.log('   ✅ Authentication worked! Character not found (expected with test ID)');
        } else if (response.status === 401) {
            console.log('   ❌ Authentication failed - Bearer token might be invalid');
        } else if (response.status === 200) {
            console.log('   🎉 Character found! (Unexpected with test ID)');
        } else {
            console.log(`   ⚠️  Unexpected status: ${response.status}`);
        }
    } catch (error) {
        console.log(`❌ Character Test Failed: ${error.message}`);
    }
    console.log('');

    // Step 6: Test backgrounds with Bearer token
    console.log('📋 Step 5: Testing Backgrounds with Bearer Token...');
    try {
        const response = await fetch(`${PROXY_URL}/proxy/backgrounds/backgrounds`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                cobalt: bearerToken // Use Bearer token
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Backgrounds: ${response.status}`);
            console.log(`   Success: ${data.success}`);
            console.log(`   Backgrounds Found: ${data.data ? data.data.length : 0}`);
        } else {
            const text = await response.text();
            console.log(`❌ Backgrounds: ${response.status} - ${text}`);
        }
    } catch (error) {
        console.log(`❌ Backgrounds Failed: ${error.message}`);
    }
    console.log('');

    console.log('🎯 Authentication Flow Summary:');
    console.log('=' .repeat(35));
    console.log('1. ✅ COBALT_COOKIE → Bearer Token exchange works');
    console.log('2. 📚 Bearer Token can be used for API calls');
    console.log('3. 🔧 Main module needs to follow this flow:');
    console.log('   a. Get Bearer token from /proxy/auth/token');
    console.log('   b. Use Bearer token for all subsequent API calls');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('1. Update BeyondFoundryAPI.ts to implement proper auth flow');
    console.log('2. Store Bearer token in session/cache for reuse');
    console.log('3. Test with real character ID from D&D Beyond');
    console.log('');
    console.log('🧪 To test with your real character:');
    console.log('   1. Go to dndbeyond.com/characters');
    console.log('   2. Click on a character');
    console.log('   3. Copy the number from URL: dndbeyond.com/characters/YOUR_ID');
    console.log('   4. Replace 123456789 in tests with YOUR_ID');
}

testProperAuthFlow().catch(console.error);
