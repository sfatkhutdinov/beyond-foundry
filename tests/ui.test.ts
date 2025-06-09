import { describe, it, expect, beforeAll } from 'vitest';

// Feature: User Interface
// Covers: Import dialogs, bulk import, error reporting
// NOTE: All tests must use real Beyond Foundry importers and real D&D Beyond data. Do not use mock data.

const api = globalThis.game?.modules?.get('beyond-foundry')?.api;

describe('User Interface', () => {
  beforeAll(() => {
    if (!api) throw new Error('Beyond Foundry API not available in test environment');
  });

  it('opens character import dialog', async () => {
    expect(() => api.openCharacterImportDialog()).not.toThrow();
  });

  it('opens authentication dialog', async () => {
    expect(() => api.openAuthDialog()).not.toThrow();
  });

  it('shows error for missing token', async () => {
    const result = await api.authenticate('');
    expect(result).toBeDefined();
    expect(result.success).toBe(false);
  });

  it('shows the import wizard', async () => {
    // TODO: Implement test using real Beyond Foundry import capabilities
  });
  it('shows error messages for failed imports', async () => {
    // TODO: Implement test using real D&D Beyond data
  });
  it('handles bulk import dialog', async () => {
    // TODO: Implement test using real Beyond Foundry import capabilities
  });
});
