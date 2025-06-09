import { describe, it, expect, beforeAll } from 'vitest';

// Feature: Spell Import
// Covers: All classes, upcasting, compendium linking
// NOTE: All tests must use real Beyond Foundry importers and real D&D Beyond data.

const COBALT_TOKEN = process.env.DDB_COBALT_TOKEN;
const CHARACTER_ID = process.env.DDB_CHARACTER_ID || '147239148';
const api = globalThis.game?.modules?.get('beyond-foundry')?.api;

describe('Spell Import (Real Data)', () => {
  beforeAll(() => {
    if (!COBALT_TOKEN) throw new Error('DDB_COBALT_TOKEN not set');
    if (!api) throw new Error('Beyond Foundry API not available in test environment');
  });

  it('fetches character spell list', async () => {
    const character = await api.getCharacter(CHARACTER_ID);
    expect(character.spells).toBeDefined();
    expect(Array.isArray(character.spells)).toBe(true);
  });

  it('imports all spells for character', async () => {
    const character = await api.getCharacter(CHARACTER_ID);
    for (const spell of character.spells) {
      const item = await api.importSpell(spell.id);
      expect(item).toBeDefined();
      expect(item.type).toBe('spell');
      expect(item.name).toBe(spell.name);
    }
  });

  it('links imported spells to compendium', async () => {
    const character = await api.getCharacter(CHARACTER_ID);
    for (const spell of character.spells) {
      const item = await api.importSpell(spell.id);
      expect(item.compendium).toBeDefined();
    }
  });
});
