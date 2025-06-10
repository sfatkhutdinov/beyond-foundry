import { describe, it, expect, beforeAll } from 'vitest';

// Feature: Compendium Management
// Covers: Bulk import, canonical linking, export
// NOTE: All tests must use real Beyond Foundry importers and real D&D Beyond data. Do not use mock data.

const COBALT_TOKEN = process.env.DDB_COBALT_TOKEN;
const api = globalThis.game?.modules?.get('beyond-foundry')?.api;

describe('Compendium Management', () => {
  beforeAll(() => {
    if (!COBALT_TOKEN) throw new Error('DDB_COBALT_TOKEN not set');
    if (!api) throw new Error('Beyond Foundry API not available in test environment');
  });

  it('bulk imports spells to compendium', async () => {
    const items = await api.bulkImportSpells();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.type).toBe('spell');
    }
  });
  it.skip('bulk imports monsters to compendium - PLANNED FEATURE', async () => {
    // NOTE: bulkImportMonsters API method not yet implemented
    const actors = await api.bulkImportMonsters();
    expect(Array.isArray(actors)).toBe(true);
    expect(actors.length).toBeGreaterThan(0);
    for (const actor of actors) {
      expect(actor.type).toBe('npc');
    }
  });
  it('links imported content canonically', async () => {
    // TODO: Implement test using real Beyond Foundry import capabilities and real D&D Beyond data
  });
  it('exports compendium content', async () => {
    // TODO: Implement test using real Beyond Foundry import capabilities and real D&D Beyond data
  });
});
