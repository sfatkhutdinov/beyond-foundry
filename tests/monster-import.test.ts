import { describe, it, expect, beforeAll } from 'vitest';

// Feature: Monster Import
// Covers: Stat blocks, variants, spellcasting
// NOTE: All tests must use real Beyond Foundry importers and real D&D Beyond data.

const COBALT_TOKEN = process.env.DDB_COBALT_TOKEN;
const MONSTER_ID = process.env.DDB_MONSTER_ID || '123456'; // Replace with a real monster ID
const api = globalThis.game?.modules?.get('beyond-foundry')?.api;

describe('Monster Import (Real Data)', () => {
  beforeAll(() => {
    if (!COBALT_TOKEN) throw new Error('DDB_COBALT_TOKEN not set');
    if (!api) throw new Error('Beyond Foundry API not available in test environment');
  });

  it('imports monster stat block', async () => {
    const monster = await api.importMonster(MONSTER_ID);
    expect(monster).toBeDefined();
    expect(monster.type).toBe('npc');
    expect(monster.name).toBeTruthy();
    expect(monster.system).toBeDefined();
  });

  it('handles invalid monster ID gracefully', async () => {
    await expect(api.importMonster('0')).rejects.toThrow();
  });
});
