#!/usr/bin/env ts-node

/**
 * Test Script for Enhanced SpellParser with Activity System
 * 
 * This script validates the enhanced spell parsing functionality by:
 * 1. Loading sample D&D Beyond spell data
 * 2. Testing the enhanced SpellParser
 * 3. Comparing with original SpellParser
 * 4. Validating Activity System integration
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Logger } from '../src/module/utils/logger';
import { EnhancedSpellParser } from '../src/parsers/spells/EnhancedSpellParser';
import { SpellParser } from '../src/parsers/spells/SpellParser';

interface TestResults {
  timestamp: string;
  spellsTested: number;
  originalParserResults: unknown[];
  enhancedParserResults: unknown[];
  activitiesGenerated: number;
  activeEffectsGenerated: number;
  comparison: {
    spellsWithActivities: number;
    spellsWithEffects: number;
    attackSpells: number;
    saveSpells: number;
    healingSpells: number;
    utilitySpells: number;
  };
  errors: string[];
}

async function main(): Promise<void> {
  console.log('🧪 Testing Enhanced SpellParser with Activity System...\n');

  const results: TestResults = {
    timestamp: new Date().toISOString(),
    spellsTested: 0,
    originalParserResults: [],
    enhancedParserResults: [],
    activitiesGenerated: 0,
    activeEffectsGenerated: 0,
    comparison: {
      spellsWithActivities: 0,
      spellsWithEffects: 0,
      attackSpells: 0,
      saveSpells: 0,
      healingSpells: 0,
      utilitySpells: 0
    },
    errors: []
  };

  try {
    // Load imported spell data
    const spellDataPath = join(__dirname, '../zzzOutputzzz/imported_spells.json');
    console.log(`📂 Loading spell data from: ${spellDataPath}`);
    
    const spellData = JSON.parse(readFileSync(spellDataPath, 'utf-8'));
    console.log(`✅ Loaded ${spellData.length} spells for testing\n`);

    // Test sample of spells (first 20 for quick testing)
    const testSpells = spellData.slice(0, 20);
    results.spellsTested = testSpells.length;

    console.log('🔄 Testing spells with both parsers...\n');

    for (const [index, spell] of testSpells.entries()) {
      console.log(`Testing ${index + 1}/${testSpells.length}: ${spell.definition?.name || 'Unknown'}`);

      try {
        // Test original parser
        const originalResult = SpellParser.parseSpell(spell);
        results.originalParserResults.push(originalResult);

        // Test enhanced parser
        const enhancedResult = EnhancedSpellParser.parseSpell(spell);
        results.enhancedParserResults.push(enhancedResult);

        // Analyze enhanced result
        analyzeEnhancedSpell(enhancedResult, results);

        console.log(`  ✅ Original: ${originalResult.name}`);
        console.log(`  🎯 Enhanced: ${enhancedResult.name} with ${Object.keys(enhancedResult.system.activities || {}).length} activities`);

      } catch (error) {
        const errorMessage = `Failed to parse ${spell.definition?.name}: ${(error as Error).message}`;
        console.log(`  ❌ ${errorMessage}`);
        results.errors.push(errorMessage);
      }
    }

    // Generate comparison report
    generateReport(results);

    // Save results
    const outputPath = join(__dirname, '../zzzOutputzzz/enhanced_parser_test_results.json');
    writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Test results saved to: ${outputPath}`);

  } catch (error) {
    console.error('❌ Test failed:', (error as Error).message);
    process.exit(1);
  }
}

function analyzeEnhancedSpell(spell: unknown, results: TestResults): void {
  const spellData = spell as {
    system: {
      activities?: Record<string, { type: string }>;
    };
    effects?: unknown[];
  };

  const activities = spellData.system.activities || {};
  const effects = spellData.effects || [];

  results.activitiesGenerated += Object.keys(activities).length;
  results.activeEffectsGenerated += effects.length;

  if (Object.keys(activities).length > 0) {
    results.comparison.spellsWithActivities++;
  }

  if (effects.length > 0) {
    results.comparison.spellsWithEffects++;
  }

  // Count activity types
  for (const activity of Object.values(activities)) {
    switch (activity.type) {
      case 'attack':
        results.comparison.attackSpells++;
        break;
      case 'save':
        results.comparison.saveSpells++;
        break;
      case 'heal':
        results.comparison.healingSpells++;
        break;
      case 'utility':
        results.comparison.utilitySpells++;
        break;
    }
  }
}

function generateReport(results: TestResults): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 ENHANCED SPELL PARSER TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log(`\n📈 STATISTICS:`);
  console.log(`  Spells Tested: ${results.spellsTested}`);
  console.log(`  Activities Generated: ${results.activitiesGenerated}`);
  console.log(`  Active Effects Generated: ${results.activeEffectsGenerated}`);
  console.log(`  Errors: ${results.errors.length}`);

  console.log(`\n🎯 ACTIVITY SYSTEM ANALYSIS:`);
  console.log(`  Spells with Activities: ${results.comparison.spellsWithActivities}/${results.spellsTested} (${((results.comparison.spellsWithActivities / results.spellsTested) * 100).toFixed(1)}%)`);
  console.log(`  Spells with Effects: ${results.comparison.spellsWithEffects}/${results.spellsTested} (${((results.comparison.spellsWithEffects / results.spellsTested) * 100).toFixed(1)}%)`);

  console.log(`\n⚔️ ACTIVITY TYPES:`);
  console.log(`  Attack Activities: ${results.comparison.attackSpells}`);
  console.log(`  Save Activities: ${results.comparison.saveSpells}`);
  console.log(`  Healing Activities: ${results.comparison.healingSpells}`);
  console.log(`  Utility Activities: ${results.comparison.utilitySpells}`);

  if (results.errors.length > 0) {
    console.log(`\n❌ ERRORS:`);
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  console.log(`\n✅ ENHANCEMENT STATUS:`);
  if (results.comparison.spellsWithActivities > 0) {
    console.log(`  🎯 SUCCESS: Enhanced parser is generating activities!`);
  } else {
    console.log(`  ⚠️  WARNING: No activities generated - check implementation`);
  }

  if (results.activitiesGenerated > results.spellsTested) {
    console.log(`  🚀 EXCELLENT: Multiple activities per spell (${(results.activitiesGenerated / results.spellsTested).toFixed(1)} avg)`);
  }

  console.log('='.repeat(60));
}

// Sample spell data for testing if no imported data available
const sampleSpells = [
  {
    id: 1,
    definition: {
      id: 1,
      name: "Fire Bolt",
      level: 0,
      school: "Evocation",
      description: "A mote of fire hurtles toward a creature or object within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 fire damage.",
      requiresAttackRoll: true,
      attackType: 4, // Ranged spell attack
      modifiers: [
        {
          type: "damage",
          subType: 3, // Fire damage
          die: { diceCount: 1, diceValue: 10, fixedValue: 0 }
        }
      ],
      components: { verbal: true, somatic: true, material: false },
      range: { origin: "Ranged", rangeValue: 120 },
      duration: { durationType: 1 }, // Instantaneous
      activation: { activationType: 1, activationTime: 1 } // Action
    }
  },
  {
    id: 2,
    definition: {
      id: 2,
      name: "Hold Person",
      level: 2,
      school: "Enchantment",
      description: "Choose a humanoid that you can see within range. The target must succeed on a Wisdom saving throw or be paralyzed for the duration.",
      requiresSavingThrow: true,
      saveDcAbilityId: 5, // Wisdom
      conditions: [{ conditionId: 8 }], // Paralyzed
      components: { verbal: true, somatic: true, material: true },
      range: { origin: "Ranged", rangeValue: 60 },
      duration: { durationType: 3, durationInterval: 1 }, // 1 minute
      activation: { activationType: 1, activationTime: 1 } // Action
    }
  }
];

if (require.main === module) {
  main().catch(console.error);
}

export { main as testEnhancedSpellParser };
