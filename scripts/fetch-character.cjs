// Fetch specific character from D&D Beyond
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const PROXY_ENDPOINT = process.env.DDB_PROXY_URL || 'http://localhost:4000';
const OUTDIR = path.join(__dirname, '../comprehensive-parser-results');
const COOKIENAME = 'COBALT_TOKEN';

async function fetchCharacter(token, characterId) {
  const url = PROXY_ENDPOINT + '/proxy/character';
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cobalt: token, characterId: parseInt(characterId) }),
  };
  
  try {
    console.log(`🔄 Fetching character ${characterId}...`);
    const res = await fetch(url, options);
    
    if (!res.ok) {
      console.error(`❌ HTTP ${res.status} for character ${characterId}`);
      return null;
    }
    
    const data = await res.json();
    
    if (!fs.existsSync(OUTDIR)) {
      fs.mkdirSync(OUTDIR, { recursive: true });
    }
    
    const outFile = path.join(OUTDIR, `character-${characterId}.json`);
    fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
    console.log(`✅ Saved character ${characterId} to ${outFile}`);
    return data;
  } catch (err) {
    console.error(`❌ Failed to fetch character ${characterId}:`, err.message);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const characterId = args.find(arg => arg.match(/^\d+$/)) || '141773707';
  const token = process.env[COOKIENAME] || args.find(arg => !arg.match(/^\d+$/));
  
  if (!token) {
    console.error('Please provide your D&D Beyond Cobalt token as an env var (COBALT_TOKEN) or as an argument.');
    process.exit(1);
  }
  
  await fetchCharacter(token, characterId);
}

if (require.main === module) {
  main().catch(console.error);
}
