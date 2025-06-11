/**
 * Spell Enhancement Analysis & Demonstration
 * 
 * This script analyzes D&D Beyond spell data to demonstrate enhancement opportunities
 * without complex type system integration.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface SpellAnalysis {
  name: string;
  level: number;
  school: string;
  hasAttack: boolean;
  hasSave: boolean;
  hasHealing: boolean;
  hasDamage: boolean;
  hasConditions: boolean;
  hasScaling: boolean;
  complexityScore: number;
  enhancementOpportunities: string[];
  suggestedActivities: ActivitySuggestion[];
}

interface ActivitySuggestion {
  type: 'attack' | 'save' | 'damage' | 'heal' | 'utility' | 'enchant';
  name: string;
  description: string;
  automationPotential: 'high' | 'medium' | 'low';
}

/**
 * Analyze D&D Beyond spells for FoundryVTT Activity System enhancement potential
 */
export class SpellEnhancementAnalyzer {
  
  static analyzeSpell(ddbSpell: any): SpellAnalysis {
    const definition = ddbSpell?.definition || {};
    const name = definition.name || 'Unknown Spell';
    
    // Basic spell properties
    const level = definition.level || 0;
    const school = definition.school || 'Unknown';
    
    // Analyze spell mechanics
    const hasAttack = !!(definition.attackType || definition.requiresAttackRoll);
    const hasSave = !!(definition.saveType || definition.requiresSavingThrow || definition.saveDcAbilityId);
    const hasHealing = !!(definition.healingDice?.length > 0 || definition.healing);
    const hasDamage = !!(definition.modifiers?.some((m: any) => m.type === 'damage'));
    const hasConditions = !!(definition.conditions?.length > 0);
    const hasScaling = !!(definition.higherLevelDescription || definition.atHigherLevels);
    
    // Calculate complexity score
    let complexityScore = 0;
    if (hasAttack) complexityScore += 2;
    if (hasSave) complexityScore += 2;
    if (hasHealing) complexityScore += 1;
    if (hasDamage) complexityScore += 1;
    if (hasConditions) complexityScore += 3;
    if (hasScaling) complexityScore += 1;
    if (level > 5) complexityScore += 1;
    
    // Identify enhancement opportunities
    const enhancementOpportunities: string[] = [];
    const suggestedActivities: ActivitySuggestion[] = [];
    
    if (hasAttack) {
      enhancementOpportunities.push('Attack Roll Automation');
      suggestedActivities.push({
        type: 'attack',
        name: `${name} Attack`,
        description: 'Automated spell attack roll with damage calculation',
        automationPotential: 'high'
      });
    }
    
    if (hasSave) {
      enhancementOpportunities.push('Saving Throw Automation');
      suggestedActivities.push({
        type: 'save',
        name: `${name} Save`,
        description: 'Automated saving throw with effect application',
        automationPotential: 'high'
      });
    }
    
    if (hasHealing) {
      enhancementOpportunities.push('Healing Automation');
      suggestedActivities.push({
        type: 'heal',
        name: `${name} Healing`,
        description: 'Automated healing roll and HP restoration',
        automationPotential: 'high'
      });
    }
    
    if (hasDamage) {
      enhancementOpportunities.push('Damage Calculation');
      suggestedActivities.push({
        type: 'damage',
        name: `${name} Damage`,
        description: 'Automated damage roll with type and scaling',
        automationPotential: 'medium'
      });
    }
    
    if (hasConditions) {
      enhancementOpportunities.push('Condition Application');
      suggestedActivities.push({
        type: 'enchant',
        name: `${name} Effects`,
        description: 'Automated condition/status effect application',
        automationPotential: 'medium'
      });
    }
    
    if (hasScaling) {
      enhancementOpportunities.push('Scaling Automation');
    }
    
    // Default utility activity for simple spells
    if (suggestedActivities.length === 0) {
      suggestedActivities.push({
        type: 'utility',
        name: name,
        description: 'Basic spell activation with description',
        automationPotential: 'low'
      });
    }
    
    return {
      name,
      level,
      school,
      hasAttack,
      hasSave,
      hasHealing,
      hasDamage,
      hasConditions,
      hasScaling,
      complexityScore,
      enhancementOpportunities,
      suggestedActivities
    };
  }
  
  static generateReport(analyses: SpellAnalysis[]): {
    summary: any;
    topOpportunities: string[];
    complexityDistribution: any;
    schoolAnalysis: any;
    automationPotential: any;
  } {
    const total = analyses.length;
    
    // Summary statistics
    const summary = {
      totalSpells: total,
      withAttacks: analyses.filter(a => a.hasAttack).length,
      withSaves: analyses.filter(a => a.hasSave).length,
      withHealing: analyses.filter(a => a.hasHealing).length,
      withDamage: analyses.filter(a => a.hasDamage).length,
      withConditions: analyses.filter(a => a.hasConditions).length,
      withScaling: analyses.filter(a => a.hasScaling).length,
      averageComplexity: analyses.reduce((sum, a) => sum + a.complexityScore, 0) / total
    };
    
    // Top enhancement opportunities
    const opportunityCount: { [key: string]: number } = {};
    analyses.forEach(a => {
      a.enhancementOpportunities.forEach(opp => {
        opportunityCount[opp] = (opportunityCount[opp] || 0) + 1;
      });
    });
    
    const topOpportunities = Object.entries(opportunityCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([opp, count]) => `${opp}: ${count} spells (${((count/total)*100).toFixed(1)}%)`);
    
    // Complexity distribution
    const complexityDistribution = {
      simple: analyses.filter(a => a.complexityScore <= 2).length,
      moderate: analyses.filter(a => a.complexityScore > 2 && a.complexityScore <= 5).length,
      complex: analyses.filter(a => a.complexityScore > 5).length
    };
    
    // School analysis
    const schoolStats: { [key: string]: any } = {};
    analyses.forEach(a => {
      if (!schoolStats[a.school]) {
        schoolStats[a.school] = { count: 0, avgComplexity: 0, totalComplexity: 0 };
      }
      schoolStats[a.school].count++;
      schoolStats[a.school].totalComplexity += a.complexityScore;
    });
    
    Object.keys(schoolStats).forEach(school => {
      schoolStats[school].avgComplexity = schoolStats[school].totalComplexity / schoolStats[school].count;
    });
    
    // Automation potential
    const automationPotential = {
      high: analyses.filter(a => a.suggestedActivities.some(act => act.automationPotential === 'high')).length,
      medium: analyses.filter(a => a.suggestedActivities.some(act => act.automationPotential === 'medium')).length,
      low: analyses.filter(a => a.suggestedActivities.every(act => act.automationPotential === 'low')).length
    };
    
    return {
      summary,
      topOpportunities,
      complexityDistribution,
      schoolAnalysis: schoolStats,
      automationPotential
    };
  }
}

async function runAnalysis(): Promise<void> {
  console.log('🔍 D&D Beyond Spell Enhancement Analysis\n');
  
  try {
    // Load spell data
    const spellDataPath = join(__dirname, '../zzzOutputzzz/imported_spells.json');
    console.log(`📂 Loading spells from: ${spellDataPath}`);
    
    const spellData = JSON.parse(readFileSync(spellDataPath, 'utf-8'));
    console.log(`✅ Loaded ${spellData.length} spells for analysis\n`);
    
    // Analyze all spells
    console.log('🔄 Analyzing spells for enhancement opportunities...\n');
    
    const analyses: SpellAnalysis[] = [];
    const sampleResults: SpellAnalysis[] = [];
    
    for (const [index, spell] of spellData.entries()) {
      if (index % 100 === 0) {
        console.log(`Progress: ${index}/${spellData.length} (${((index/spellData.length)*100).toFixed(1)}%)`);
      }
      
      try {
        const analysis = SpellEnhancementAnalyzer.analyzeSpell(spell);
        analyses.push(analysis);
        
        // Keep first 10 for sample output
        if (sampleResults.length < 10) {
          sampleResults.push(analysis);
        }
        
      } catch (error) {
        console.log(`  ⚠️  Error analyzing ${spell.definition?.name}: ${(error as Error).message}`);
      }
    }
    
    console.log(`✅ Analysis complete: ${analyses.length} spells analyzed\n`);
    
    // Generate comprehensive report
    const report = SpellEnhancementAnalyzer.generateReport(analyses);
    
    // Display results
    console.log('='.repeat(70));
    console.log('📊 SPELL ENHANCEMENT ANALYSIS RESULTS');
    console.log('='.repeat(70));
    
    console.log(`\n📈 SUMMARY STATISTICS:`);
    console.log(`  Total Spells Analyzed: ${report.summary.totalSpells}`);
    console.log(`  Spells with Attacks: ${report.summary.withAttacks} (${((report.summary.withAttacks/report.summary.totalSpells)*100).toFixed(1)}%)`);
    console.log(`  Spells with Saves: ${report.summary.withSaves} (${((report.summary.withSaves/report.summary.totalSpells)*100).toFixed(1)}%)`);
    console.log(`  Spells with Healing: ${report.summary.withHealing} (${((report.summary.withHealing/report.summary.totalSpells)*100).toFixed(1)}%)`);
    console.log(`  Spells with Damage: ${report.summary.withDamage} (${((report.summary.withDamage/report.summary.totalSpells)*100).toFixed(1)}%)`);
    console.log(`  Spells with Conditions: ${report.summary.withConditions} (${((report.summary.withConditions/report.summary.totalSpells)*100).toFixed(1)}%)`);
    console.log(`  Spells with Scaling: ${report.summary.withScaling} (${((report.summary.withScaling/report.summary.totalSpells)*100).toFixed(1)}%)`);
    console.log(`  Average Complexity Score: ${report.summary.averageComplexity.toFixed(2)}`);
    
    console.log(`\n🎯 TOP ENHANCEMENT OPPORTUNITIES:`);
    report.topOpportunities.forEach((opp, index) => {
      console.log(`  ${index + 1}. ${opp}`);
    });
    
    console.log(`\n📊 COMPLEXITY DISTRIBUTION:`);
    console.log(`  Simple (≤2): ${report.complexityDistribution.simple} spells (${((report.complexityDistribution.simple/report.summary.totalSpells)*100).toFixed(1)}%)`);
    console.log(`  Moderate (3-5): ${report.complexityDistribution.moderate} spells (${((report.complexityDistribution.moderate/report.summary.totalSpells)*100).toFixed(1)}%)`);
    console.log(`  Complex (>5): ${report.complexityDistribution.complex} spells (${((report.complexityDistribution.complex/report.summary.totalSpells)*100).toFixed(1)}%)`);
    
    console.log(`\n🎨 SCHOOL ANALYSIS (Top 5):`);
    const topSchools = Object.entries(report.schoolAnalysis)
      .sort(([,a], [,b]) => (b as any).count - (a as any).count)
      .slice(0, 5);
    
    topSchools.forEach(([school, stats]) => {
      const s = stats as any;
      console.log(`  ${school}: ${s.count} spells, avg complexity ${s.avgComplexity.toFixed(2)}`);
    });
    
    console.log(`\n🚀 AUTOMATION POTENTIAL:`);
    console.log(`  High: ${report.automationPotential.high} spells (${((report.automationPotential.high/report.summary.totalSpells)*100).toFixed(1)}%)`);
    console.log(`  Medium: ${report.automationPotential.medium} spells (${((report.automationPotential.medium/report.summary.totalSpells)*100).toFixed(1)}%)`);
    console.log(`  Low: ${report.automationPotential.low} spells (${((report.automationPotential.low/report.summary.totalSpells)*100).toFixed(1)}%)`);
    
    console.log(`\n📝 SAMPLE ENHANCED SPELLS:`);
    sampleResults.slice(0, 5).forEach((spell, index) => {
      console.log(`\n  ${index + 1}. ${spell.name} (Level ${spell.level}, ${spell.school})`);
      console.log(`     Complexity Score: ${spell.complexityScore}`);
      console.log(`     Activities: ${spell.suggestedActivities.map(a => a.type).join(', ')}`);
      console.log(`     Opportunities: ${spell.enhancementOpportunities.slice(0, 3).join(', ')}`);
    });
    
    // Save detailed results
    const outputData = {
      timestamp: new Date().toISOString(),
      report,
      sampleAnalyses: sampleResults,
      fullAnalyses: analyses
    };
    
    const outputPath = join(__dirname, '../zzzOutputzzz/spell_enhancement_analysis.json');
    writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`\n💾 Detailed analysis saved to: ${outputPath}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('🎯 CONCLUSION:');
    console.log('   D&D Beyond spell data contains rich automation opportunities!');
    console.log(`   ${report.automationPotential.high + report.automationPotential.medium} spells (${(((report.automationPotential.high + report.automationPotential.medium)/report.summary.totalSpells)*100).toFixed(1)}%) have medium-high automation potential`);
    console.log('   Enhanced SpellParser with Activity System would significantly improve automation.');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('❌ Analysis failed:', (error as Error).message);
  }
}

// Run analysis if called directly
if (require.main === module) {
  runAnalysis().catch(console.error);
}

export { runAnalysis };
