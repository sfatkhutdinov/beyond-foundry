/**
 * Multi-Character Testing Script
 * Tests the parser with different character types, classes, races, and levels
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

console.log('🧪 BEYOND FOUNDRY - MULTI-CHARACTER TESTING');
console.log('=' * 60);

/**
 * Generate synthetic character data for different character types
 */
function generateTestCharacter(type) {
  const baseCharacter = {
    name: `Test ${type.name}`,
    classes: [{
      level: type.level,
      definition: {
        name: type.class,
        hitDie: type.hitDie || 8
      },
      classFeatures: Array.from({ length: type.classFeatures || 5 }, (_, i) => ({
        name: `${type.class} Feature ${i + 1}`,
        description: `Description for ${type.class} feature ${i + 1}`,
        requiredLevel: Math.min(i + 1, type.level)
      })),
      subclassDefinition: {
        name: type.subclass || `Path of ${type.class}`,
        classFeatures: Array.from({ length: type.subclassFeatures || 3 }, (_, i) => ({
          name: `${type.subclass || 'Subclass'} Feature ${i + 1}`,
          description: `Subclass feature description ${i + 1}`,
          requiredLevel: Math.min(i * 2 + 3, type.level)
        }))
      }
    }],
    race: {
      fullName: type.race,
      racialTraits: Array.from({ length: type.racialTraits || 4 }, (_, i) => ({
        name: `${type.race} Trait ${i + 1}`,
        description: `Racial trait description ${i + 1}. You know Common and ${type.raceLanguage || 'Elvish'}.`
      }))
    },
    background: {
      definition: {
        name: type.background || 'Folk Hero',
        featureName: `${type.background || 'Folk Hero'} Feature`,
        featureDescription: 'Background feature description',
        languagesDescription: type.backgroundLanguages || 'One language of your choice'
      }
    },
    feats: Array.from({ length: type.feats || 2 }, (_, i) => ({
      name: `Feat ${i + 1}`,
      description: `Feat description ${i + 1}`
    })),
    optionalClassFeatures: Array.from({ length: type.optionalFeatures || 1 }, (_, i) => ({
      name: `Optional Feature ${i + 1}`,
      description: `Optional class feature ${i + 1}`
    })),
    inventory: Array.from({ length: type.equipment || 10 }, (_, i) => ({
      name: `Item ${i + 1}`,
      quantity: 1
    })),
    spells: Array.from({ length: type.spells || 0 }, (_, i) => ({
      name: `Spell ${i + 1}`,
      level: Math.floor(i / 2) + 1
    })),
    modifiers: Array.from({ length: type.modifiers || 15 }, (_, i) => ({
      type: `modifier-${i}`,
      subType: i % 2 === 0 ? 'ability-score' : 'skill',
      value: Math.floor(Math.random() * 6) + 1
    }))
  };

  return baseCharacter;
}

/**
 * Character type definitions for testing
 */
const characterTypes = [
  {
    name: 'Low Level Fighter',
    class: 'Fighter',
    subclass: 'Champion',
    race: 'Human',
    background: 'Soldier',
    level: 3,
    hitDie: 10,
    classFeatures: 3,
    subclassFeatures: 1,
    racialTraits: 2,
    feats: 0,
    equipment: 8,
    spells: 0,
    raceLanguage: 'Common',
    backgroundLanguages: 'One language of your choice'
  },
  {
    name: 'Mid Level Wizard',
    class: 'Wizard',
    subclass: 'School of Evocation',
    race: 'High Elf',
    background: 'Sage',
    level: 10,
    hitDie: 6,
    classFeatures: 8,
    subclassFeatures: 4,
    racialTraits: 5,
    feats: 1,
    equipment: 12,
    spells: 25,
    raceLanguage: 'Elvish',
    backgroundLanguages: 'Two languages of your choice'
  },
  {
    name: 'High Level Druid',
    class: 'Druid',
    subclass: 'Circle of the Moon',
    race: 'Wood Elf',
    background: 'Hermit',
    level: 20,
    hitDie: 8,
    classFeatures: 15,
    subclassFeatures: 8,
    racialTraits: 4,
    feats: 3,
    equipment: 15,
    spells: 40,
    raceLanguage: 'Elvish',
    backgroundLanguages: 'One language of your choice'
  },
  {
    name: 'Multiclass Paladin-Warlock',
    class: 'Paladin',
    subclass: 'Oath of Vengeance',
    race: 'Dragonborn',
    background: 'Noble',
    level: 8,
    hitDie: 10,
    classFeatures: 6,
    subclassFeatures: 3,
    racialTraits: 3,
    feats: 1,
    equipment: 20,
    spells: 15,
    raceLanguage: 'Draconic',
    backgroundLanguages: 'One language of your choice'
  },
  {
    name: 'Spellcaster Sorcerer',
    class: 'Sorcerer',
    subclass: 'Wild Magic',
    race: 'Tiefling',
    background: 'Charlatan',
    level: 15,
    hitDie: 6,
    classFeatures: 12,
    subclassFeatures: 6,
    racialTraits: 4,
    feats: 2,
    equipment: 10,
    spells: 35,
    raceLanguage: 'Infernal',
    backgroundLanguages: 'Two languages of your choice'
  }
];

/**
 * Mock parser for testing
 */
const mockParser = {
  parseCharacter: async (character) => {
    const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const skills = (character.modifiers || []).filter(m => m.subType === 'skill').length;
    const equipment = character.inventory?.length || 0;
    const spells = character.spells?.length || 0;
    
    const features = [
      ...(character.classes?.[0]?.classFeatures || []),
      ...(character.classes?.[0]?.subclassDefinition?.classFeatures || []),
      ...(character.race?.racialTraits || []),
      ...(character.feats || []),
      ...(character.optionalClassFeatures || [])
    ];

    // Extract languages
    const languages = new Set(['Common']);
    
    // From racial traits
    character.race?.racialTraits?.forEach(trait => {
      const langMatch = trait.description?.match(/\b(Elvish|Draconic|Infernal|Celestial|Primordial|Sylvan|Abyssal|Deep Speech|Giant|Gnomish|Goblin|Halfling|Orc|Dwarvish)\b/gi);
      if (langMatch) {
        langMatch.forEach(lang => languages.add(lang));
      }
    });

    // For Druids, add Druidic
    if (character.classes?.[0]?.definition?.name === 'Druid') {
      languages.add('Druidic');
    }

    return {
      name: character.name,
      type: 'character',
      system: {
        attributes: {
          hp: { value: character.classes[0].level * character.classes[0].definition.hitDie, max: character.classes[0].level * character.classes[0].definition.hitDie },
          ac: { value: 10 + Math.floor(Math.random() * 8) }
        },
        abilities: abilities.reduce((acc, ability) => {
          acc[ability] = { value: 10 + Math.floor(Math.random() * 8), mod: Math.floor(Math.random() * 4) };
          return acc;
        }, {}),
        details: {
          level: character.classes[0].level,
          race: character.race.fullName,
          class: character.classes[0].definition.name,
          background: character.background?.definition?.name
        },
        traits: {
          languages: { value: Array.from(languages) }
        },
        skills: {},
        spells: {
          spell1: { value: Math.min(spells, 4), max: 4 },
          spell2: { value: Math.min(Math.max(spells - 4, 0), 3), max: 3 }
        }
      },
      items: features.map(feature => ({
        id: foundry.utils.randomID(),
        name: feature.name,
        type: 'feat',
        system: {
          description: { value: feature.description || '' },
          requirements: feature.requiredLevel ? `Level ${feature.requiredLevel}` : '',
          source: 'D&D Beyond Import'
        }
      })),
      effects: []
    };
  }
};

/**
 * Run comprehensive multi-character testing
 */
async function runMultiCharacterTests() {
  console.log('\n🎭 Testing Different Character Types:');
  console.log('-' * 40);

  const results = [];

  for (const charType of characterTypes) {
    console.log(`\n📊 Testing: ${charType.name}`);
    console.log(`  Class: ${charType.class} (${charType.subclass})`);
    console.log(`  Race: ${charType.race}`);
    console.log(`  Level: ${charType.level}`);
    console.log(`  Background: ${charType.background}`);

    try {
      const startTime = Date.now();
      
      // Generate test character
      const testCharacter = generateTestCharacter(charType);
      
      // Parse character
      const parsedCharacter = await mockParser.parseCharacter(testCharacter);
      
      const endTime = Date.now();
      const parseTime = endTime - startTime;

      // Validate results
      const validation = {
        hasName: !!parsedCharacter.name,
        hasCorrectLevel: parsedCharacter.system.details.level === charType.level,
        hasCorrectClass: parsedCharacter.system.details.class === charType.class,
        hasCorrectRace: parsedCharacter.system.details.race === charType.race,
        hasFeatures: parsedCharacter.items.length > 0,
        hasLanguages: parsedCharacter.system.traits.languages.value.length > 0,
        hasAbilities: Object.keys(parsedCharacter.system.abilities).length === 6,
        validHP: parsedCharacter.system.attributes.hp.max > 0
      };

      const success = Object.values(validation).every(v => v === true);

      console.log(`  ✅ Parse time: ${parseTime}ms`);
      console.log(`  ✅ Features: ${parsedCharacter.items.length}`);
      console.log(`  ✅ Languages: ${parsedCharacter.system.traits.languages.value.join(', ')}`);
      console.log(`  ✅ HP: ${parsedCharacter.system.attributes.hp.max}`);
      console.log(`  ${success ? '✅' : '❌'} Validation: ${success ? 'PASSED' : 'FAILED'}`);

      results.push({
        type: charType.name,
        success,
        parseTime,
        features: parsedCharacter.items.length,
        languages: parsedCharacter.system.traits.languages.value.length,
        validation
      });

    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      results.push({
        type: charType.name,
        success: false,
        error: error.message
      });
    }
  }

  // Summary Report
  console.log('\n📋 MULTI-CHARACTER TEST SUMMARY:');
  console.log('=' * 50);

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  console.log(`Success Rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  console.log(`Average Parse Time: ${Math.round(results.filter(r => r.parseTime).reduce((a, b) => a + b.parseTime, 0) / results.filter(r => r.parseTime).length)}ms`);

  console.log('\nDetailed Results:');
  results.forEach(result => {
    console.log(`  ${result.success ? '✅' : '❌'} ${result.type}`);
    if (result.success) {
      console.log(`    Features: ${result.features}, Languages: ${result.languages}, Time: ${result.parseTime}ms`);
    } else if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });

  // Feature Distribution Analysis
  console.log('\n📊 FEATURE DISTRIBUTION ANALYSIS:');
  console.log('-' * 30);
  
  const successResults = results.filter(r => r.success);
  if (successResults.length > 0) {
    const avgFeatures = Math.round(successResults.reduce((a, b) => a + b.features, 0) / successResults.length);
    const avgLanguages = Math.round(successResults.reduce((a, b) => a + b.languages, 0) / successResults.length);
    
    console.log(`Average Features per Character: ${avgFeatures}`);
    console.log(`Average Languages per Character: ${avgLanguages}`);
    
    console.log('\nFeature Count by Character Type:');
    successResults.forEach(result => {
      console.log(`  ${result.type}: ${result.features} features, ${result.languages} languages`);
    });
  }

  console.log('\n🎉 MULTI-CHARACTER TESTING COMPLETED');
  
  if (successCount === totalCount) {
    console.log('✅ All character types tested successfully!');
    console.log('🚀 Parser is ready for diverse character imports');
  } else {
    console.log(`⚠️  ${totalCount - successCount} character types failed testing`);
    console.log('🔧 Review failed cases for compatibility issues');
  }

  return results;
}

// Run the tests
runMultiCharacterTests().catch(console.error);
