#!/usr/bin/env node

/**
 * Bulk Spell Import Test for Beyond Foundry
 * Fetches all spells via ddb-proxy and checks for Abi-Dalzim's Horrid Wilting (ID 2367)
 * Usage: node scripts/test-bulk-spell-import.js <cobalt-token>
 */

import fetch from 'node-fetch';

const PROXY_URL = 'http://localhost:3100';
const SPELL_NAME = "Abi-Dalzim's Horrid Wilting";
const SPELL_ID = 2367; // DDB spell ID, if available in data

async function fetchAllSpells(token) {
  // This endpoint may vary depending on your proxy setup
  // Try the class spell endpoint for a full caster (e.g., Wizard)
  const response = await fetch(`${PROXY_URL}/proxy/class/spells`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ className: 'Wizard', cobalt: token })
  });
  if (!response.ok) throw new Error(`Failed to fetch spells: ${response.status}`);
  const data = await response.json();
  if (!data.success || !Array.isArray(data.data)) throw new Error('Invalid spell data response');
  return data.data;
}

async function main() {
  const token = process.argv[2];
  if (!token) {
    console.error('❌ Please provide your D&D Beyond cobalt token as a command-line argument.');
    process.exit(1);
  }
  console.log('🔮 Fetching all spells for Wizard class via proxy...');
  try {
    const spells = await fetchAllSpells(token);
    console.log(`✅ Fetched ${spells.length} spells.`);
    // Try to find the spell by name or ID
    const found = spells.find(spell =>
      (spell.definition && (
        spell.definition.name === SPELL_NAME || spell.definition.id === SPELL_ID
      ))
    );
    if (found) {
      console.log(`🎉 Found spell: ${found.definition.name} (ID: ${found.definition.id})`);
      console.log('--- Spell Details ---');
      console.log(JSON.stringify(found.definition, null, 2));
    } else {
      console.log(`❌ Spell '${SPELL_NAME}' (ID: ${SPELL_ID}) not found in fetched data.`);
    }
  } catch (err) {
    console.error('❌ Error during spell import test:', err.message);
    process.exit(1);
  }
}

main();
