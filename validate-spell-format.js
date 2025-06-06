/**
 * FoundryVTT D&D 5e Spell Format Validation
 * Validates spell data conversion against FoundryVTT requirements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FOUNDRY_SPELL_SCHEMA = {
  required: ['name', 'type', 'system'],
  system: {
    required: ['description', 'level', 'school', 'components', 'activation', 'duration', 'range', 'target'],
    components: {
      required: ['vocal', 'somatic', 'material', 'ritual', 'concentration'],
      types: {
        vocal: 'boolean',
        somatic: 'boolean', 
        material: 'boolean',
        ritual: 'boolean',
        concentration: 'boolean'
      }
    },
    activation: {
      required: ['type', 'cost'],
      validTypes: ['action', 'bonus', 'reaction', 'minute', 'hour', 'day', 'special']
    },
    duration: {
      required: ['value', 'units'],
      validUnits: ['inst', 'turn', 'round', 'minute', 'hour', 'day', 'month', 'year', 'perm', 'spec']
    },
    range: {
      required: ['value', 'units'],
      validUnits: ['self', 'touch', 'ft', 'mi', 'spec', 'any']
    },
    target: {
      required: ['value', 'width', 'units', 'type'],
      validTypes: ['self', 'creature', 'ally', 'enemy', 'object', 'space', 'radius', 'sphere', 'cylinder', 'cone', 'square', 'cube', 'line', 'wall']
    },
    school: {
      validSchools: ['abj', 'con', 'div', 'enc', 'evo', 'ill', 'nec', 'trs']
    }
  }
};

function validateSpellFormat() {
  console.log('🔍 FOUNDRY SPELL FORMAT VALIDATION');
  console.log('='.repeat(50));
  
  const comprehensiveFile = path.join(__dirname, 'comprehensive-parser-results/complete-foundry-actor-147239148.json');
  
  if (!fs.existsSync(comprehensiveFile)) {
    console.log('❌ Character data not found');
    return;
  }
  
  const actor = JSON.parse(fs.readFileSync(comprehensiveFile, 'utf8'));
  const spells = actor.items.filter(item => item.type === 'spell');
  
  console.log(`\n📊 Validating ${spells.length} spells...\n`);
  
  let totalIssues = 0;
  const issuesByCategory = {
    components: 0,
    activation: 0,
    duration: 0,
    range: 0,
    target: 0,
    school: 0,
    structure: 0
  };
  
  spells.forEach((spell, index) => {
    console.log(`${index + 1}. ${spell.name}`);
    
    const spellIssues = validateSingleSpell(spell);
    totalIssues += spellIssues.length;
    
    spellIssues.forEach(issue => {
      console.log(`   ❌ ${issue.category}: ${issue.message}`);
      issuesByCategory[issue.category]++;
    });
    
    if (spellIssues.length === 0) {
      console.log(`   ✅ Valid FoundryVTT format`);
    }
    console.log('');
  });
  
  console.log('📋 VALIDATION SUMMARY');
  console.log('-'.repeat(30));
  console.log(`Total Issues Found: ${totalIssues}`);
  console.log(`\nIssues by Category:`);
  Object.entries(issuesByCategory).forEach(([category, count]) => {
    if (count > 0) {
      console.log(`  ${category}: ${count} issues`);
    }
  });
  
  if (totalIssues === 0) {
    console.log('\n🎉 All spells are properly formatted for FoundryVTT!');
  } else {
    console.log(`\n⚠️  ${totalIssues} formatting issues need to be fixed.`);
  }
  
  return { totalIssues, issuesByCategory, spells };
}

function validateSingleSpell(spell) {
  const issues = [];
  
  // Validate structure
  if (!spell.system) {
    issues.push({ category: 'structure', message: 'Missing system object' });
    return issues;
  }
  
  const system = spell.system;
  
  // Validate components
  if (!system.components) {
    issues.push({ category: 'components', message: 'Missing components object' });
  } else {
    const comp = system.components;
    if (typeof comp.vocal !== 'boolean') {
      issues.push({ category: 'components', message: 'vocal must be boolean' });
    }
    if (typeof comp.somatic !== 'boolean') {
      issues.push({ category: 'components', message: 'somatic must be boolean' });
    }
    if (typeof comp.material !== 'boolean') {
      issues.push({ category: 'components', message: 'material must be boolean' });
    }
    if (typeof comp.ritual !== 'boolean') {
      issues.push({ category: 'components', message: 'ritual must be boolean' });
    }
    if (typeof comp.concentration !== 'boolean') {
      issues.push({ category: 'components', message: 'concentration must be boolean' });
    }
  }
  
  // Validate activation
  if (!system.activation) {
    issues.push({ category: 'activation', message: 'Missing activation object' });
  } else {
    const act = system.activation;
    if (!FOUNDRY_SPELL_SCHEMA.system.activation.validTypes.includes(act.type)) {
      issues.push({ category: 'activation', message: `Invalid activation type: ${act.type}` });
    }
    if (typeof act.cost !== 'number') {
      issues.push({ category: 'activation', message: 'activation cost must be number' });
    }
  }
  
  // Validate duration
  if (!system.duration) {
    issues.push({ category: 'duration', message: 'Missing duration object' });
  } else {
    const dur = system.duration;
    if (!FOUNDRY_SPELL_SCHEMA.system.duration.validUnits.includes(dur.units)) {
      issues.push({ category: 'duration', message: `Invalid duration units: ${dur.units}` });
    }
  }
  
  // Validate range
  if (!system.range) {
    issues.push({ category: 'range', message: 'Missing range object' });
  } else {
    const range = system.range;
    if (!FOUNDRY_SPELL_SCHEMA.system.range.validUnits.includes(range.units)) {
      issues.push({ category: 'range', message: `Invalid range units: ${range.units}` });
    }
  }
  
  // Validate target
  if (!system.target) {
    issues.push({ category: 'target', message: 'Missing target object' });
  } else {
    const target = system.target;
    if (target.type && !FOUNDRY_SPELL_SCHEMA.system.target.validTypes.includes(target.type)) {
      issues.push({ category: 'target', message: `Invalid target type: ${target.type}` });
    }
  }
  
  // Validate school
  if (!FOUNDRY_SPELL_SCHEMA.system.school.validSchools.includes(system.school)) {
    issues.push({ category: 'school', message: `Invalid school: ${system.school}` });
  }
  
  return issues;
}

// Run validation
const results = validateSpellFormat();
