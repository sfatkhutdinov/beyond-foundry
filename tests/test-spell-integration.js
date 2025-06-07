/**
 * Test Script for Spell Integration
 * Tests the integration between SpellParser and BeyondFoundryAPI
 * Run this in the FoundryVTT console after loading the module
 */

async function testSpellIntegration() {
  console.log('🧙‍♂️ Starting Spell Integration Test...');
  
  // Check if module is loaded
  const module = game.modules.get('beyond-foundry');
  if (!module?.active) {
    console.error('❌ Beyond Foundry module is not active');
    return;
  }
  
  console.log('✅ Beyond Foundry module is active');
  
  // Get API instance
  const api = module.api;
  if (!api) {
    console.error('❌ Beyond Foundry API not available');
    return;
  }
  
  console.log('✅ API instance available');
  
  // Test character ID - replace with a real character ID for full testing
  const testCharacterId = '147239148'; // Example character ID
  
  console.log(`📋 Testing with character ID: ${testCharacterId}`);
  
  try {
    // Test 1: Authentication check
    console.log('\n🔐 Testing Authentication...');
    const settings = game.settings.get('beyond-foundry', 'cobaltToken');
    if (!settings || settings.trim() === '') {
      console.warn('⚠️ No authentication token configured');
      console.log('To test fully, configure your cobalt token in module settings');
      return;
    }
    
    // Test 2: Character retrieval
    console.log('\n👤 Testing Character Retrieval...');
    const character = await api.getCharacter(testCharacterId);
    if (!character) {
      console.warn('⚠️ Could not retrieve character (may need valid character ID)');
      return;
    }
    
    console.log(`✅ Retrieved character: ${character.name}`);
    
    // Test 3: Check for spells
    if (character.spells) {
      const spellCount = Object.values(character.spells).reduce(
        (sum, spellArray) => sum + (Array.isArray(spellArray) ? spellArray.length : 0), 
        0
      );
      console.log(`✅ Character has ${spellCount} spells across spell lists`);
      
      // Display spell lists
      Object.entries(character.spells).forEach(([listKey, spells]) => {
        if (Array.isArray(spells) && spells.length > 0) {
          console.log(`   📜 ${listKey}: ${spells.length} spells`);
          spells.slice(0, 3).forEach(spell => {
            console.log(`      - ${spell.definition?.name} (Level ${spell.definition?.level})`);
          });
          if (spells.length > 3) {
            console.log(`      ... and ${spells.length - 3} more`);
          }
        }
      });
    } else {
      console.log('ℹ️ Character has no spells');
    }
    
    // Test 4: Import with spell options
    console.log('\n🎭 Testing Character Import with Spell Options...');
    const importOptions = {
      importSpells: true,
      importItems: false, // Skip items for this test
      updateExisting: true,
      spellPreparationMode: 'prepared'
    };
    
    const result = await api.importCharacter(testCharacterId, importOptions);
    
    if (result.success) {
      console.log('✅ Character import successful!');
      console.log(`   Actor: ${result.actor?.name}`);
      
      if (result.warnings?.length > 0) {
        console.log('⚠️ Import warnings:');
        result.warnings.forEach(warning => console.log(`   - ${warning}`));
      }
      
      // Check imported spells
      if (result.actor?.items) {
        const spells = result.actor.items.filter(item => item.type === 'spell');
        console.log(`✅ Imported ${spells.length} spells`);
        
        if (spells.length > 0) {
          console.log('   Sample spells:');
          spells.slice(0, 5).forEach(spell => {
            console.log(`   - ${spell.name} (Level ${spell.system?.level || '?'})`);
          });
        }
      }
    } else {
      console.error('❌ Character import failed:');
      result.errors?.forEach(error => console.error(`   - ${error}`));
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
  
  console.log('\n🏁 Spell Integration Test Complete');
}

// Usage instructions
console.log(`
🧙‍♂️ Spell Integration Test Script Loaded!

To run the test:
1. Make sure you have a valid D&D Beyond character ID
2. Configure your cobalt token in Beyond Foundry module settings
3. Run: testSpellIntegration()

Example character IDs you can try:
- Use any character ID from your D&D Beyond account
- Get IDs from URLs like: dndbeyond.com/characters/123456789

For a quick test without authentication:
- The script will test module loading and basic API availability
`);

// Export for console use
window.testSpellIntegration = testSpellIntegration;
