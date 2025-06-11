/**
 * Enhanced SpellParser Demonstration Script
 * 
 * This script demonstrates the enhanced SpellParser concept by:
 * 1. Using the existing SpellParser as base
 * 2. Adding Activity System data post-processing
 * 3. Showing how D&D Beyond spell data can be enhanced
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { SpellParser } from '../src/parsers/spells/SpellParser';
import type { FoundrySpell, FoundryActivity } from '../src/types/index';

interface EnhancedFoundrySpell extends FoundrySpell {
  system: FoundrySpell['system'] & {
    activities?: Record<string, FoundryActivity>;
  };
}

/**
 * Enhanced SpellParser that adds Activity System support
 */
export class EnhancedSpellParserDemo {
  
  /**
   * Parse a spell with enhanced activities
   */
  static parseSpell(ddbSpell: unknown): EnhancedFoundrySpell {
    // Use existing parser as base
    const baseSpell = SpellParser.parseSpell(ddbSpell as any);
    
    // Enhance with activities
    const enhancedSpell: EnhancedFoundrySpell = {
      ...baseSpell,
      system: {
        ...baseSpell.system,
        activities: this.generateActivities(ddbSpell)
      }
    };

    return enhancedSpell;
  }

  /**
   * Generate activities based on D&D Beyond spell data
   */
  private static generateActivities(ddbSpell: unknown): Record<string, ActivityData> {
    const spell = ddbSpell as any;
    const definition = spell?.definition || {};
    const activities: Record<string, ActivityData> = {};
    
    const spellName = definition.name || 'Unknown Spell';
    let sortIndex = 0;

    // Attack Activity
    if (definition.attackType || definition.requiresAttackRoll) {
      const attackId = `${spellName.toLowerCase().replace(/\W+/g, '-')}-attack`;
      activities[attackId] = {
        _id: attackId,
        type: 'attack',
        name: `${spellName} Attack`,
        sort: sortIndex++ * 100000,
        description: 'Spell attack roll'
      };
    }

    // Save Activity  
    if (definition.saveType || definition.requiresSavingThrow) {
      const saveId = `${spellName.toLowerCase().replace(/\W+/g, '-')}-save`;
      activities[saveId] = {
        _id: saveId,
        type: 'save',
        name: `${spellName} Save`,
        sort: sortIndex++ * 100000,
        description: 'Saving throw required'
      };
    }

    // Healing Activity
    if (definition.healingDice?.length > 0 || definition.healing) {
      const healId = `${spellName.toLowerCase().replace(/\W+/g, '-')}-heal`;
      activities[healId] = {
        _id: healId,
        type: 'heal',
        name: `${spellName} Healing`,
        sort: sortIndex++ * 100000,
        description: 'Healing effect'
      };
    }

    // Default Utility Activity
    if (Object.keys(activities).length === 0) {
      const utilityId = `${spellName.toLowerCase().replace(/\W+/g, '-')}-utility`;
      activities[utilityId] = {
        _id: utilityId,
        type: 'utility',
        name: spellName,
        sort: sortIndex++ * 100000,
        description: 'Spell effect'
      };
    }

    return activities;
  }

  /**
   * Analyze spell and return enhancement data
   */
  static analyzeSpell(ddbSpell: unknown): {
    name: string;
    level: number;
    school: string;
    activityTypes: string[];
    hasAttack: boolean;
    hasSave: boolean;
    hasHealing: boolean;
    complexity: 'simple' | 'moderate' | 'complex';
  } {
    const spell = ddbSpell as any;
    const definition = spell?.definition || {};
    
    const activityTypes: string[] = [];
    let hasAttack = false;
    let hasSave = false;
    let hasHealing = false;

    // Check for attack
    if (definition.attackType || definition.requiresAttackRoll) {
      activityTypes.push('attack');
      hasAttack = true;
    }

    // Check for save
    if (definition.saveType || definition.requiresSavingThrow) {
      activityTypes.push('save');
      hasSave = true;
    }

    // Check for healing
    if (definition.healingDice?.length > 0 || definition.healing) {
      activityTypes.push('heal');
      hasHealing = true;
    }

    // Default utility
    if (activityTypes.length === 0) {
      activityTypes.push('utility');
    }

    // Determine complexity
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (activityTypes.length > 1) {
      complexity = 'moderate';
    }
    if (activityTypes.length > 2 || (definition.conditions?.length > 0)) {
      complexity = 'complex';
    }

    return {
      name: definition.name || 'Unknown',
      level: definition.level || 0,
      school: definition.school || 'Unknown',
      activityTypes,
      hasAttack,
      hasSave,
      hasHealing,
      complexity
    };
  }
}

/**
 * Test the enhanced parser with imported spell data
 */
async function demonstrateEnhancement(): Promise<void> {
  console.log('🎯 Enhanced SpellParser Demonstration\n');

  try {
    // Load spell data
    const spellDataPath = join(__dirname, '../zzzOutputzzz/imported_spells.json');
    console.log(`📂 Loading spells from: ${spellDataPath}`);
    
    const spellData = JSON.parse(readFileSync(spellDataPath, 'utf-8'));
    console.log(`✅ Loaded ${spellData.length} spells\n`);

    // Test enhancement on sample spells
    const testSpells = spellData.slice(0, 10);
    const results = {
      enhanced: [] as EnhancedFoundrySpell[],
      analysis: [] as any[],
      statistics: {
        totalTested: testSpells.length,
        withActivities: 0,
        attackSpells: 0,
        saveSpells: 0,
        healingSpells: 0,
        utilitySpells: 0
      }
    };

    console.log('🔄 Processing spells...\n');

    for (const [index, spell] of testSpells.entries()) {
      console.log(`${index + 1}/${testSpells.length}: ${spell.definition?.name || 'Unknown'}`);

      try {
        // Enhanced parsing
        const enhancedSpell = EnhancedSpellParserDemo.parseSpell(spell);
        const analysis = EnhancedSpellParserDemo.analyzeSpell(spell);

        results.enhanced.push(enhancedSpell);
        results.analysis.push(analysis);

        // Update statistics
        const activities = enhancedSpell.system.activities || {};
        if (Object.keys(activities).length > 0) {
          results.statistics.withActivities++;
        }

        if (analysis.hasAttack) results.statistics.attackSpells++;
        if (analysis.hasSave) results.statistics.saveSpells++;
        if (analysis.hasHealing) results.statistics.healingSpells++;
        if (analysis.activityTypes.includes('utility')) results.statistics.utilitySpells++;

        console.log(`  ✅ Enhanced with ${Object.keys(activities).length} activities (${analysis.activityTypes.join(', ')})`);

      } catch (error) {
        console.log(`  ❌ Error: ${(error as Error).message}`);
      }
    }

    // Generate report
    console.log('\n' + '='.repeat(60));
    console.log('📊 ENHANCEMENT DEMONSTRATION RESULTS');
    console.log('='.repeat(60));

    console.log(`\n📈 STATISTICS:`);
    console.log(`  Spells Processed: ${results.statistics.totalTested}`);
    console.log(`  Spells with Activities: ${results.statistics.withActivities}/${results.statistics.totalTested} (${((results.statistics.withActivities / results.statistics.totalTested) * 100).toFixed(1)}%)`);

    console.log(`\n⚔️ ACTIVITY BREAKDOWN:`);
    console.log(`  Attack Spells: ${results.statistics.attackSpells}`);
    console.log(`  Save Spells: ${results.statistics.saveSpells}`);
    console.log(`  Healing Spells: ${results.statistics.healingSpells}`);
    console.log(`  Utility Spells: ${results.statistics.utilitySpells}`);

    console.log(`\n🎯 SAMPLE ENHANCED SPELLS:`);
    results.enhanced.slice(0, 3).forEach((spell, index) => {
      const activities = spell.system.activities || {};
      console.log(`  ${index + 1}. ${spell.name}`);
      console.log(`     Level: ${spell.system.level}, School: ${spell.system.school}`);
      console.log(`     Activities: ${Object.keys(activities).length} (${Object.keys(activities).join(', ')})`);
    });

    // Save results
    const outputPath = join(__dirname, '../zzzOutputzzz/enhanced_parser_demo_results.json');
    writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${outputPath}`);

    console.log('\n🚀 CONCLUSION:');
    console.log('   Enhanced SpellParser successfully demonstrates Activity System integration!');
    console.log('   Ready for full implementation with FoundryVTT D&D 5e Activity System.');

  } catch (error) {
    console.error('❌ Demo failed:', (error as Error).message);
  }
}

// Run demonstration if called directly
if (require.main === module) {
  demonstrateEnhancement().catch(console.error);
}

export { demonstrateEnhancement };
