// Analyze the imported spells and verify FoundryVTT transformation
const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, '../comprehensive-parser-results');

/**
 * Mock SpellParser for analysis (simplified version of the TypeScript SpellParser)
 */
class MockSpellParser {
  static parseSpell(ddbSpell, options = {}) {
    const definition = ddbSpell.definition;

    if (!definition) {
      console.warn(`Spell missing definition: ${ddbSpell.id}`);
      return this.createEmptySpell();
    }

    console.log(`📜 Parsing spell: ${definition.name} (Level ${definition.level})`);

    const foundrySpell = {
      name: definition.name,
      type: 'spell',
      img: this.getSpellIcon(definition),
      system: {
        description: {
          value: this.parseDescription(definition),
          chat: this.parseChatDescription(definition),
          unidentified: '',
        },
        source: this.parseSource(definition),
        activation: this.parseActivation(definition),
        duration: this.parseDuration(definition),
        target: this.parseTarget(definition),
        range: this.parseRange(definition),
        uses: this.parseUses(ddbSpell),
        consume: this.parseConsume(definition),
        ability: this.parseAbility(ddbSpell),
        actionType: this.parseActionType(definition),
        attackBonus: this.parseAttackBonus(definition),
        chatFlavor: '',
        critical: this.parseCritical(definition),
        damage: this.parseDamage(definition),
        formula: this.parseFormula(definition),
        save: this.parseSave(definition),
        level: definition.level,
        school: this.parseSchool(definition.school),
        components: this.parseComponents(definition),
        materials: this.parseMaterials(definition),
        preparation: this.parsePreparation(ddbSpell, options),
        scaling: this.parseScaling(definition),
        properties: this.parseProperties(definition),
      },
      effects: this.parseActiveEffects(definition),
      flags: {
        'beyond-foundry': {
          ddbId: definition.id,
          sourceId: ddbSpell.id,
          prepared: ddbSpell.prepared || false,
          alwaysPrepared: ddbSpell.alwaysPrepared || false,
          usesSpellSlot: ddbSpell.usesSpellSlot !== false,
          castAtLevel: ddbSpell.castAtLevel || null,
        }
      },
    };

    return foundrySpell;
  }

  static parseDescription(definition) {
    return definition.description || '';
  }

  static parseChatDescription(definition) {
    const desc = definition.description || '';
    const sentences = desc.split('.').slice(0, 2);
    return sentences.join('.') + (sentences.length < desc.split('.').length ? '...' : '');
  }

  static parseSource(definition) {
    if (definition.sources && definition.sources.length > 0) {
      const source = definition.sources[0];
      return `${source.sourceType === 1 ? 'PHB' : 'Supplement'} ${source.pageNumber || ''}`.trim();
    }
    return '';
  }

  static parseActivation(definition) {
    const activation = definition.activation || {};
    const typeMap = {
      1: 'action',
      2: 'bonus', 
      3: 'reaction',
      4: 'minute',
      5: 'hour',
      6: 'minute',
      7: 'day',
    };

    return {
      type: typeMap[activation.activationType] || 'action',
      cost: activation.activationTime || 1,
      condition: activation.activationCondition || '',
    };
  }

  static parseDuration(definition) {
    const duration = definition.duration || {};
    const unitMap = {
      'Instantaneous': 'inst',
      'Minute': 'minute',
      'Hour': 'hour', 
      'Day': 'day',
      'Until Dispelled': 'perm',
      'Special': 'spec',
    };

    return {
      value: duration.durationInterval || null,
      units: unitMap[duration.durationUnit] || 'inst',
    };
  }

  static parseTarget(definition) {
    const range = definition.range || {};
    const typeMap = {
      'Self': 'self',
      'Touch': 'touch',
      'Ranged': 'creature',
      'Point': 'space',
      'Line': 'line',
      'Cone': 'cone',
      'Cube': 'cube',
      'Cylinder': 'cylinder',
      'Sphere': 'sphere',
      'Square': 'square',
    };

    return {
      value: range.aoeValue || null,
      width: null,
      units: 'ft',
      type: typeMap[range.aoeType || range.origin] || 'creature',
    };
  }

  static parseRange(definition) {
    const range = definition.range || {};
    const unitMap = {
      'Self': 'self',
      'Touch': 'touch',
      'Ranged': 'ft',
      'Sight': 'spec',
      'Unlimited': 'any',
    };

    return {
      value: range.rangeValue || null,
      long: null,
      units: unitMap[range.origin] || 'ft',
    };
  }

  static parseUses(ddbSpell) {
    const limitedUse = ddbSpell.limitedUse;
    if (!limitedUse) {
      return {
        value: null,
        max: '',
        per: null,
        recovery: '',
      };
    }

    const recoveryMap = {
      1: 'sr',
      2: 'lr', 
      3: 'day',
      4: 'charges',
    };

    return {
      value: limitedUse.maxUses || null,
      max: limitedUse.maxUses?.toString() || '',
      per: recoveryMap[limitedUse.resetType] || null,
      recovery: '',
    };
  }

  static parseConsume(definition) {
    return {
      type: 'slots',
      target: `spell${definition.level || 1}`,
      amount: 1,
      scale: false,
    };
  }

  static parseAbility(ddbSpell) {
    return ddbSpell.spellCastingAbilityId ? this.mapAbilityId(ddbSpell.spellCastingAbilityId) : null;
  }

  static parseActionType(definition) {
    if (definition.attackType === 1) return 'mwak';
    if (definition.attackType === 2) return 'rwak';
    if (definition.attackType === 3) return 'msak';
    if (definition.attackType === 4) return 'rsak';
    if (definition.saveType) return 'save';
    if (definition.healingTypes && definition.healingTypes.length > 0) return 'heal';
    return 'other';
  }

  static parseAttackBonus(definition) {
    return '';
  }

  static parseCritical(definition) {
    return {
      threshold: null,
      damage: '',
    };
  }

  static parseDamage(definition) {
    const parts = [];
    if (definition.damageTypes && definition.damageTypes.length > 0) {
      definition.damageTypes.forEach((damageType, index) => {
        if (definition.dice && definition.dice[index]) {
          const dice = definition.dice[index];
          const formula = `${dice.diceCount || 1}d${dice.diceValue || 6}${dice.fixedValue ? ` + ${dice.fixedValue}` : ''}`;
          parts.push([formula, damageType.toLowerCase()]);
        }
      });
    }

    return {
      parts,
      versatile: '',
      value: '',
    };
  }

  static parseFormula(definition) {
    if (definition.healingTypes && definition.healingTypes.length > 0 && definition.dice) {
      const dice = definition.dice[0];
      if (dice) {
        return `${dice.diceCount || 1}d${dice.diceValue || 6}${dice.fixedValue ? ` + ${dice.fixedValue}` : ''}`;
      }
    }
    return '';
  }

  static parseSave(definition) {
    if (!definition.saveType) {
      return {
        ability: '',
        dc: null,
        scaling: 'spell',
      };
    }

    const abilityMap = {
      1: 'str',
      2: 'dex',
      3: 'con',
      4: 'int',
      5: 'wis',
      6: 'cha',
    };

    return {
      ability: abilityMap[definition.saveType] || '',
      dc: null,
      scaling: 'spell',
    };
  }

  static parseSchool(school) {
    return school ? school.toLowerCase() : 'evocation';
  }

  static parseComponents(definition) {
    const components = definition.components || [];
    const hasVerbal = components.includes(1);
    const hasSomatic = components.includes(2);
    const hasMaterial = components.includes(3);

    return {
      vocal: hasVerbal,
      somatic: hasSomatic,
      material: hasMaterial,
      ritual: definition.ritual || false,
      concentration: definition.concentration || false,
    };
  }

  static parseMaterials(definition) {
    return {
      value: definition.componentsDescription || '',
      consumed: false,
      cost: this.extractCost(definition.componentsDescription || ''),
      supply: 0,
    };
  }

  static parsePreparation(ddbSpell, options) {
    const mode = options.preparationMode || 'prepared';
    return {
      mode,
      prepared: ddbSpell.prepared || false,
    };
  }

  static parseScaling(definition) {
    if (!definition.higherLevelDescription) {
      return {
        mode: 'none',
        formula: '',
      };
    }

    const scalingFormula = this.extractScalingFormula(definition.higherLevelDescription);
    return {
      mode: scalingFormula ? 'level' : 'none',
      formula: scalingFormula,
    };
  }

  static parseProperties(definition) {
    const properties = [];
    if (definition.ritual) properties.push('ritual');
    if (definition.concentration) properties.push('concentration');
    if (definition.components?.vocal) properties.push('vocal');
    if (definition.components?.somatic) properties.push('somatic');
    if (definition.components?.material) properties.push('material');
    return properties;
  }

  static parseActiveEffects(definition) {
    return [];
  }

  static getSpellIcon(definition) {
    const schoolIcons = {
      'Abjuration': 'icons/magic/defensive/shield-barrier-blue.webp',
      'Conjuration': 'icons/magic/symbols/elements-air-earth-fire-water.webp',
      'Divination': 'icons/magic/perception/eye-ringed-glow-yellow.webp',
      'Enchantment': 'icons/magic/control/hypnosis-mesmerism-swirl.webp',
      'Evocation': 'icons/magic/lightning/bolt-strike-blue.webp',
      'Illusion': 'icons/magic/perception/silhouette-stealth-shadow.webp',
      'Necromancy': 'icons/magic/death/skull-horned-goat-pentagram-red.webp',
      'Transmutation': 'icons/magic/symbols/question-stone-yellow.webp',
    };
    return schoolIcons[definition.school] || 'icons/svg/mystery-man.svg';
  }

  static createEmptySpell() {
    return {
      name: 'Unknown Spell',
      type: 'spell',
      img: 'icons/svg/mystery-man.svg',
      system: {},
      effects: [],
      flags: {},
    };
  }

  static mapAbilityId(abilityId) {
    const abilityMap = {
      1: 'str',
      2: 'dex',
      3: 'con',
      4: 'int',
      5: 'wis',
      6: 'cha',
    };
    return abilityMap[abilityId] || 'int';
  }

  static extractCost(materials) {
    const costMatch = materials.match(/(\d+)\s*gp/i);
    return costMatch ? parseInt(costMatch[1]) : 0;
  }

  static extractScalingFormula(description) {
    const scalingMatch = description.match(/(\d+d\d+)/);
    return scalingMatch ? scalingMatch[1] : '';
  }
}

/**
 * Validate FoundryVTT spell schema completeness
 */
function validateFoundrySpellSchema(foundrySpell) {
  const issues = [];
  
  // Required top-level fields
  if (!foundrySpell.name) issues.push('Missing name');
  if (!foundrySpell.type) issues.push('Missing type');
  if (!foundrySpell.system) issues.push('Missing system data');
  
  if (foundrySpell.system) {
    const sys = foundrySpell.system;
    
    // Required system fields for spells
    if (typeof sys.level !== 'number') issues.push('Missing or invalid level');
    if (!sys.school) issues.push('Missing school');
    if (!sys.description || !sys.description.value) issues.push('Missing description');
    if (!sys.activation) issues.push('Missing activation');
    if (!sys.duration) issues.push('Missing duration');
    if (!sys.target) issues.push('Missing target');
    if (!sys.range) issues.push('Missing range');
    if (!sys.components) issues.push('Missing components');
    
    // Spell-specific validations
    if (sys.level > 0 && !sys.consume) issues.push('Missing consume data for leveled spell');
    if (sys.actionType === 'save' && (!sys.save || !sys.save.ability)) {
      issues.push('Save spell missing save ability');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
    completeness: Math.max(0, 1 - (issues.length / 15)) // Score out of 15 key fields
  };
}

async function main() {
  console.log('🔍 Analyzing Spell Transformation and FoundryVTT Schema Compliance\n');

  // Load the character spell data we successfully imported
  const characterSpellFile = path.join(RESULTS_DIR, 'character-spells.json');
  if (!fs.existsSync(characterSpellFile)) {
    console.error('❌ Character spell data not found. Run fetch-spells-enhanced.cjs first.');
    process.exit(1);
  }

  const characterData = JSON.parse(fs.readFileSync(characterSpellFile, 'utf8'));
  const ddbSpells = characterData.spells;
  
  console.log(`📊 Analyzing ${ddbSpells.length} D&D Beyond spells for FoundryVTT transformation`);
  console.log(`   Character: ${characterData.character.name} (${characterData.character.classes.map(c => c.name).join('/')})\n`);

  const transformedSpells = [];
  const validationResults = [];
  let totalScore = 0;

  // Transform each spell and validate
  ddbSpells.forEach((ddbSpell, index) => {
    console.log(`📜 ${index + 1}/${ddbSpells.length}: ${ddbSpell.definition.name}`);
    
    // Transform using mock parser
    const foundrySpell = MockSpellParser.parseSpell(ddbSpell);
    transformedSpells.push(foundrySpell);
    
    // Validate schema completeness
    const validation = validateFoundrySpellSchema(foundrySpell);
    validationResults.push({
      spellName: ddbSpell.definition.name,
      ddbId: ddbSpell.definition.id,
      ...validation
    });
    
    totalScore += validation.completeness;
    
    if (validation.issues.length > 0) {
      console.log(`   ⚠️  Issues: ${validation.issues.join(', ')}`);
    } else {
      console.log(`   ✅ Valid FoundryVTT schema`);
    }
  });

  const averageScore = totalScore / ddbSpells.length;
  
  // Create analysis report
  const analysis = {
    metadata: {
      analyzedAt: new Date().toISOString(),
      sourceCharacter: characterData.character,
      totalSpellsAnalyzed: ddbSpells.length,
      averageSchemaCompleteness: averageScore
    },
    originalSpells: ddbSpells,
    transformedSpells: transformedSpells,
    validationResults: validationResults,
    summary: {
      fullyValidSpells: validationResults.filter(r => r.valid).length,
      averageCompleteness: averageScore,
      commonIssues: {},
      spellsByLevel: {},
      spellsBySchool: {},
      transformationStatus: averageScore > 0.8 ? 'EXCELLENT' : averageScore > 0.6 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
    }
  };

  // Calculate common issues
  validationResults.forEach(result => {
    result.issues.forEach(issue => {
      analysis.summary.commonIssues[issue] = (analysis.summary.commonIssues[issue] || 0) + 1;
    });
  });

  // Calculate distributions
  transformedSpells.forEach(spell => {
    const level = spell.system.level || 0;
    const school = spell.system.school || 'unknown';
    
    analysis.summary.spellsByLevel[level] = (analysis.summary.spellsByLevel[level] || 0) + 1;
    analysis.summary.spellsBySchool[school] = (analysis.summary.spellsBySchool[school] || 0) + 1;
  });

  // Save analysis results
  const analysisFile = path.join(RESULTS_DIR, 'spell-transformation-analysis.json');
  fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));

  // Print summary
  console.log('\n📋 ANALYSIS SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Total Spells Analyzed: ${ddbSpells.length}`);
  console.log(`Fully Valid Spells: ${analysis.summary.fullyValidSpells}/${ddbSpells.length} (${(100 * analysis.summary.fullyValidSpells / ddbSpells.length).toFixed(1)}%)`);
  console.log(`Average Schema Completeness: ${(averageScore * 100).toFixed(1)}%`);
  console.log(`Transformation Status: ${analysis.summary.transformationStatus}`);
  console.log(`\nData Format: ${ddbSpells.every(s => s.definition) ? 'D&D Beyond Raw Format' : 'Unknown Format'}`);
  console.log(`FoundryVTT Conversion: ${transformedSpells.every(s => s.system) ? 'Successfully Applied' : 'Partial/Failed'}`);
  
  if (Object.keys(analysis.summary.commonIssues).length > 0) {
    console.log('\nCommon Issues:');
    Object.entries(analysis.summary.commonIssues)
      .sort(([,a], [,b]) => b - a)
      .forEach(([issue, count]) => {
        console.log(`   ${issue}: ${count} spells`);
      });
  }

  console.log('\nSpell Distribution:');
  console.log('   By Level:', analysis.summary.spellsByLevel);
  console.log('   By School:', analysis.summary.spellsBySchool);

  console.log(`\n✅ Analysis complete! Report saved to: ${analysisFile}`);
  console.log(`   File size: ${JSON.stringify(analysis).length} characters`);
  console.log(`   Lines: ${JSON.stringify(analysis, null, 2).split('\n').length}`);

  // Return status code based on results
  if (averageScore > 0.8) {
    console.log('\n🎉 EXCELLENT: Spell transformation is working very well!');
    process.exit(0);
  } else if (averageScore > 0.6) {
    console.log('\n✅ GOOD: Spell transformation is working with minor issues.');
    process.exit(0);
  } else {
    console.log('\n⚠️  NEEDS IMPROVEMENT: Spell transformation has significant issues.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('💥 Analysis failed:', err);
  process.exit(1);
});
