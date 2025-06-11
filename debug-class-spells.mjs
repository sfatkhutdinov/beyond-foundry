#!/usr/bin/env node

/**
 * Import All Class Spells
 * Cycles through all D&D classes and exports their spells as JSON
 */

import fs from 'fs';
import path from 'path';

const PROXY_URL = 'http://localhost:4000';

// All D&D 5e classes
const DND_CLASSES = [
    'Artificer',
    'Barbarian', 
    'Bard',
    'Cleric',
    'Druid',
    'Fighter',
    'Monk',
    'Paladin',
    'Ranger',
    'Rogue',
    'Sorcerer',
    'Warlock',
    'Wizard'
];

async function importAllClassSpells() {
    try {
        // Get COBALT_COOKIE
        const envPath = path.join(process.cwd(), 'beyond-foundry-proxy', '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const cobaltMatch = envContent.match(/COBALT_COOKIE=(.+)/);
        const cobaltCookie = cobaltMatch ? cobaltMatch[1].trim() : null;

        if (!cobaltCookie) {
            console.error('❌ COBALT_COOKIE not found in .env file');
            process.exit(1);
        }

        // Get Bearer token
        console.error('🔑 Getting Bearer token...');
        const authResponse = await fetch(`${PROXY_URL}/proxy/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 'import_user', cobalt: cobaltCookie })
        });

        if (!authResponse.ok) {
            console.error('❌ Failed to get Bearer token');
            process.exit(1);
        }

        const authData = await authResponse.json();
        const bearerToken = authData.token;
        console.error(`✅ Bearer token obtained`);

        // Collect all spells data
        const allClassSpells = {};
        let totalSpells = 0;

        // Process each class
        for (const className of DND_CLASSES) {
            console.error(`📚 Processing ${className} spells...`);
            
            const response = await fetch(`${PROXY_URL}/proxy/spells/class/spells`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    className: className,
                    cobaltToken: bearerToken
                })
            });

            if (!response.ok) {
                console.error(`❌ Failed to fetch ${className} spells: ${response.status}`);
                continue;
            }

            const data = await response.json();
            
            if (data.success && (data.spells || data.data)) {
                const spells = data.spells || data.data || [];
                allClassSpells[className] = spells;
                totalSpells += spells.length;
                console.error(`✅ ${className}: ${spells.length} spells`);
            } else {
                console.error(`⚠️  ${className}: No spells found or API error`);
                allClassSpells[className] = [];
            }

            // Small delay to be nice to the API
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.error(`\n📊 Total: ${totalSpells} spells across ${DND_CLASSES.length} classes`);
        console.error('🎯 Outputting JSON...\n');

        // Output the final JSON to stdout
        const output = {
            timestamp: new Date().toISOString(),
            totalSpells: totalSpells,
            classes: allClassSpells
        };

        console.log(JSON.stringify(output, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

importAllClassSpells();