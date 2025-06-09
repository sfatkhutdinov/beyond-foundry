// Fetch all backgrounds from D&D Beyond
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const PROXY_ENDPOINT = process.env.DDB_PROXY_URL || 'http://localhost:4000';
const OUTDIR = path.join(__dirname, '../comprehensive-parser-results');
const COOKIENAME = 'COBALT_TOKEN';

async function fetchBackgrounds(token) {
  const url = PROXY_ENDPOINT + '/proxy/backgrounds';
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cobalt: token }),
  };
  
  try {
    console.log('🔄 Fetching all backgrounds...');
    const res = await fetch(url, options);
    
    if (!res.ok) {
      console.error(`❌ HTTP ${res.status} for backgrounds`);
      return null;
    }
    
    const data = await res.json();
    
    if (!fs.existsSync(OUTDIR)) {
      fs.mkdirSync(OUTDIR, { recursive: true });
    }
    
    const outFile = path.join(OUTDIR, 'backgrounds.json');
    fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
    console.log(`✅ Saved backgrounds to ${outFile}`);
    return data;
  } catch (err) {
    console.error('❌ Failed to fetch backgrounds:', err.message);
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
  
  await fetchBackgrounds(token);
}

if (require.main === module) {
  main().catch(console.error);
}
