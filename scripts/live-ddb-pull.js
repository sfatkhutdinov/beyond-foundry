// Live DDB Beyond content puller for Beyond Foundry
// Fetches character, class, background, race, feat, spell, equipment, magic item, and monster from ddb-proxy
// Saves each as a JSON in comprehensive-parser-results/

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const PROXY_ENDPOINT = process.env.DDB_PROXY_URL || 'http://localhost:4000';
const OUTDIR = path.join(__dirname, '../comprehensive-parser-results');

const COOKIENAME = 'COBALT_TOKEN';

const ids = {
  character: '99591617',
  class: '2190877',
  background: '406476',
  race: '1751434',
  feat: '1789100',
  spell: '2618844',
  equipment: '512',
  magicitem: '5370',
  monster: '5194866',
};

const endpoints = {
  character: { url: '/proxy/character', method: 'POST', body: (token, id) => ({ cobalt: token, characterId: parseInt(id) }) },
  class: { url: '/proxy/class', method: 'POST', body: (token, id) => ({ cobalt: token, classId: parseInt(id) }) },
  background: { url: '/proxy/background', method: 'POST', body: (token, id) => ({ cobalt: token, backgroundId: parseInt(id) }) },
  race: { url: '/proxy/race', method: 'POST', body: (token, id) => ({ cobalt: token, raceId: parseInt(id) }) },
  feat: { url: '/proxy/feat', method: 'POST', body: (token, id) => ({ cobalt: token, featId: parseInt(id) }) },
  spell: { url: '/proxy/spell', method: 'POST', body: (token, id) => ({ cobalt: token, spellId: parseInt(id) }) },
  equipment: { url: '/proxy/item', method: 'POST', body: (token, id) => ({ cobalt: token, itemId: parseInt(id) }) },
  magicitem: { url: '/proxy/item', method: 'POST', body: (token, id) => ({ cobalt: token, itemId: parseInt(id) }) },
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
    const data = await res.json();
    const outFile = path.join(OUTDIR, `${type}-${id}.json`);
    fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
    console.log(`✅ Saved ${type} (${id}) to ${outFile}`);
    return data;
  } catch (err) {
    console.error(`❌ Failed to fetch ${type} (${id}):`, err.message);
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
  for (const [type, id] of Object.entries(ids)) {
    await fetchAndSave(type, token, id);
  }
}

if (require.main === module) {
  main();
}
