#!/usr/bin/env node

import * as path from 'path';

// Dynamic import for node-fetch
const fetch = async (...args: Parameters<typeof import('node-fetch').default>) => {
    const module = await import('node-fetch');
    return module.default(...args);
};

const __dirname = process.cwd();

// Configuration
const PROXY_URL = process.env.PROXY_URL || 'http://localhost:4000';

/**
 * Simple logger for the script
 */
class ScriptLogger {
    static log(level: string, message: string) {
        const timestamp = new Date().toISOString();
        console.log(`[${level}] ${timestamp} - ${message}`);
    }
    
    static info(message: string) { this.log('INFO', message); }
    static error(message: string) { this.log('ERROR', message); }
    static success(message: string) { this.log('SUCCESS', message); }
    static debug(message: string) { this.log('DEBUG', message); }
    static warn(message: string) { this.log('WARN', message); }
}

/**
 * Main execution function
 */
async function main() {
    ScriptLogger.info('Starting spell import process...');
    
    const token = process.argv[2];
    if (!token) {
        ScriptLogger.error('Usage: ts-node importSpells.ts <cobalt-token>');
        process.exit(1);
    }
    
    try {
        // Test the proxy connection first
        ScriptLogger.info('Testing proxy connection...');
        const testResponse = await fetch(`${PROXY_URL}/`);
        if (!testResponse.ok) {
            ScriptLogger.error(`Proxy not available at ${PROXY_URL}`);
            process.exit(1);
        }
        ScriptLogger.success('Proxy connection successful');
        
        // First authenticate to cache the token properly
        ScriptLogger.info('Authenticating with D&D Beyond...');
        const authResponse = await fetch(`${PROXY_URL}/proxy/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: token, // Use the token as the ID for caching
                cobalt: token
            })
        });

        if (!authResponse.ok) {
            const errorText = await authResponse.text();
            ScriptLogger.error(`Authentication failed: ${authResponse.status} ${authResponse.statusText}`);
            ScriptLogger.error(`Error details: ${errorText}`);
            process.exit(1);
        }

        const authData = await authResponse.json();
        if (!authData.token) {
            ScriptLogger.error('Authentication failed: No token returned');
            process.exit(1);
        }
        ScriptLogger.success('Authentication successful');
        
        // Get proxy configuration to see all available classes
        ScriptLogger.info('Getting proxy configuration...');
        const configResponse = await fetch(`${PROXY_URL}/proxy/config`);
        if (!configResponse.ok) {
            ScriptLogger.error(`Failed to get proxy config: ${configResponse.status}`);
            process.exit(1);
        }
        const config = await configResponse.json();
        const classMap = config.classMap || [];
        ScriptLogger.success(`Found ${classMap.length} classes: ${classMap.map((c: any) => c.name).join(', ')}`);

        // Fetch spells from all classes
        ScriptLogger.info('Fetching spells from all classes...');
        const allSpells = [];
        const spellIds = new Set(); // To track unique spells

        for (const classInfo of classMap) {
            try {
                ScriptLogger.info(`Fetching spells for ${classInfo.name}...`);
                const classSpellResponse = await fetch(`${PROXY_URL}/proxy/spells/class/spells`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        className: classInfo.name,
                        cobaltToken: authData.token
                    })
                });

                if (!classSpellResponse.ok) {
                    ScriptLogger.warn(`Failed to fetch spells for ${classInfo.name}: ${classSpellResponse.status}`);
                    continue;
                }

                const classSpells = await classSpellResponse.json();
                if (classSpells.success && classSpells.data) {
                    let uniqueSpellsAdded = 0;
                    for (const spell of classSpells.data) {
                        const spellId = spell.definition?.id || spell.id;
                        if (spellId && !spellIds.has(spellId)) {
                            spellIds.add(spellId);
                            allSpells.push({
                                ...spell,
                                _sourceClass: classInfo.name // Add source class for reference
                            });
                            uniqueSpellsAdded++;
                        }
                    }
                    ScriptLogger.success(`${classInfo.name}: ${classSpells.data.length} total, ${uniqueSpellsAdded} unique spells added`);
                } else {
                    ScriptLogger.warn(`No spells returned for ${classInfo.name}`);
                }
            } catch (error) {
                ScriptLogger.error(`Error fetching spells for ${classInfo.name}: ${error}`);
            }
        }

        ScriptLogger.success(`Successfully collected ${allSpells.length} unique spells from all classes`);
        
        if (allSpells.length > 0) {
            ScriptLogger.info('Sample spells:');
            allSpells.slice(0, 5).forEach((spell: any) => {
                ScriptLogger.info(`- ${spell.definition?.name || spell.name || 'Unknown spell'} (Level ${spell.definition?.level || spell.level || '?'}) [${spell._sourceClass}]`);
            });
            
            // Write raw data to file for inspection
            const fs = await import('fs/promises');
            const outputPath = path.join(process.cwd(), 'zzzOutputzzz', 'imported_spells.json');
            
            // Ensure the directory exists
            const outputDir = path.dirname(outputPath);
            await fs.mkdir(outputDir, { recursive: true });
            
            await fs.writeFile(outputPath, JSON.stringify(allSpells, null, 2));
            ScriptLogger.success(`All unique spells written to ${outputPath}`);

            // Also write a summary by spell level
            const spellsByLevel: Record<number, any[]> = {};
            allSpells.forEach(spell => {
                const level = spell.definition?.level ?? spell.level ?? 0;
                if (!spellsByLevel[level]) spellsByLevel[level] = [];
                spellsByLevel[level].push(spell);
            });

            ScriptLogger.info('\nSpells by level:');
            for (let level = 0; level <= 9; level++) {
                const spells = spellsByLevel[level] || [];
                const levelName = level === 0 ? 'Cantrips' : `Level ${level}`;
                ScriptLogger.info(`${levelName}: ${spells.length} spells`);
            }
        } else {
            ScriptLogger.error('No spells were collected');
        }
        
    } catch (error) {
        ScriptLogger.error(`Import failed: ${error}`);
        if (error instanceof Error && error.stack) {
            ScriptLogger.debug(`Error stack: ${error.stack}`);
        }
        process.exit(1);
    }
}

// Run the main function
main().catch(error => {
    ScriptLogger.error(`Main function failed: ${error}`);
    process.exit(1);
});