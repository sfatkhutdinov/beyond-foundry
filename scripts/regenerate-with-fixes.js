/**
 * Regenerate Spell Data with Updated Parser
 * Uses existing cached character data and runs it through the fixed spell parser
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import module from built file
import('./beyond-foundry.js').then(module => {
  const { CharacterParser } = module;

  function regenerateSpellData() {
    console.log('🔄 REGENERATING SPELL DATA WITH UPDATED PARSER');
    console.log('='.repeat(50));
    
    // Load raw character data
    const rawFile = path.join(__dirname, 'parser-test-results/ddb-character-147239148.json');
    
    if (!fs.existsSync(rawFile)) {
      console.log('❌ Raw character data not found');
      return;
    }
    
    const ddbCharacter = JSON.parse(fs.readFileSync(rawFile, 'utf8'));
    
    console.log(`📊 Processing character: ${ddbCharacter.name}`);
    
    try {
      // Parse the character with updated parser
      const foundryActor = CharacterParser.parseCharacter(ddbCharacter);
      
      // Extract spells from the parsed data
      const spells = foundryActor.items.filter(item => item.type === 'spell');
      
      console.log(`🔮 Found ${spells.length} spells`);
      
      // Create output directory
      const outputDir = './comprehensive-parser-results';
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Save the results
      fs.writeFileSync(
        path.join(outputDir, 'complete-foundry-actor-147239148.json'),
        JSON.stringify(foundryActor, null, 2)
      );
      
      // Create analysis
      const analysis = {
        characterName: foundryActor.name,
        level: foundryActor.system.details.level,
        classes: {},
        spellCount: spells.length,
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(
        path.join(outputDir, 'comprehensive-analysis-147239148.json'),
        JSON.stringify(analysis, null, 2)
      );
      
      console.log('✅ Regenerated spell data with updated parser');
      console.log(`📁 Saved to ${outputDir}/`);
      
      // Show sample spell to verify fixes
      if (spells.length > 0) {
        const sampleSpell = spells[0];
        console.log(`\n🔍 Sample spell: ${sampleSpell.name}`);
        console.log(`   School: ${sampleSpell.system.school}`);
        console.log(`   Components: V=${sampleSpell.system.components.vocal}, S=${sampleSpell.system.components.somatic}, M=${sampleSpell.system.components.material}`);
        console.log(`   Duration: ${sampleSpell.system.duration.value || 'instant'} ${sampleSpell.system.duration.units}`);
      }
      
    } catch (error) {
      console.error('❌ Error parsing character:', error.message);
    }
  }

  regenerateSpellData();
  
}).catch(error => {
  console.error('❌ Failed to load module:', error.message);
  console.log('💡 Make sure to run "npm run build" first');
});
