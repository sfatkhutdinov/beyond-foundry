// Enhanced spell fetcher using character class information to get real spell data
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const PROXY_ENDPOINT = process.env.DDB_PROXY_URL || 'http://localhost:4000';
const OUTDIR = path.join(__dirname, '../comprehensive-parser-results');
const COOKIENAME = 'COBALT_TOKEN';

// Real character class info from the successfully imported Cleric character 141773707
const CHARACTER_CLASSES = {
  cleric: {
    id: 3, // Cleric class ID from D&D Beyond
    name: "Cleric",
    level: 20,
    spellLevelAccess: 9, // Clerics get up to 9th level spells
    campaignId: null
  },
  wizard: {
    id: 12, // Wizard class ID
    name: "Wizard", 
    level: 20,
    spellLevelAccess: 9,
    campaignId: null
  },
  sorcerer: {
    id: 10, // Sorcerer class ID
    name: "Sorcerer",
    level: 20, 
    spellLevelAccess: 9,
    campaignId: null
  },
  druid: {
    id: 4, // Druid class ID
    name: "Druid",
    level: 20,
    spellLevelAccess: 9,
    campaignId: null
  }
};

/**
 * Fetch spells using class-specific endpoint with proper authentication
 */
async function fetchSpellsForClass(token, className) {
  const classInfo = CHARACTER_CLASSES[className.toLowerCase()];
  if (!classInfo) {
    console.error(`❌ Unknown class: ${className}`);
    return null;
  }

  const url = PROXY_ENDPOINT + '/proxy/class/spells';
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
    console.log(`🔄 Fetching spells for ${classInfo.name} class (Level ${classInfo.level}, Spell Access ${classInfo.spellLevelAccess})...`);
    const res = await fetch(url, options);
    
    if (!res.ok) {
      console.error(`❌ HTTP ${res.status} for ${classInfo.name} spells`);
      return null;
    }
    
    const data = await res.json();
    console.log(`✅ Got ${JSON.stringify(data).length} characters of data for ${classInfo.name}`);
    return { className: classInfo.name, data };
  } catch (err) {
    console.error(`❌ Failed to fetch ${classInfo.name} spells:`, err.message);
    return null;
  }
}

/**
 * Try the general spells endpoint with enhanced authentication  
 */
async function fetchAllSpells(token) {
  const url = PROXY_ENDPOINT + '/proxy/spells';
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cobalt: token }),
  };
  
  try {
    console.log('🔄 Fetching all spells from general endpoint...');
    const res = await fetch(url, options);
    
    if (!res.ok) {
      console.error(`❌ HTTP ${res.status} for general spells`);
      return null;
    }
    
    const data = await res.json();
    console.log(`✅ General spells endpoint returned ${JSON.stringify(data).length} characters of data`);
    return data;
  } catch (err) {
    console.error('❌ Failed to fetch general spells:', err.message);
    return null;
  }
}

/**
 * Extract character class info from imported character and use it for spell fetching
 */
async function fetchCharacterSpells(token, characterId) {
  const url = PROXY_ENDPOINT + '/proxy/character';
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      cobalt: token,
      characterId: parseInt(characterId)
    }),
  };
  
  try {
    console.log(`🔄 Getting character ${characterId} class info for spell fetching...`);
    const res = await fetch(url, options);
    
    if (!res.ok) {
      console.error(`❌ HTTP ${res.status} for character ${characterId}`);
      return null;
    }
    
    const characterData = await res.json();
    
    if (!characterData.success || !characterData.ddb || !characterData.ddb.character) {
      console.error('❌ Invalid character data received');
      return null;
    }

    const character = characterData.ddb.character;
    console.log(`✅ Character: ${character.name} (${character.race.fullName} ${character.classes.map(c => c.definition.name).join('/')})`);
    
    // Extract spell data from character
    const spells = character.spells || {};
    const allSpells = [];
    
    // Collect spells from all sources
    Object.entries(spells).forEach(([source, spellList]) => {
      if (Array.isArray(spellList) && spellList.length > 0) {
        console.log(`   📜 ${source}: ${spellList.length} spells`);
        allSpells.push(...spellList);
      }
    });
    
    return {
      character: {
        id: character.id,
        name: character.name,
        classes: character.classes.map(c => ({
          name: c.definition.name,
          level: c.level,
          id: c.definition.id
        }))
      },
      spells: allSpells,
      totalSpells: allSpells.length
    };
    
  } catch (err) {
    console.error(`❌ Failed to fetch character ${characterId}:`, err.message);
    return null;
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

  console.log('🎯 Enhanced Spell Import - Testing Multiple Approaches\n');

  // Method 1: Use character data to get spells directly
  console.log('📋 Method 1: Extract spells from known character (141773707)');
  const characterSpells = await fetchCharacterSpells(token, '141773707');
  if (characterSpells && characterSpells.spells.length > 0) {
    const outFile = path.join(OUTDIR, 'character-spells.json');
    fs.writeFileSync(outFile, JSON.stringify(characterSpells, null, 2));
    console.log(`✅ Saved ${characterSpells.totalSpells} character spells to ${outFile}`);
  }

  // Method 2: Try class-specific endpoints
  console.log('\n📋 Method 2: Class-specific spell fetching');
  const classResults = {};
  for (const className of ['cleric', 'wizard', 'druid']) {
    const result = await fetchSpellsForClass(token, className);
    if (result) {
      classResults[className] = result;
    }
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (Object.keys(classResults).length > 0) {
    const outFile = path.join(OUTDIR, 'class-spells.json');
    fs.writeFileSync(outFile, JSON.stringify(classResults, null, 2));
    console.log(`✅ Saved class spell data to ${outFile}`);
  }

  // Method 3: General spells endpoint  
  console.log('\n📋 Method 3: General spells endpoint');
  const generalSpells = await fetchAllSpells(token);
  if (generalSpells && generalSpells.data && generalSpells.data.length > 0) {
    const outFile = path.join(OUTDIR, 'general-spells.json');
    fs.writeFileSync(outFile, JSON.stringify(generalSpells, null, 2));
    console.log(`✅ Saved ${generalSpells.data.length} general spells to ${outFile}`);
  }

  console.log('\n🎉 Enhanced spell import complete!');
  console.log('Check the comprehensive-parser-results directory for the spell data files.');
}

main().catch(err => {
  console.error('💥 Script failed:', err);
  process.exit(1);
});
