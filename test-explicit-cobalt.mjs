#!/usr/bin/env node

/**
 * Comprehensive test with explicit COBALT_COOKIE from .env
 * This test reads the .env file and passes the token explicitly to endpoints
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

async function testWithExplicitCobalt() {
    console.log('🧪 Beyond Foundry Explicit COBALT_COOKIE Tests');
    console.log('='.repeat(55));
    
    // Get the cobalt token from .env
    const cobaltToken = readCobaltFromEnv();
    if (!cobaltToken) {
        console.log('❌ Failed to read COBALT_COOKIE from .env file');
        return;
    }
    
    console.log(`✅ COBALT_COOKIE loaded from .env (length: ${cobaltToken.length})`);
    console.log(`   Token preview: ${cobaltToken.substring(0, 20)}...`);
    console.log('');

    // Test 1: Health Check
    console.log('📡 Testing Health Check...');
    try {
        const response = await fetch(`${PROXY_URL}/`);
        const text = await response.text();
        console.log(`✅ Health: ${response.status} - ${text}`);
    } catch (error) {
        console.log(`❌ Health Failed: ${error.message}`);
        return;
    }
    console.log('');

    // Test 2: Auth Token with explicit cobalt
    console.log('🔑 Testing Auth Token (explicit cobalt)...');
    try {
        const response = await fetch(`${PROXY_URL}/proxy/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: 'test_user',
                cobalt: cobaltToken
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Auth Token: ${response.status}`);
            console.log(`   Bearer Token: ${data.token ? data.token.substring(0, 30) + '...' : 'NOT_PROVIDED'}`);
        } else {
            const text = await response.text();
            console.log(`❌ Auth Token: ${response.status} - ${text}`);
        }
    } catch (error) {
        console.log(`❌ Auth Token Failed: ${error.message}`);
    }
    console.log('');

    // Test 3: Bulk Spells with explicit cobalt
    console.log('📚 Testing Bulk Spells (explicit cobalt)...');
    try {
        const response = await fetch(`${PROXY_URL}/proxy/spells/spells`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                cobalt: cobaltToken
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
                console.log(`   Spell Level: ${sampleSpell.definition?.level || 'Unknown'}`);
            }
        } else {
            const text = await response.text();
            console.log(`❌ Bulk Spells: ${response.status} - ${text}`);
        }
    } catch (error) {
        console.log(`❌ Bulk Spells Failed: ${error.message}`);
    }
    console.log('');

    // Test 4: Class Spells with explicit cobalt
    console.log('🎯 Testing Class Spells (explicit cobalt)...');
    try {
        const response = await fetch(`${PROXY_URL}/proxy/spells/class/spells`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                className: 'Wizard',
                cobaltToken: cobaltToken
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

    // Test 5: Backgrounds with explicit cobalt
    console.log('📋 Testing Backgrounds (explicit cobalt)...');
    try {
        const response = await fetch(`${PROXY_URL}/proxy/backgrounds/backgrounds`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                cobalt: cobaltToken
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

    // Test 6: Character with header auth (using env cobalt)
    console.log('👤 Testing Character (header auth)...');
    try {
        const response = await fetch(`${PROXY_URL}/proxy/character/123456789`, {
            method: 'GET',
            headers: { 
                'x-cobalt-id': '' // Empty header should use env
            }
        });
        
        const text = await response.text();
        console.log(`📊 Character: ${response.status} - ${text.substring(0, 100)}...`);
        
        if (response.status === 404) {
            console.log('   ✅ Authentication worked (character not found as expected)');
        } else if (response.status === 401) {
            console.log('   ❌ Authentication failed');
        } else if (response.status === 400) {
            console.log('   ⚠️  Bad request (might need valid character ID)');
        }
    } catch (error) {
        console.log(`❌ Character Failed: ${error.message}`);
    }
    console.log('');

    console.log('📊 Summary:');
    console.log('If auth and bulk spells succeed, your COBALT_COOKIE is valid!');
    console.log('If they fail with 401, the token may be expired or invalid.');
    console.log('');
    console.log('💡 Next steps if tests pass:');
    console.log('1. Update main module to pass cobalt token explicitly');
    console.log('2. Or modify proxy to auto-use env variable as fallback');
    console.log('3. Test with real character ID from your D&D Beyond account');
}

testWithExplicitCobalt().catch(console.error);
