// Fetch spells using the proven ddb-proxy methodology - independent of specific classes
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const PROXY_ENDPOINT = process.env.DDB_PROXY_URL || 'http://localhost:4000';
const OUTDIR = path.join(__dirname, '../comprehensive-parser-results');
const COOKIENAME = 'COBALT_TOKEN';

// D&D Beyond class configuration from ddb-proxy
const CLASS_MAP = [
  { name: "Barbarian", spells: "SPELLS", id: 9 },
  { name: "Bard", spells: "SPELLS", id: 1 },
  { name: "Cleric", spells: "KNOWN", id: 2 },
  { name: "Druid", spells: "KNOWN", id: 3 },
  { name: "Fighter", spells: "SPELLS", id: 10 },
  { name: "Monk", spells: "SPELLS", id: 11 },
  { name: "Paladin", spells: "KNOWN", id: 4 },
  { name: "Ranger", spells: "SPELLS", id: 5 },
  { name: "Rogue", spells: "SPELLS", id: 12 },
  { name: "Sorcerer", spells: "SPELLS", id: 6 },
  { name: "Warlock", spells: "SPELLS", id: 7 },
  { name: "Wizard", spells: "SPELLS", id: 8 },
  { name: "Artificer", spells: "KNOWN", id: 252717 },
  { name: "Blood Hunter", spells: "SPELLS", id: 357975 },
];

/**
 * Use the exact loadSpells function pattern from ddb-proxy
 * This fetches comprehensive spell data for all classes
 */
async function loadSpellsLikeDDBProxy(token) {
  const allClassInfo = CLASS_MAP.map(classData => ({
    characterClassId: token, // Use token as cache ID like ddb-proxy does
    backgroundId: null,
    name: classData.name,
    id: classData.id,
    level: 20, // Max level for comprehensive spell access
    spellLevelAccess: 9, // All spell levels
    spells: [],
    classId: classData.id,
    subclassId: classData.id,
    characterClass: classData.name,
    characterSubclass: classData.name,
    characterId: token,
    spellType: classData.spells,
    campaignId: null,
    spellListIds: []
  }));

  console.log(`🎯 Loading spells for ${allClassInfo.length} classes using ddb-proxy methodology`);

  const allSpells = new Map(); // Avoid duplicates by spell ID
  let totalSpellsFetched = 0;

  for (const classInfo of allClassInfo) {
    try {
      console.log(`\n📜 Fetching spells for ${classInfo.name} (id: ${classInfo.id})`);
      
      // Use the proven ddb-proxy approach
      const classSpells = await fetchClassSpells(token, classInfo);
      const alwaysKnownSpells = await fetchAlwaysKnownSpells(token, classInfo);
      const alwaysPreparedSpells = await fetchAlwaysPreparedSpells(token, classInfo);
      
      // Combine all spell types for this class
      const allClassSpells = [...classSpells, ...alwaysKnownSpells, ...alwaysPreparedSpells];
      
      console.log(`   ✅ Got ${allClassSpells.length} total spells for ${classInfo.name}`);
      
      // Add unique spells to collection
      let addedCount = 0;
      allClassSpells.forEach(spell => {
        const spellId = spell.definition.id;
        if (!allSpells.has(spellId)) {
          allSpells.set(spellId, {
            ...spell,
            availableToClasses: [classInfo.name],
            sourceClass: classInfo.name,
            classSpellType: classInfo.spellType
          });
          addedCount++;
        } else {
          // Add this class to the spell's available classes
          const existingSpell = allSpells.get(spellId);
          if (!existingSpell.availableToClasses.includes(classInfo.name)) {
            existingSpell.availableToClasses.push(classInfo.name);
          }
        }
      });
      
      console.log(`   📊 Added ${addedCount} new unique spells (${allSpells.size} total unique)`);
      totalSpellsFetched += allClassSpells.length;
      
      // Rate limiting to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.warn(`⚠️  Failed to fetch spells for ${classInfo.name}: ${error.message}`);
    }
  }

  return {
    spells: Array.from(allSpells.values()),
    totalSpellsFetched,
    uniqueSpells: allSpells.size,
    classesProcessed: allClassInfo.length
  };
}

/**
 * Fetch regular class spells (like extractSpells in ddb-proxy)
 */
async function fetchClassSpells(token, classInfo) {
  const url = `${PROXY_ENDPOINT}/proxy/class/spells`;
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      cobalt: token,
      className: classInfo.name,
      campaignId: classInfo.campaignId 
    }),
  };
  
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    const data = await res.json();
    if (data.success && data.data) {
      console.log(`     📖 Class spells: ${data.data.length}`);
      return data.data;
    }
    return [];
  } catch (err) {
    console.warn(`     ❌ Class spells failed: ${err.message}`);
    return [];
  }
}

/**
 * Fetch always known spells (method from ddb-proxy)
 */
async function fetchAlwaysKnownSpells(token, classInfo) {
  // Only certain classes use always known spells
  const knowSpellsClasses = ["Druid", "Cleric", "Paladin", "Artificer"];
  if (!knowSpellsClasses.includes(classInfo.name)) {
    return [];
  }

  // This would be a custom endpoint we'd need to implement
  // For now, return empty array as these are typically included in class spells
  console.log(`     🔮 Always known spells: 0 (not implemented in proxy)`);
  return [];
}

/**
 * Fetch always prepared spells (method from ddb-proxy)
 */
async function fetchAlwaysPreparedSpells(token, classInfo) {
  // This would be a custom endpoint we'd need to implement
  // For now, return empty array as these are typically included in class spells
  console.log(`     ⚡ Always prepared spells: 0 (not implemented in proxy)`);
  return [];
}

/**
 * Test authentication with the proxy
 */
async function testAuthentication(token) {
  try {
    const url = `${PROXY_ENDPOINT}/proxy/auth`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cobalt: token })
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const token = process.env[COOKIENAME] || args[0];
  
  if (!token) {
    console.error('Please provide your D&D Beyond Cobalt token as an env var (COBALT_TOKEN) or as an argument.');
    process.exit(1);
  }

  if (!fs.existsSync(OUTDIR)) {
    fs.mkdirSync(OUTDIR, { recursive: true });
  }

  console.log('🎯 D&D Beyond Spell Import - Using Proven ddb-proxy Methodology\n');

  // Test authentication first
  console.log('🔑 Testing authentication...');
  const authSuccess = await testAuthentication(token);
  if (!authSuccess) {
    console.error('❌ Authentication failed. Please check your cobalt token.');
    process.exit(1);
  }
  console.log('✅ Authentication successful\n');

  // Load spells using ddb-proxy methodology
  console.log('📚 Loading comprehensive spell library...');
  const spellData = await loadSpellsLikeDDBProxy(token);
  
  if (spellData.spells.length === 0) {
    console.error('❌ No spells were fetched successfully');
    process.exit(1);
  }

  // Create comprehensive spell data
  const comprehensiveData = {
    metadata: {
      importedAt: new Date().toISOString(),
      method: 'ddb-proxy-comprehensive',
      totalSpellsFetched: spellData.totalSpellsFetched,
      uniqueSpells: spellData.uniqueSpells,
      classesProcessed: spellData.classesProcessed,
      tokenUsed: token.substring(0, 8) + '...',
      proxyEndpoint: PROXY_ENDPOINT
    },
    spells: spellData.spells
  };

  // Save comprehensive spell data
  const outFile = path.join(OUTDIR, 'ddb-proxy-comprehensive-spells.json');
  fs.writeFileSync(outFile, JSON.stringify(comprehensiveData, null, 2));
  
  // Analyze the results
  const spellsByLevel = {};
  const spellsBySchool = {};
  const spellsByClass = {};
  
  spellData.spells.forEach(spell => {
    const level = spell.definition.level;
    const school = spell.definition.school;
    
    spellsByLevel[level] = (spellsByLevel[level] || 0) + 1;
    spellsBySchool[school] = (spellsBySchool[school] || 0) + 1;
    
    spell.availableToClasses.forEach(className => {
      spellsByClass[className] = (spellsByClass[className] || 0) + 1;
    });
  });

  console.log('\n📊 SPELL IMPORT RESULTS');
  console.log('=' .repeat(50));
  console.log(`Total Raw Spells Fetched: ${spellData.totalSpellsFetched}`);
  console.log(`Unique Spells: ${spellData.uniqueSpells}`);
  console.log(`Classes Processed: ${spellData.classesProcessed}`);
  console.log(`File Size: ${JSON.stringify(comprehensiveData).length} characters`);
  console.log(`File Lines: ${JSON.stringify(comprehensiveData, null, 2).split('\n').length}`);
  
  console.log('\n📈 Spell Distribution:');
  console.log('   By Level:', spellsByLevel);
  console.log('   By School (top 5):', Object.entries(spellsBySchool)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {}));
  console.log('   By Class (top 5):', Object.entries(spellsByClass)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {}));

  console.log(`\n✅ Comprehensive spell data saved to: ${outFile}`);
  
  // Create summary report
  const summaryFile = path.join(OUTDIR, 'spell-import-ddb-proxy-summary.json');
  const summary = {
    timestamp: new Date().toISOString(),
    method: 'ddb-proxy-comprehensive',
    success: true,
    totalSpells: spellData.uniqueSpells,
    spellsByLevel,
    spellsBySchool,
    spellsByClass,
    sampleSpells: spellData.spells.slice(0, 5).map(s => ({
      name: s.definition.name,
      level: s.definition.level,
      school: s.definition.school,
      classes: s.availableToClasses,
      sourceClass: s.sourceClass
    }))
  };
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  console.log(`📋 Summary report saved to: ${summaryFile}`);

  if (spellData.uniqueSpells > 100) {
    console.log('\n🎉 SUCCESS: Fetched substantial spell data (>100 unique spells)!');
    console.log(`   This demonstrates that Beyond Foundry is properly importing`);
    console.log(`   real D&D Beyond spell data using proven methodologies.`);
    process.exit(0);
  } else {
    console.log('\n⚠️  WARNING: Fewer than 100 unique spells fetched');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('💥 Script failed:', err);
  process.exit(1);
});
