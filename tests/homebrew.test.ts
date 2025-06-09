import { describe, it, expect, beforeAll } from 'vitest';

// Feature: Homebrew Content
// Covers: Homebrew item and spell import
// NOTE: All tests must use real Beyond Foundry importers and real D&D Beyond data.

const COBALT_TOKEN = process.env.DDB_COBALT_TOKEN;
const CHARACTER_ID = process.env.DDB_CHARACTER_ID || '147239148';
const api = globalThis.game?.modules?.get('beyond-foundry')?.api;

describe('Homebrew Import (Real Data)', () => {
  beforeAll(() => {
    if (!COBALT_TOKEN) throw new Error('DDB_COBALT_TOKEN not set');
    if (!api) throw new Error('Beyond Foundry API not available in test environment');
  });

  it('imports homebrew items for character', async () => {
    const character = await api.getCharacter(CHARACTER_ID);
    const homebrewItems = (character.inventory || []).filter(i => i.isHomebrew);
    for (const item of homebrewItems) {
      const imported = await api.importItem(item.id);
      expect(imported).toBeDefined();
      expect(imported.system.isHomebrew).toBe(true);
    }
  });

  it('imports homebrew spells for character', async () => {
    const character = await api.getCharacter(CHARACTER_ID);
    const homebrewSpells = (character.spells || []).filter(s => s.isHomebrew);
    for (const spell of homebrewSpells) {
      const imported = await api.importSpell(spell.id);
      expect(imported).toBeDefined();
      expect(imported.system.isHomebrew).toBe(true);
    }
  });
});
