import { describe, it, expect, beforeAll } from 'vitest';

// Feature: Equipment & Item Import
// Covers: Attunement, containers, homebrew
// NOTE: All tests must use real Beyond Foundry importers and real D&D Beyond data.

const COBALT_TOKEN = process.env.DDB_COBALT_TOKEN;
const CHARACTER_ID = process.env.DDB_CHARACTER_ID || '147239148';
const api = globalThis.game?.modules?.get('beyond-foundry')?.api;

describe('Item Import (Real Data)', () => {
  beforeAll(() => {
    if (!COBALT_TOKEN) throw new Error('DDB_COBALT_TOKEN not set');
    if (!api) throw new Error('Beyond Foundry API not available in test environment');
  });

  it('fetches character equipment', async () => {
    const character = await api.getCharacter(CHARACTER_ID);
    expect(character.inventory).toBeDefined();
    expect(Array.isArray(character.inventory)).toBe(true);
  });

  it('imports all equipment for character', async () => {
    const character = await api.getCharacter(CHARACTER_ID);
    for (const item of character.inventory) {
      const imported = await api.importItem(item.id);
      expect(imported).toBeDefined();
      expect(imported.type).toBe('equipment');
      expect(imported.name).toBe(item.name);
    }
  });

  it('handles attunement and containers', async () => {
    const character = await api.getCharacter(CHARACTER_ID);
    for (const item of character.inventory) {
      if (item.attunement) {
        const imported = await api.importItem(item.id);
        expect(imported.system.attunement).toBe(true);
      }
      if (item.containerId) {
        const imported = await api.importItem(item.id);
        expect(imported.system.containerId).toBe(item.containerId);
      }
    }
  });
});
