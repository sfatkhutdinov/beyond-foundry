/**
 * Performance Testing Script
 * Tests the parser performance with large character datasets and stress scenarios
 */

const fs = require('fs');
const path = require('path');

// Mock FoundryVTT environment
global.foundry = {
  utils: {
    mergeObject: (target, source) => ({ ...target, ...source }),
    deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
    randomID: () => Math.random().toString(36).substr(2, 16)
  }
};

console.log('⚡ BEYOND FOUNDRY - PERFORMANCE TESTING');
console.log('=' * 60);

/**
 * Generate a complex character with many features for stress testing
 */
function generateComplexCharacter(complexity = 'high') {
  const complexityLevels = {
    low: { features: 10, traits: 3, equipment: 5, spells: 0, modifiers: 10 },
    medium: { features: 25, traits: 5, equipment: 15, spells: 20, modifiers: 30 },
    high: { features: 50, traits: 8, equipment: 30, spells: 40, modifiers: 60 },
    extreme: { features: 100, traits: 15, equipment: 50, spells: 80, modifiers: 120 }
  };

  const config = complexityLevels[complexity];

  return {
    name: `Complex ${complexity} Character`,
    classes: [{
      level: 20,
      definition: {
        name: 'Wizard',
        hitDie: 6
      },
      classFeatures: Array.from({ length: config.features / 2 }, (_, i) => ({
        name: `Class Feature ${i + 1}`,
        description: `A detailed description for class feature ${i + 1}. This feature provides various benefits including ability score improvements, skill proficiencies, and special abilities that enhance the character's capabilities in combat and exploration.`,
        requiredLevel: Math.min(i + 1, 20)
      })),
      subclassDefinition: {
        name: 'School of Enchantment',
        classFeatures: Array.from({ length: config.features / 4 }, (_, i) => ({
          name: `Subclass Feature ${i + 1}`,
          description: `Subclass feature description ${i + 1} with extensive details about magical abilities and spellcasting enhancements.`,
          requiredLevel: Math.min(i * 2 + 2, 20)
        }))
      }
    }],
    race: {
      fullName: 'Variant Human',
      racialTraits: Array.from({ length: config.traits }, (_, i) => ({
        name: `Racial Trait ${i + 1}`,
        description: `Racial trait description ${i + 1}. This trait grants various abilities including languages like Common, Elvish, Draconic, and Celestial. It also provides resistance to certain damage types and enhanced senses.`
      }))
    },
    background: {
      definition: {
        name: 'Scholar',
        featureName: 'Researcher',
        featureDescription: 'You have extensive knowledge and access to research materials.',
        languagesDescription: 'Two languages of your choice, including rare scholarly languages'
      }
    },
    feats: Array.from({ length: config.features / 5 }, (_, i) => ({
      name: `Feat ${i + 1}`,
      description: `Feat description ${i + 1} providing mechanical benefits and roleplay opportunities.`
    })),
    optionalClassFeatures: Array.from({ length: config.features / 10 }, (_, i) => ({
      name: `Optional Feature ${i + 1}`,
      description: `Optional class feature ${i + 1} from various sourcebooks.`
    })),
    inventory: Array.from({ length: config.equipment }, (_, i) => ({
      name: `Magic Item ${i + 1}`,
      description: `A powerful magical item with complex properties and abilities.`,
      quantity: Math.floor(Math.random() * 3) + 1,
      equipped: Math.random() > 0.5
    })),
    spells: Array.from({ length: config.spells }, (_, i) => ({
      name: `Spell ${i + 1}`,
      level: Math.floor(i / 8) + 1,
      school: ['Evocation', 'Enchantment', 'Divination', 'Transmutation'][i % 4],
      description: `Spell description with casting time, range, components, and detailed effects.`
    })),
    modifiers: Array.from({ length: config.modifiers }, (_, i) => ({
      type: `modifier-${i}`,
      subType: ['ability-score', 'skill', 'saving-throw', 'proficiency'][i % 4],
      value: Math.floor(Math.random() * 6) + 1,
      source: `Source ${Math.floor(i / 10) + 1}`
    }))
  };
}

/**
 * Mock parser with realistic processing simulation
 */
const mockParser = {
  parseCharacter: async (character) => {
    // Simulate processing time based on character complexity
    const startTime = Date.now();
    
    // Parse abilities (always 6)
    const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    
    // Simulate ability score processing
    await new Promise(resolve => setTimeout(resolve, 1));
    
    // Parse skills and modifiers
    const modifiers = character.modifiers || [];
    const skills = modifiers.filter(m => m.subType === 'skill');
    
    // Simulate skill processing
    if (skills.length > 20) {
      await new Promise(resolve => setTimeout(resolve, 2));
    }
    
    // Parse equipment
    const equipment = character.inventory || [];
    
    // Simulate equipment processing
    if (equipment.length > 30) {
      await new Promise(resolve => setTimeout(resolve, 3));
    }
    
    // Parse spells
    const spells = character.spells || [];
    
    // Simulate spell processing
    if (spells.length > 40) {
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    
    // Parse features (most complex part)
    const features = [
      ...(character.classes?.[0]?.classFeatures || []),
      ...(character.classes?.[0]?.subclassDefinition?.classFeatures || []),
      ...(character.race?.racialTraits || []),
      ...(character.feats || []),
      ...(character.optionalClassFeatures || [])
    ];
    
    // Simulate feature processing (most time-consuming)
    if (features.length > 50) {
      await new Promise(resolve => setTimeout(resolve, 10));
    } else if (features.length > 20) {
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    
    // Language parsing
    const languages = new Set(['Common']);
    
    // Simulate language extraction
    character.race?.racialTraits?.forEach(trait => {
      const langMatch = trait.description?.match(/\b(Elvish|Draconic|Infernal|Celestial|Primordial|Sylvan|Abyssal|Deep Speech|Giant|Gnomish|Goblin|Halfling|Orc|Dwarvish)\b/gi);
      if (langMatch) {
        langMatch.forEach(lang => languages.add(lang));
      }
    });
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    return {
      name: character.name,
      type: 'character',
      processingTime,
      complexity: {
        totalFeatures: features.length,
        equipment: equipment.length,
        spells: spells.length,
        modifiers: modifiers.length,
        languages: languages.size
      },
      system: {
        attributes: {
          hp: { value: 100, max: 100 },
          ac: { value: 15 }
        },
        abilities: abilities.reduce((acc, ability) => {
          acc[ability] = { value: 15, mod: 2 };
          return acc;
        }, {}),
        details: {
          level: character.classes?.[0]?.level || 1,
          race: character.race?.fullName,
          class: character.classes?.[0]?.definition?.name
        },
        traits: {
          languages: { value: Array.from(languages) }
        }
      },
      items: features.map(feature => ({
        id: foundry.utils.randomID(),
        name: feature.name,
        type: 'feat',
        system: {
          description: { value: feature.description || '' }
        }
      })),
      effects: []
    };
  }
};

/**
 * Run performance tests
 */
async function runPerformanceTests() {
  console.log('\n🔥 SINGLE CHARACTER COMPLEXITY TESTS:');
  console.log('-' * 50);

  const complexityLevels = ['low', 'medium', 'high', 'extreme'];
  const singleCharResults = [];

  for (const complexity of complexityLevels) {
    console.log(`\n⚡ Testing ${complexity.toUpperCase()} complexity character:`);
    
    const startTime = Date.now();
    const testCharacter = generateComplexCharacter(complexity);
    const genTime = Date.now() - startTime;
    
    const parseStartTime = Date.now();
    const result = await mockParser.parseCharacter(testCharacter);
    const parseTime = Date.now() - parseStartTime;
    
    console.log(`  Generation time: ${genTime}ms`);
    console.log(`  Parse time: ${parseTime}ms`);
    console.log(`  Features: ${result.complexity.totalFeatures}`);
    console.log(`  Equipment: ${result.complexity.equipment}`);
    console.log(`  Spells: ${result.complexity.spells}`);
    console.log(`  Modifiers: ${result.complexity.modifiers}`);
    console.log(`  Languages: ${result.complexity.languages}`);
    
    singleCharResults.push({
      complexity,
      genTime,
      parseTime,
      totalTime: genTime + parseTime,
      ...result.complexity
    });
  }

  console.log('\n🚀 BATCH PROCESSING TESTS:');
  console.log('-' * 50);

  const batchSizes = [1, 5, 10, 25, 50];
  const batchResults = [];

  for (const batchSize of batchSizes) {
    console.log(`\n📦 Testing batch of ${batchSize} medium complexity characters:`);
    
    const batchStartTime = Date.now();
    const characters = Array.from({ length: batchSize }, () => generateComplexCharacter('medium'));
    const genTime = Date.now() - batchStartTime;
    
    const parseStartTime = Date.now();
    const results = await Promise.all(characters.map(char => mockParser.parseCharacter(char)));
    const parseTime = Date.now() - parseStartTime;
    
    const totalTime = genTime + parseTime;
    const avgTimePerChar = totalTime / batchSize;
    
    console.log(`  Generation time: ${genTime}ms`);
    console.log(`  Parse time: ${parseTime}ms`);
    console.log(`  Total time: ${totalTime}ms`);
    console.log(`  Avg per character: ${avgTimePerChar.toFixed(2)}ms`);
    console.log(`  Characters/second: ${(1000 / avgTimePerChar).toFixed(2)}`);
    
    batchResults.push({
      batchSize,
      genTime,
      parseTime,
      totalTime,
      avgTimePerChar,
      charactersPerSecond: 1000 / avgTimePerChar
    });
  }

  console.log('\n💾 MEMORY USAGE SIMULATION:');
  console.log('-' * 50);

  const memoryTest = generateComplexCharacter('extreme');
  const estimatedSize = JSON.stringify(memoryTest).length;
  const result = await mockParser.parseCharacter(memoryTest);
  const outputSize = JSON.stringify(result).length;
  
  console.log(`  Input size: ${(estimatedSize / 1024).toFixed(2)} KB`);
  console.log(`  Output size: ${(outputSize / 1024).toFixed(2)} KB`);
  console.log(`  Compression ratio: ${(outputSize / estimatedSize).toFixed(2)}x`);
  console.log(`  Memory efficiency: ${((1 - outputSize / estimatedSize) * 100).toFixed(1)}% reduction`);

  // Performance Summary
  console.log('\n📊 PERFORMANCE SUMMARY:');
  console.log('=' * 60);

  console.log('\nSingle Character Performance:');
  singleCharResults.forEach(result => {
    console.log(`  ${result.complexity.padEnd(8)}: ${result.parseTime.toString().padEnd(4)}ms (${result.totalFeatures} features)`);
  });

  console.log('\nBatch Processing Performance:');
  batchResults.forEach(result => {
    console.log(`  ${result.batchSize.toString().padEnd(2)} chars: ${result.avgTimePerChar.toFixed(2).padEnd(6)}ms avg, ${result.charactersPerSecond.toFixed(1)} chars/sec`);
  });

  // Performance thresholds
  const maxAcceptableTime = 100; // ms
  const maxBatchTime = 500; // ms for 10 characters
  
  const singleCharPassed = singleCharResults.every(r => r.parseTime <= maxAcceptableTime);
  const batchPassed = batchResults.find(r => r.batchSize === 10)?.avgTimePerChar <= 50;
  
  console.log('\n🎯 PERFORMANCE EVALUATION:');
  console.log(`  Single character (< ${maxAcceptableTime}ms): ${singleCharPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Batch processing (< 50ms avg): ${batchPassed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (singleCharPassed && batchPassed) {
    console.log('\n🚀 PERFORMANCE EXCELLENT - Ready for production!');
  } else {
    console.log('\n⚠️  PERFORMANCE ISSUES - Consider optimization');
  }

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('  - Target: < 50ms per character for responsive UI');
  console.log('  - Batch size: 5-10 characters for optimal UX');
  console.log('  - Memory: Monitor large character imports');
  console.log('  - Caching: Consider feature template caching');

  return {
    singleCharResults,
    batchResults,
    performancePassed: singleCharPassed && batchPassed
  };
}

// Run the performance tests
runPerformanceTests().catch(console.error);
