/**
 * Test Spell Parsing with Fixed Components
 * Tests the updated spell parser with proper component and school mapping
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the parser directly
import { SpellParser } from './src/parsers/spells/SpellParser.js';

function testSpellParsing() {
  console.log('🔬 TESTING UPDATED SPELL PARSER');
  console.log('='.repeat(40));
  
  // Load raw D&D Beyond character data
  const rawFile = path.join(__dirname, 'parser-test-results/ddb-character-147239148.json');
  
  if (!fs.existsSync(rawFile)) {
    console.log('❌ Raw D&D Beyond data not found');
    return;
  }
  
  const rawData = JSON.parse(fs.readFileSync(rawFile, 'utf8'));
  
  // Get first few spells from classSpells
  const classSpells = rawData.classSpells;
  const firstClass = classSpells[0];
  const testSpells = firstClass.spells.slice(0, 3);
  
  console.log(`\n🧪 Testing ${testSpells.length} spells with updated parser\n`);
  
  testSpells.forEach((spell, index) => {
    console.log(`${index + 1}. ${spell.definition.name}`);
    
    // Parse spell with updated parser
    const foundrySpell = SpellParser.parseSpell(spell);
    
    console.log(`   📊 School: ${foundrySpell.system.school}`);
    console.log(`   🎭 Components:`);
    console.log(`     - Verbal: ${foundrySpell.system.components.vocal}`);
    console.log(`     - Somatic: ${foundrySpell.system.components.somatic}`);
    console.log(`     - Material: ${foundrySpell.system.components.material}`);
    console.log(`     - Ritual: ${foundrySpell.system.components.ritual}`);
    console.log(`     - Concentration: ${foundrySpell.system.components.concentration}`);
    console.log(`   ⏱️  Duration: ${foundrySpell.system.duration.value || 'instant'} ${foundrySpell.system.duration.units}`);
    console.log(`   🎯 Range: ${foundrySpell.system.range.value || 'special'} ${foundrySpell.system.range.units}`);
    console.log(`   🚀 Activation: ${foundrySpell.system.activation.cost} ${foundrySpell.system.activation.type}`);
    console.log(`   🧙 Materials: "${foundrySpell.system.materials.value}"`);
    
    console.log('   =====================================\n');
  });
}

testSpellParsing();
