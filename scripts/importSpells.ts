#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';

// Dynamic import for node-fetch
const fetch = async (...args: Parameters<typeof import('node-fetch').default>) => {
    const module = await import('node-fetch');
    return module.default(...args);
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        
        // Fetch spells using the authenticated token
        ScriptLogger.info('Fetching spells from proxy...');
        const response = await fetch(`${PROXY_URL}/proxy/spells/spells`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cobalt: authData.token
            })
        });

        if (!response.ok) {
            ScriptLogger.error(`Failed to fetch spells: ${response.status} ${response.statusText}`);
            const text = await response.text();
            ScriptLogger.error(`Response: ${text}`);
            process.exit(1);
        }

        const spells = await response.json();
        if (spells.success) {
            ScriptLogger.success(`Successfully fetched ${spells.data.length} spells`);
            ScriptLogger.info('Sample spells:');
            spells.data.slice(0, 5).forEach((spell: any) => {
                ScriptLogger.info(`- ${spell.definition?.name || 'Unknown spell'} (Level ${spell.definition?.level})`);
            });
            
            // Write raw data to file for inspection
            const fs = await import('fs/promises');
            const outputPath = path.join(__dirname, '..', 'fetched-spells.json');
            await fs.writeFile(outputPath, JSON.stringify(spells.data, null, 2));
            ScriptLogger.success(`Raw spell data written to ${outputPath}`);
        } else {
            ScriptLogger.error(`Spell fetch failed: ${spells.message}`);
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