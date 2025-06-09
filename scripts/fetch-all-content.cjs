// Live DDB Beyond content puller for Beyond Foundry
// Fetches character, all classes, backgrounds, races, feats, spells from ddb-proxy
// Saves each as a JSON in comprehensive-parser-results/

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const PROXY_ENDPOINT = process.env.DDB_PROXY_URL || 'http://localhost:4000';
const OUTDIR = path.join(__dirname, '../comprehensive-parser-results');

const COOKIENAME = 'COBALT_TOKEN';

// Specific character ID and endpoints for bulk data
const endpoints = {
  character: { url: '/proxy/character', method: 'POST', body: (token, id) => ({ cobalt: token, characterId: parseInt(id) }) },
  backgrounds: { url: '/proxy/backgrounds', method: 'POST', body: (token) => ({ cobalt: token }) },
  races: { url: '/proxy/races', method: 'POST', body: (token) => ({ cobalt: token }) },
  feats: { url: '/proxy/feats', method: 'POST', body: (token) => ({ cobalt: token }) },
  spells: { url: '/proxy/spells', method: 'POST', body: (token) => ({ cobalt: token }) },
};

async function fetchAndSave(type, token, id = null) {
  const endpoint = endpoints[type];
  if (!endpoint) throw new Error(`No endpoint for type: ${type}`);
  
  const url = PROXY_ENDPOINT + endpoint.url;
  const options = {
    method: endpoint.method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(endpoint.body(token, id)),
  };
  
  try {
    console.log(`🔄 Fetching ${type}${id ? ` (${id})` : ''}...`);
    const res = await fetch(url, options);
    
    if (!res.ok) {
      console.error(`❌ HTTP ${res.status} for ${type}${id ? ` (${id})` : ''}`);
      return null;
    }
    
    let text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (jsonErr) {
      console.error(`❌ Failed to parse JSON for ${type}${id ? ` (${id})` : ''}: status=${res.status} content-type=${res.headers.get('content-type')}`);
      console.error('Raw response:', text.slice(0, 500)); // Print first 500 chars
      return null;
    }
    
    const outFile = path.join(OUTDIR, `${type}${id ? `-${id}` : ''}.json`);
    fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
    console.log(`✅ Saved ${type}${id ? ` (${id})` : ''} to ${outFile}`);
    return data;
  } catch (err) {
    console.error(`❌ Failed to fetch ${type}${id ? ` (${id})` : ''}:`, err.message);
    return null;
  }
}

async function main() {
  // Get arguments
  const args = process.argv.slice(2);
  const characterId = args.find(arg => arg.match(/^\d+$/)) || '141773707'; // Default to requested character
  
  if (!fs.existsSync(OUTDIR)) {
    fs.mkdirSync(OUTDIR, { recursive: true });
  }
  
  const token = process.env[COOKIENAME] || args.find(arg => !arg.match(/^\d+$/));
  if (!token) {
    console.error('Please provide your D&D Beyond Cobalt token as an env var (COBALT_TOKEN) or as an argument.');
    process.exit(1);
  }
  
  console.log('🚀 Starting D&D Beyond content fetch...');
  console.log(`📁 Output directory: ${OUTDIR}`);
  console.log(`🎯 Character ID: ${characterId}`);
  
  // Fetch the specific character
  await fetchAndSave('character', token, characterId);
  
  // Fetch all bulk content
  console.log('\n📚 Fetching bulk content...');
  await fetchAndSave('backgrounds', token);
  await fetchAndSave('races', token);
  await fetchAndSave('feats', token);
  await fetchAndSave('spells', token);
  
  console.log('\n🎉 Content fetch complete!');
}

if (require.main === module) {
  main().catch(console.error);
}
