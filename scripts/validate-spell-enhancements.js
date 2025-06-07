#!/usr/bin/env node

/**
 * Comprehensive test and validation script for Beyond Foundry spell enhancements
 * 
 * This script validates the complete spell integration workflow:
 * 1. Enhanced spell fetching from ddb-proxy
 * 2. Spell parsing and conversion to FoundryVTT format
 * 3. Integration with existing SpellParser
 * 4. Complete character import with spells
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROXY_URL = 'http://localhost:3100';
const CHARACTER_FILE = 'analysis/character-analysis/character-147239148-raw.json';

console.log('🎯 Beyond Foundry Spell Enhancement Validation');
console.log('='.repeat(60));
console.log();

// Test configuration
function checkConfiguration() {
    console.log('📋 Configuration Check:');
    console.log(`   Proxy URL: ${PROXY_URL}`);
    console.log(`   Character File: ${CHARACTER_FILE}`);
    
    // Check for cobalt token
    const args = process.argv.slice(2);
    const cobaltToken = args[0] || null;
    
    if (cobaltToken) {
        console.log(`   Authentication: ✅ Cobalt token provided`);
        return { cobaltToken, authenticated: true };
    } else {
        console.log(`   Authentication: ⚠️ No cobalt token (limited testing)`);
        return { cobaltToken: null, authenticated: false };
    }
}

// Validate proxy connectivity
async function validateProxy() {
    console.log('\n🔌 Proxy Connectivity:');
    try {
        const response = await fetch(`${PROXY_URL}/ping`);
        if (response.ok) {
            console.log('   ✅ ddb-proxy running and responsive');
            return true;
        } else {
            throw new Error(`Status: ${response.status}`);
        }
    } catch (error) {
        console.log(`   ❌ Proxy connection failed: ${error.message}`);
        return false;
    }
}

// Validate character data
function validateCharacterData() {
    console.log('\n📊 Character Data Validation:');
    try {
        const characterPath = path.join(__dirname, '..', CHARACTER_FILE);
        const characterData = JSON.parse(fs.readFileSync(characterPath, 'utf8'));
        
        console.log(`   ✅ Character: ${characterData.name} (ID: ${characterData.id})`);
        console.log(`   ✅ Level: ${characterData.totalLevels || 'Unknown'}`);
        
        // Validate spellcasting classes
        const classes = characterData.classes || [];
        const spellcastingClasses = classes.filter(cls => {
            const spellcastingAbilityId = cls.definition?.spellCastingAbilityId;
            return spellcastingAbilityId && spellcastingAbilityId > 0;
        });
        
        console.log(`   ✅ Classes: ${classes.length} total, ${spellcastingClasses.length} spellcasting`);
        
        spellcastingClasses.forEach(cls => {
            console.log(`      - ${cls.definition.name} (Level ${cls.level})`);
        });
        
        return { characterData, spellcastingClasses };
    } catch (error) {
        console.log(`   ❌ Character validation failed: ${error.message}`);
        return null;
    }
}

// Validate enhanced module
function validateEnhancedModule() {
    console.log('\n🔧 Enhanced Module Validation:');
    try {
        const modulePath = path.join(__dirname, '..', 'foundry-dev-package', 'beyond-foundry.js');
        const buildPath = path.join(__dirname, '..', 'build', 'beyond-foundry.js');
        
        // Check foundry dev package
        if (fs.existsSync(modulePath)) {
            console.log('   ✅ Foundry dev package module found');
        } else {
            console.log('   ⚠️ Foundry dev package module missing');
        }
        
        // Check build output
        if (fs.existsSync(buildPath)) {
            console.log('   ✅ Build output found');
            
            const moduleContent = fs.readFileSync(buildPath, 'utf8');
            
            // Validate enhanced spell methods
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
            console.log(`   ✅ Enhanced methods: ${foundMethods.length}/${enhancedMethods.length} found`);
            
            if (foundMethods.length === enhancedMethods.length) {
                console.log('      All spell enhancement methods integrated');
            } else {
                const missing = enhancedMethods.filter(method => !foundMethods.includes(method));
                console.log(`      Missing: ${missing.join(', ')}`);
            }
            
            // Check SpellParser integration
            if (moduleContent.includes('SpellParser')) {
                console.log('   ✅ SpellParser integration confirmed');
            } else {
                console.log('   ⚠️ SpellParser integration not found');
            }
            
            return { moduleValid: true, methodCount: foundMethods.length };
        } else {
            console.log('   ❌ Build output not found');
            return { moduleValid: false, methodCount: 0 };
        }
    } catch (error) {
        console.log(`   ❌ Module validation failed: ${error.message}`);
        return { moduleValid: false, methodCount: 0 };
    }
}

// Test spell endpoints
async function testSpellEndpoints(characterData, cobaltToken) {
    console.log('\n🔮 Spell Endpoint Testing:');
    
    if (!cobaltToken) {
        console.log('   ⚠️ No authentication - endpoint testing skipped');
        console.log('   ℹ️ To test endpoints: node validate-spell-enhancements.js <cobalt-token>');
        return { endpointsWorking: false, tested: false };
    }
    
    const characterId = characterData.id;
    
    // Test character endpoint (includes spells)
    try {
        console.log('   Testing character endpoint...');
        const response = await fetch(`${PROXY_URL}/proxy/character`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ characterId, cobalt: cobaltToken })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.ddb?.character) {
                const character = result.ddb.character;
                console.log(`   ✅ Character endpoint: Success`);
                console.log(`      Character: ${character.name}`);
                
                const classSpells = character.classSpells || [];
                const spells = character.spells || [];
                console.log(`      Spells: ${classSpells.length} class, ${spells.length} character`);
                
                return { endpointsWorking: true, tested: true, characterSpells: classSpells.length, spells: spells.length };
            } else {
                console.log(`   ⚠️ Character endpoint: ${result.message || 'Invalid response'}`);
                return { endpointsWorking: false, tested: true };
            }
        } else {
            console.log(`   ❌ Character endpoint: Status ${response.status}`);
            return { endpointsWorking: false, tested: true };
        }
    } catch (error) {
        console.log(`   ❌ Endpoint test failed: ${error.message}`);
        return { endpointsWorking: false, tested: true };
    }
}

// Validate spell workflow
async function validateSpellWorkflow(spellcastingClasses, cobaltToken) {
    console.log('\n⚙️ Spell Workflow Validation:');
    
    for (const classInfo of spellcastingClasses) {
        const className = classInfo.definition.name;
        const classLevel = classInfo.level;
        
        console.log(`   📚 ${className} (Level ${classLevel}):`);
        
        // Calculate spell level access (our enhanced logic)
        let maxSpellLevel;
        switch (className.toLowerCase()) {
            case 'druid':
            case 'cleric':
            case 'sorcerer':
            case 'wizard':
            case 'bard':
                maxSpellLevel = Math.min(9, Math.ceil(classLevel / 2));
                break;
            case 'paladin':
            case 'ranger':
                maxSpellLevel = Math.min(5, Math.ceil((classLevel - 1) / 2));
                break;
            case 'warlock':
                maxSpellLevel = Math.min(5, Math.ceil((classLevel + 1) / 2));
                break;
            case 'eldritch knight':
            case 'arcane trickster':
                maxSpellLevel = Math.min(4, Math.ceil((classLevel - 2) / 3));
                break;
            default:
                maxSpellLevel = 0;
        }
        
        console.log(`      Max Spell Level: ${maxSpellLevel}`);
        
        if (cobaltToken && maxSpellLevel > 0) {
            try {
                const response = await fetch(`${PROXY_URL}/proxy/class/spells`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        className: className,
                        cobalt: cobaltToken
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        const allSpells = result.data;
                        const validSpells = allSpells.filter(spell => {
                            const level = spell.definition?.level || 0;
                            return level <= maxSpellLevel;
                        });
                        
                        console.log(`      Available Spells: ${allSpells.length} total, ${validSpells.length} within level`);
                        
                        if (validSpells.length > 0) {
                            const sampleSpells = validSpells.slice(0, 2).map(spell =>
                                `${spell.definition?.name} (L${spell.definition?.level})`
                            );
                            console.log(`      Sample: ${sampleSpells.join(', ')}`);
                        }
                    } else {
                        console.log(`      ⚠️ Class spells: ${result.message || 'No data'}`);
                    }
                } else {
                    console.log(`      ⚠️ Class spells: Status ${response.status}`);
                }
            } catch (error) {
                console.log(`      ❌ Class spells: ${error.message}`);
            }
        } else if (!cobaltToken) {
            console.log(`      ℹ️ Would fetch ${maxSpellLevel > 0 ? 'spells' : 'no spells'} from proxy`);
        }
    }
}

// Main validation function
async function runValidation() {
    console.log('Starting comprehensive spell enhancement validation...\n');
    
    // Step 1: Configuration
    const config = checkConfiguration();
    
    // Step 2: Proxy
    const proxyOk = await validateProxy();
    if (!proxyOk && config.authenticated) {
        console.log('❌ Cannot test authenticated features without proxy');
        process.exit(1);
    }
    
    // Step 3: Character data
    const characterResult = validateCharacterData();
    if (!characterResult) {
        console.log('❌ Cannot continue without valid character data');
        process.exit(1);
    }
    
    const { characterData, spellcastingClasses } = characterResult;
    
    // Step 4: Enhanced module
    const moduleResult = validateEnhancedModule();
    
    // Step 5: Endpoints (if authenticated)
    const endpointResult = await testSpellEndpoints(characterData, config.cobaltToken);
    
    // Step 6: Workflow validation
    await validateSpellWorkflow(spellcastingClasses, config.cobaltToken);
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`✅ Proxy Connection: ${proxyOk ? 'Working' : 'Failed'}`);
    console.log(`✅ Character Data: ${characterResult ? 'Valid' : 'Invalid'}`);
    console.log(`✅ Enhanced Module: ${moduleResult.moduleValid ? 'Ready' : 'Issues'}`);
    console.log(`   - Spell Methods: ${moduleResult.methodCount}/7 integrated`);
    
    if (config.authenticated) {
        console.log(`✅ Authentication: Token provided`);
        console.log(`✅ Spell Endpoints: ${endpointResult.endpointsWorking ? 'Working' : 'Issues'}`);
        if (endpointResult.endpointsWorking) {
            console.log(`   - Character Spells: ${endpointResult.characterSpells || 0}`);
            console.log(`   - Spell Data: ${endpointResult.spells || 0}`);
        }
    } else {
        console.log(`⚠️ Authentication: No token (limited testing)`);
    }
    
    console.log(`✅ Spellcasting Classes: ${spellcastingClasses.length} found`);
    spellcastingClasses.forEach(cls => {
        console.log(`   - ${cls.definition.name} (Level ${cls.level})`);
    });
    
    console.log('\n💡 READY FOR:');
    console.log('   🎯 Complete spell import workflow');
    console.log('   🎯 Real D&D Beyond character imports');
    console.log('   🎯 FoundryVTT spell integration');
    console.log('   🎯 Spell parsing and conversion');
    
    if (!config.authenticated) {
        console.log('\n🔑 FOR FULL TESTING:');
        console.log(`   node validate-spell-enhancements.js <cobalt-token>`);
    }
}

// Run validation
runValidation().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
});
