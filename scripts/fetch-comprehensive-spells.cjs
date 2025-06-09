/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const PROXY_ENDPOINT = 'http://localhost:4000'; // Use port 4000 as mapped in docker-compose
const COOKIENAME = 'COBALT_TOKEN'; // Environment variable for the Cobalt session token
const OUTDIR = path.join(__dirname, '..', 'comprehensive-parser-results');

/**
 * Fetches spells for multiple classes using the local proxy.
 * The proxy is expected to handle direct D&D Beyond API interaction.
 */
async function fetchSpellsViaProxy(token) {
  console.log('🔄 Switching to proxy for spell fetching...');
  const classesToTest = [
    { id: 3, name: "Cleric", spellLevelAccess: 9 },        // Full caster
    { id: 12, name: "Wizard", spellLevelAccess: 9 },       // Full caster
    { id: 10, name: "Sorcerer", spellLevelAccess: 9 },     // Full caster
    { id: 4, name: "Druid", spellLevelAccess: 9 },         // Full caster
    { id: 2, name: "Bard", spellLevelAccess: 9 },          // Full caster
    { id: 11, name: "Warlock", spellLevelAccess: 9 },      // Pact Magic (up to 5th level spells, but 9th via Mystic Arcanum)
    { id: 7, name: "Paladin", spellLevelAccess: 5 },       // Half caster
    { id: 8, name: "Ranger", spellLevelAccess: 5 },        // Half caster
    { id: 1475302, name: "Artificer", spellLevelAccess: 5 } // Half caster
  ];

  const allSpells = new Map(); // Use Map to avoid duplicates by spell ID

  for (const classInfo of classesToTest) {
    console.log(`\n--- Processing ${classInfo.name} (ID: ${classInfo.id}) via Proxy ---`);
    try {
      const url = `${PROXY_ENDPOINT}/proxy/class/spells`;
      console.log(`🔄 Fetching spells for ${classInfo.name} from proxy: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // User-Agent might be helpful, but proxy should ideally set a good one if needed
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
        },
        body: JSON.stringify({
          cobaltToken: token,
          className: classInfo.name // Proxy's /class/spells endpoint expects className
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.warn(`⚠️  HTTP ${response.status} for ${classInfo.name} spells via proxy. Response: ${errorBody}`);
        if (response.status === 401 || response.status === 403) {
            console.error(`   🚨 Authentication/Authorization error with proxy for ${classInfo.name}. Check Cobalt token and proxy setup. The proxy might have been blocked by D&D Beyond.`);
        }
        continue; // Skip to next class if this one fails
      }

      const spellsData = await response.json();

      // The proxy returns an object like: { success: true, message: "...", data: { spells: [...] } }
      if (spellsData && spellsData.success && spellsData.data && Array.isArray(spellsData.data.spells)) {
        const fetchedClassSpells = spellsData.data.spells;
        console.log(`✅ Got ${fetchedClassSpells.length} spells for ${classInfo.name} via proxy.`);

        fetchedClassSpells.forEach(spell => {
          if (!spell || !spell.definition || typeof spell.definition.id === 'undefined') {
            console.warn('⚠️ Found spell data without definition or ID via proxy:', spell);
            return;
          }
          const spellId = spell.definition.id;
          if (!allSpells.has(spellId)) {
            allSpells.set(spellId, {
              ...spell,
              availableToClasses: [classInfo.name]
            });
          } else {
            const existingSpell = allSpells.get(spellId);
            if (!existingSpell.availableToClasses.includes(classInfo.name)) {
              existingSpell.availableToClasses.push(classInfo.name);
            }
          }
        });
        console.log(`   📊 Processed ${fetchedClassSpells.length} spells. Total unique spells: ${allSpells.size}`);
      } else {
        console.warn(`⚠️  Invalid data format for ${classInfo.name} via proxy. Expected an object with success:true and data.spells array. Got:`, JSON.stringify(spellsData, null, 2));
      }

      // Rate limiting - wait between requests to the proxy
      await new Promise(resolve => setTimeout(resolve, 1200)); // 1.2 second delay

    } catch (error) {
      console.error(`❌ Error fetching spells for ${classInfo.name} via proxy:`, error.message);
      if (error.response) { // This might not exist if fetch itself throws (e.g. network error)
          try {
            const errorBody = await error.response.text();
            console.error('Error response body:', errorBody);
          } catch (e) {
            console.error('Could not parse error response body.')
          }
      } else {
        console.error('No error.response object available.')
      }
    }
  }

  return Array.from(allSpells.values());
}

/**
 * Test proxy authentication
 */
async function testAuthentication(token) {
  if (!token) {
    console.error('❌ Cobalt token is missing. Set COBALT_TOKEN environment variable.');
    return false;
  }
  console.log('🧪 Testing authentication with the proxy...');
  try {
    const response = await fetch(`${PROXY_ENDPOINT}/proxy/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cobaltToken: token }),
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success && (data.message === 'Authenticated.' || data.username)) {
        console.log(`✅ Authentication successful. Proxy message: ${data.message || 'Authenticated by username.'}`);
        return true;
      } else {
        console.warn('⚠️ Authentication test did not confirm successful authentication:', data);
        return false;
      }
    } else {
      const errorBody = await response.text();
      console.error(`❌ Authentication test failed with status ${response.status}. Response: ${errorBody}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error during authentication test:', error.message);
    return false;
  }
}

async function main() {
  const cobaltToken = process.env[COOKIENAME];

  if (!cobaltToken) {
    console.error(`❌ Environment variable ${COOKIENAME} is not set. Please provide your D&D Beyond Cobalt session token.`);
    process.exit(1);
  }

  console.log('🚀 Starting comprehensive spell fetching script...');

  const isAuthenticated = await testAuthentication(cobaltToken);
  if (!isAuthenticated) {
    console.error('🛑 Authentication failed. Exiting script.');
    process.exit(1);
  }

  console.log('\n✨ Fetching spells using the local proxy...');
  const spells = await fetchSpellsViaProxy(cobaltToken); // Use proxy fetching function

  if (spells && spells.length > 0) {
    console.log(`\n🎉 Successfully fetched ${spells.length} unique spells.`);

    if (!fs.existsSync(OUTDIR)) {
      console.log(`📂 Creating output directory: ${OUTDIR}`);
      fs.mkdirSync(OUTDIR, { recursive: true });
    }

    const outputFile = path.join(OUTDIR, 'spells.json');
    console.log(`💾 Saving spells to ${outputFile}...`);
    fs.writeFileSync(outputFile, JSON.stringify(spells, null, 2));
    console.log('✅ Spells saved successfully.');
  } else {
    console.warn('⚠️ No spells were fetched. Output file will not be created.');
  }

  console.log('\n🏁 Script finished.');
}

main().catch(error => {
  console.error('🆘 Unhandled error in main execution:', error);
  process.exit(1);
});
