// Fetch all races/species from D&D Beyond
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const PROXY_ENDPOINT = process.env.DDB_PROXY_URL || 'http://localhost:4000';
const OUTDIR = path.join(__dirname, '../comprehensive-parser-results');
const COOKIENAME = 'COBALT_TOKEN';

async function fetchRaces(token) {
  const url = PROXY_ENDPOINT + '/proxy/races';
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cobalt: token }),
  };
  
  try {
    console.log('🔄 Fetching all races/species...');
    const res = await fetch(url, options);
    
    if (!res.ok) {
      console.error(`❌ HTTP ${res.status} for races`);
      return null;
    }
    
    const data = await res.json();
    
    if (!fs.existsSync(OUTDIR)) {
      fs.mkdirSync(OUTDIR, { recursive: true });
    }
    
    const outFile = path.join(OUTDIR, 'races.json');
    fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
    console.log(`✅ Saved races to ${outFile}`);
    return data;
  } catch (err) {
    console.error('❌ Failed to fetch races:', err.message);
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
  
  await fetchRaces(token);
}

if (require.main === module) {
  main().catch(console.error);
}
