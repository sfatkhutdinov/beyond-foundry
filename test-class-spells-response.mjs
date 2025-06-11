#!/usr/bin/env node

/**
 * Quick test to see the exact response format from class spells endpoint
 */

import fs from 'fs';
import path from 'path';

const PROXY_URL = 'http://localhost:4000';

async function testClassSpellsResponse() {
    try {
        // Get COBALT_COOKIE and Bearer token
        const envPath = path.join(process.cwd(), 'beyond-foundry-proxy', '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const cobaltMatch = envContent.match(/COBALT_COOKIE=(.+)/);
        const cobaltCookie = cobaltMatch ? cobaltMatch[1].trim() : null;

        const authResponse = await fetch(`${PROXY_URL}/proxy/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 'test_user', cobalt: cobaltCookie })
        });

        const authData = await authResponse.json();
        const bearerToken = authData.token;

        // Test class spells endpoint
        console.log('🧪 Testing class spells endpoint response structure...');
        
        const response = await fetch(`${PROXY_URL}/proxy/spells/class/spells`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                className: 'Wizard',
                cobaltToken: bearerToken
            })
        });

        console.log(`Response status: ${response.status}`);
        console.log(`Response ok: ${response.ok}`);

        const data = await response.json();
        console.log('\n📊 Response structure:');
        console.log('Top-level keys:', Object.keys(data));
        
        if (data.success !== undefined) {
            console.log('success:', data.success);
        }
        
        if (data.message) {
            console.log('message:', data.message);
        }
        
        if (data.spells) {
            console.log('spells array length:', data.spells.length);
        }
        
        if (data.data) {
            console.log('data property length:', data.data.length);
        }

        // Show first spell structure if available
        const spells = data.spells || data.data || [];
        if (spells.length > 0) {
            console.log('\n🔍 First spell keys:', Object.keys(spells[0]));
            console.log('First spell name:', spells[0].definition?.name || spells[0].name || 'Unknown');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testClassSpellsResponse();
