// Live DDB Beyond content puller for Beyond Foundry (CommonJS)
// Fetches character, class, background, race, feat, spell, equipment, magic item, and monster from ddb-proxy
// Saves each as a JSON in comprehensive-parser-results/

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const PROXY_ENDPOINT = process.env.DDB_PROXY_URL || 'http://localhost:4000';
const OUTDIR = path.join(__dirname, '../comprehensive-parser-results');

const COOKIENAME = 'COBALT_TOKEN';

const ids = {
  // character: '99591617',
  class: '2190877',
  // For bulk pulls, we don't need a single id for backgrounds, races, feats, spells
  // background: '406476',
  // race: '1751434',
  // feat: '1789100',
  // spell: '2618844',
  // equipment: '512',
  // magicitem: '5370',
  // monster: '5194866',
};

const endpoints = {
  character: { url: '/proxy/character', method: 'POST', body: (token, id) => ({ cobalt: token, characterId: parseInt(id) }) },
  class: { url: '/proxy/class', method: 'POST', body: (token, id) => ({ cobalt: token, classSlug: id }) },
  backgrounds: { url: '/proxy/backgrounds', method: 'POST', body: (token) => ({ cobalt: token }) },
  races: { url: '/proxy/races', method: 'POST', body: (token) => ({ cobalt: token }) },
  feats: { url: '/proxy/feats', method: 'POST', body: (token) => ({ cobalt: token }) },
  spells: { url: '/proxy/spells', method: 'POST', body: (token) => ({ cobalt: token }) },
  equipment: { url: '/proxy/items', method: 'POST', body: (token, id) => ({ cobalt: token, itemId: parseInt(id) }) },
  magicitem: { url: '/proxy/items', method: 'POST', body: (token, id) => ({ cobalt: token, itemId: parseInt(id) }) },
  monster: { url: '/proxy/monster', method: 'POST', body: (token, id) => ({ cobalt: token, monsterId: parseInt(id) }) },
};

async function fetchAndSave(type, token, id) {
  const endpoint = endpoints[type];
  if (!endpoint) throw new Error(`No endpoint for type: ${type}`);
  const url = PROXY_ENDPOINT + endpoint.url;
  const options = {
    method: endpoint.method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(endpoint.body(token, id)),
  };
  try {
    const res = await fetch(url, options);
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
  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR);
  const token = process.env[COOKIENAME] || process.argv[2];
  if (!token) {
    console.error('Please provide your D&D Beyond Cobalt token as an env var (COBALT_TOKEN) or first argument.');
    process.exit(1);
  }
  // Only fetch class by id (slug), all others as bulk
  await fetchAndSave('class', token, ids.class);
  await fetchAndSave('backgrounds', token);
  await fetchAndSave('races', token);
  await fetchAndSave('feats', token);
  await fetchAndSave('spells', token);
  // Optionally, fetch equipment, magicitem, monster by id if needed
}

if (require.main === module) {
  main();
}
