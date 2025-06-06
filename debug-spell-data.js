/**
 * Debug D&D Beyond Spell Data Structure
 * Examines the raw spell data to understand parsing issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function debugSpellData() {
  console.log('🔍 DEBUGGING D&D BEYOND SPELL DATA STRUCTURE');
  console.log('='.repeat(50));
  
  // Load raw D&D Beyond character data
  const rawFile = path.join(__dirname, 'parser-test-results/ddb-character-147239148.json');
  
  if (!fs.existsSync(rawFile)) {
    console.log('❌ Raw D&D Beyond data not found');
    return;
  }
  
  const rawData = JSON.parse(fs.readFileSync(rawFile, 'utf8'));
  
  // Extract spell data from classSpells
  const classSpells = rawData.classSpells;
  
  if (!classSpells || classSpells.length === 0) {
    console.log('❌ No classSpells found in raw data');
    return;
  }
  
  // Get all spells from all classes
  const allSpells = [];
  classSpells.forEach(classSpellList => {
    if (classSpellList.spells) {
      allSpells.push(...classSpellList.spells);
    }
  });
  
  console.log(`\n📊 Found ${allSpells.length} spells in classSpells\n`);
  
  // Examine first few spells in detail
  allSpells.slice(0, 3).forEach((spell, index) => {
    console.log(`${index + 1}. ${spell.definition?.name || 'Unknown'}`);
    console.log('   Raw spell structure:');
    console.log(`   - ID: ${spell.id}`);
    console.log(`   - Definition ID: ${spell.definition?.id}`);
    console.log(`   - School: ${spell.definition?.school}`);
    console.log(`   - Level: ${spell.definition?.level}`);
    
    // Components
    const components = spell.definition?.components;
    console.log('   - Components (raw array):');
    console.log(`     * Components: ${JSON.stringify(components)}`);
    console.log(`     * Components Description: ${spell.definition?.componentsDescription}`);
    
    // Duration
    const duration = spell.definition?.duration;
    console.log('   - Duration:');
    console.log(`     * Duration Type: ${duration?.durationType}`);
    console.log(`     * Duration Interval: ${duration?.durationInterval}`);
    console.log(`     * Duration Unit: ${duration?.durationUnit}`);
    
    // Range
    const range = spell.definition?.range;
    console.log('   - Range:');
    console.log(`     * Origin: ${range?.origin}`);
    console.log(`     * Range Value: ${range?.rangeValue}`);
    console.log(`     * AOE Type: ${range?.aoeType}`);
    console.log(`     * AOE Value: ${range?.aoeValue}`);
    
    // Activation
    const activation = spell.definition?.activation;
    console.log('   - Activation:');
    console.log(`     * Activation Type: ${activation?.activationType}`);
    console.log(`     * Activation Time: ${activation?.activationTime}`);
    
    console.log('   - Special Properties:');
    console.log(`     * Ritual: ${spell.definition?.ritual}`);
    console.log(`     * Concentration: ${spell.definition?.concentration}`);
    
    console.log('   =====================================\n');
  });
  
  // Analyze all schools
  const schools = new Set();
  allSpells.forEach(spell => {
    if (spell.definition?.school) {
      schools.add(spell.definition.school);
    }
  });
  
  console.log('📚 All spell schools found:');
  Array.from(schools).forEach(school => {
    console.log(`   - ${school}`);
  });
  
  // Analyze all duration types
  const durations = new Set();
  allSpells.forEach(spell => {
    if (spell.definition?.duration?.durationType) {
      durations.add(spell.definition.duration.durationType);
    }
  });
  
  console.log('\n⏱️  All duration types found:');
  Array.from(durations).forEach(duration => {
    console.log(`   - ${duration}`);
  });
  
  // Analyze all range origins
  const rangeOrigins = new Set();
  allSpells.forEach(spell => {
    if (spell.definition?.range?.origin) {
      rangeOrigins.add(spell.definition.range.origin);
    }
  });
  
  console.log('\n🎯 All range origins found:');
  Array.from(rangeOrigins).forEach(origin => {
    console.log(`   - ${origin}`);
  });
  
  // Analyze component patterns
  const componentPatterns = new Set();
  allSpells.forEach(spell => {
    if (spell.definition?.components) {
      componentPatterns.add(JSON.stringify(spell.definition.components));
    }
  });
  
  console.log('\n🧪 All component patterns found:');
  Array.from(componentPatterns).forEach(pattern => {
    console.log(`   - ${pattern}`);
  });
}

debugSpellData();
