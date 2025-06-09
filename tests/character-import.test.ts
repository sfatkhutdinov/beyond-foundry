import { describe, it, expect, beforeAll } from 'vitest';

// These should be set in your environment or .env file for real-data testing
const COBALT_TOKEN = process.env.DDB_COBALT_TOKEN;
const CHARACTER_ID = process.env.DDB_CHARACTER_ID || '147239148';

// FoundryVTT API globals are expected to be available in the test environment
const api = globalThis.game?.modules?.get('beyond-foundry')?.api;

describe('Character Import (Real Data)', () => {
  beforeAll(() => {
    if (!COBALT_TOKEN) throw new Error('DDB_COBALT_TOKEN not set');
    if (!api) throw new Error('Beyond Foundry API not available in test environment');
  });

  it('authenticates with D&D Beyond', async () => {
    const result = await api.authenticate(COBALT_TOKEN);
    expect(result.success).toBe(true);
  });

  it('fetches character data from D&D Beyond', async () => {
    const character = await api.getCharacter(CHARACTER_ID);
    expect(character).toBeDefined();
    expect(character.name).toBeTruthy();
    expect(character.system).toBeDefined();
  });

  it('imports character into FoundryVTT', async () => {
    const actor = await api.importCharacter(CHARACTER_ID);
    expect(actor).toBeDefined();
    expect(actor.name).toBeTruthy();
    expect(actor.system).toBeDefined();
    expect(actor.type).toBe('character');
  });

  it('handles invalid character ID gracefully', async () => {
    let result;
    try {
      result = await api.importCharacter('0');
    } catch (error) {
      expect(error).toBeDefined();
      return;
    }
    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.error || result.message).toBeTruthy();
  });
});
