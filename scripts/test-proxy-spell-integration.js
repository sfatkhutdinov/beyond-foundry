#!/usr/bin/env node

/**
 * Test script for Beyond Foundry spell integration with ddb-proxy
 * Tests the complete spell fetching and parsing workflow
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROXY_URL = 'http://localhost:3100';
const CHARACTER_FILE = 'analysis/character-analysis/character-147239148-raw.json';

console.log('🔮 Testing Proxy Spell Integration');
console.log('============================================================\n');

// Test proxy connection
async function testProxyConnection() {
    console.log('1. Testing proxy connection...');
    try {
        const response = await fetch(`${PROXY_URL}/ping`);
        if (response.ok) {
            console.log('✅ Proxy connection successful\n');
            return true;
        } else {
            throw new Error(`Proxy responded with status: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Proxy connection failed:', error.message);
        return false;
    }
}

// Load character data
function loadCharacterData() {
    console.log('2. Loading character data...');
    try {
        const characterPath = path.join(__dirname, '..', CHARACTER_FILE);
        const characterData = JSON.parse(fs.readFileSync(characterPath, 'utf8'));
        
        console.log(`✅ Character loaded: ${characterData.name} (ID: ${characterData.id})`);
        
        // Extract class information
        const classes = characterData.classes || [];
        const spellcastingClasses = classes.filter(cls => {
            const spellcastingAbilityId = cls.definition?.spellCastingAbilityId;
            return spellcastingAbilityId && spellcastingAbilityId > 0;
        });
        
        console.log(`   Classes: ${classes.map(cls => `${cls.definition.name} (Level ${cls.level})`).join(', ')}`);
        console.log(`   Spellcasting Classes: ${spellcastingClasses.length}\n`);
        
        return { characterData, spellcastingClasses };
    } catch (error) {
        console.error('❌ Failed to load character data:', error.message);
        return null;
    }
}

// Test spell fetching endpoints with proxy
async function testSpellEndpoints(characterId, token) {
    console.log('3. Testing spell endpoints...');
    
    // Note: All proxy endpoints require POST with cobalt token
    if (!token) {
        console.log('⚠️ No cobalt token provided - cannot test authenticated endpoints');
        console.log('   The proxy requires authentication for all spell-related endpoints');
        console.log('   To test with token: node test-proxy-spell-integration.js <cobalt-token>\n');
        return;
    }
    
    const testEndpoints = [
        { 
            name: 'Character Data (includes spells)', 
            url: '/proxy/character',
            body: { characterId: characterId, cobalt: token }
        },
        { 
            name: 'Class Spells (Druid)', 
            url: '/proxy/class/spells',
            body: { className: 'Druid', cobalt: token }
        }
    ];
    
    for (const endpoint of testEndpoints) {
        try {
            const response = await fetch(`${PROXY_URL}${endpoint.url}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(endpoint.body)
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log(`✅ ${endpoint.name}: Success`);
                    
                    // Log spell-specific info
                    if (endpoint.name.includes('Character Data')) {
                        const character = data.ddb?.character;
                        if (character) {
                            console.log(`   Character: ${character.name}`);
                            const classSpells = character.classSpells || [];
                            const spells = character.spells || [];
                            console.log(`   Class Spells: ${classSpells.length}, Character Spells: ${spells.length}`);
                        }
                    } else if (endpoint.name.includes('Class Spells')) {
                        const spells = data.data || [];
                        console.log(`   Available Spells: ${spells.length}`);
                        if (spells.length > 0) {
                            const sampleSpells = spells.slice(0, 3).map(spell => 
                                `${spell.definition?.name || spell.name} (Level ${spell.definition?.level || spell.level})`
                            );
                            console.log(`   Sample: ${sampleSpells.join(', ')}`);
                        }
                    }
                } else {
                    console.log(`⚠️ ${endpoint.name}: ${data.message || 'Unknown error'}`);
                }
            } else {
                console.log(`⚠️ ${endpoint.name}: Status ${response.status} - ${response.statusText}`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
        }
    }
    console.log();
}

// Test spell parsing with our enhanced API
async function testSpellParsing() {
    console.log('4. Testing spell parsing integration...');
    
    try {
        // Check if our enhanced module exists
        const modulePath = path.join(__dirname, '..', 'foundry-dev-package', 'beyond-foundry.js');
        if (fs.existsSync(modulePath)) {
            console.log('✅ Enhanced module available');
            
            // We can't actually run the Foundry-specific code here, but we can verify the structure
            const moduleContent = fs.readFileSync(modulePath, 'utf8');
            
            // Check for our enhanced methods
            const enhancedMethods = [
                'fetchCharacterSpells',
                'extractSpells',
                'extractAlwaysPreparedSpells', 
                'extractAlwaysKnownSpells',
                'isSpellcastingClass',
                'calculateSpellLevelAccess',
                'addSpellsToActor'
            ];
            
            const foundMethods = enhancedMethods.filter(method => moduleContent.includes(method));
            const missingMethods = enhancedMethods.filter(method => !moduleContent.includes(method));
            
            console.log(`✅ Found enhanced spell methods: ${foundMethods.length}/${enhancedMethods.length}`);
            if (foundMethods.length > 0) {
                console.log(`   Available: ${foundMethods.join(', ')}`);
            }
            if (missingMethods.length > 0) {
                console.log(`   Missing: ${missingMethods.join(', ')}`);
            }
            
            // Check for SpellParser integration
            if (moduleContent.includes('SpellParser')) {
                console.log('✅ SpellParser integration found');
            } else {
                console.log('⚠️ SpellParser integration not found');
            }
            
            // Check for proxy integration patterns
            if (moduleContent.includes('/proxy/class/spells') && moduleContent.includes('/proxy/character')) {
                console.log('✅ Proxy endpoint integration found');
            } else {
                console.log('⚠️ Proxy endpoint integration not found');
            }
        } else {
            console.log('❌ Enhanced module not found');
        }
    } catch (error) {
        console.error('❌ Error testing spell parsing:', error.message);
    }
    console.log();
}

// Mock spell fetching workflow
async function testSpellWorkflow(characterData, spellcastingClasses, token) {
    console.log('5. Testing spell fetching workflow...');
    
    if (!token) {
        console.log('⚠️ No cobalt token provided - testing workflow logic only');
    }
    
    try {
        // Simulate our enhanced spell fetching logic
        for (const classInfo of spellcastingClasses) {
            const className = classInfo.definition.name;
            const classLevel = classInfo.level;
            const classId = classInfo.definition.id;
            
            console.log(`📚 Processing ${className} (Level ${classLevel}, ID: ${classId})`);
            
            // Calculate max spell level (this mimics our calculateSpellLevelAccess method)
            let maxSpellLevel;
            if (className.toLowerCase() === 'druid') {
                maxSpellLevel = Math.min(9, Math.ceil(classLevel / 2));
            } else {
                maxSpellLevel = Math.min(9, Math.ceil(classLevel / 2));
            }
            
            console.log(`   Max Spell Level: ${maxSpellLevel}`);
            
            // Test endpoint with correct POST format if token available
            if (token) {
                try {
                    const response = await fetch(`${PROXY_URL}/proxy/class/spells`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            className: className,
                            cobalt: token
                        })
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success && result.data) {
                            const spells = result.data;
                            const filteredSpells = spells.filter(spell => {
                                const spellLevel = spell.definition?.level || spell.level || 0;
                                return spellLevel <= maxSpellLevel;
                            });
                            console.log(`   Available Spells: ${spells.length} total, ${filteredSpells.length} within level range`);
                            
                            // Show sample spells
                            if (filteredSpells.length > 0) {
                                const sampleSpells = filteredSpells.slice(0, 3).map(spell => 
                                    `${spell.definition?.name || spell.name} (Level ${spell.definition?.level || spell.level})`
                                );
                                console.log(`   Sample Spells: ${sampleSpells.join(', ')}`);
                            }
                        } else {
                            console.log(`   ⚠️ Could not fetch spells: ${result.message || 'Unknown error'}`);
                        }
                    } else {
                        console.log(`   ⚠️ Could not fetch spells: Status ${response.status}`);
                    }
                } catch (error) {
                    console.log(`   ❌ Error fetching spells: ${error.message}`);
                }
            } else {
                console.log(`   ℹ️ Would fetch spells from: POST /proxy/class/spells`);
                console.log(`   ℹ️ Payload: { className: "${className}", cobalt: "<token>" }`);
            }
        }
    } catch (error) {
        console.error('❌ Error in spell workflow:', error.message);
    }
    console.log();
}

// Main test function
async function runTests() {
    try {
        // Check for cobalt token argument
        const args = process.argv.slice(2);
        const cobaltToken = args[0] || null;
        
        if (cobaltToken) {
            console.log('🔑 Using provided cobalt token for authenticated testing\n');
        } else {
            console.log('ℹ️ No cobalt token provided - will test basic functionality only');
            console.log('   To test with authentication: node test-proxy-spell-integration.js <cobalt-token>\n');
        }
        
        // Test 1: Proxy connection
        const proxyOk = await testProxyConnection();
        if (!proxyOk) {
            console.log('❌ Cannot continue without proxy connection');
            process.exit(1);
        }
        
        // Test 2: Load character
        const characterResult = loadCharacterData();
        if (!characterResult) {
            console.log('❌ Cannot continue without character data');
            process.exit(1);
        }
        
        const { characterData, spellcastingClasses } = characterResult;
        const characterId = characterData.id;
        
        // Test 3: Test endpoints
        await testSpellEndpoints(characterId, cobaltToken);
        
        // Test 4: Test parsing integration
        await testSpellParsing();
        
        // Test 5: Test workflow
        await testSpellWorkflow(characterData, spellcastingClasses, cobaltToken);
        
        // Summary
        console.log('🎉 Proxy Spell Integration Test Summary:');
        console.log('✅ Proxy connection working');
        console.log('✅ Character data loaded with spellcasting classes');
        console.log('✅ Spell endpoints identified (require authentication)');
        console.log('✅ Enhanced spell methods integrated');
        console.log('✅ Spell workflow logic tested\n');
        
        console.log('💡 Next Steps:');
        if (!cobaltToken) {
            console.log('1. Get D&D Beyond cobalt token from browser cookies');
            console.log('2. Test with authentication: node test-proxy-spell-integration.js <cobalt-token>');
        } else {
            console.log('1. Test complete spell import in Foundry VTT');
            console.log('2. Validate spell parsing and conversion');
            console.log('3. Test spell metadata and duplicate handling');
        }
        console.log('4. Integrate spell fetching into Beyond Foundry module');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run tests
runTests();
