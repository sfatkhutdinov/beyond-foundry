// Test setup file for Vitest: Mocks FoundryVTT globals and environment for Beyond Foundry tests
import { vi } from 'vitest';

// Mock FoundryVTT globals
const mockFoundryVTT = {
  game: {
    modules: new Map([
      ['beyond-foundry', { api: {
        authenticate: vi.fn(async (token) => ({ success: !!token })),
        getCharacter: vi.fn(async (id) => id && id !== '0' ? { name: 'Test Character', system: {}, spells: [], inventory: [], type: 'character' } : undefined),
        importCharacter: vi.fn(async (id) => id && id !== '0' ? { name: 'Test Character', system: {}, type: 'character' } : Promise.reject(new Error('Invalid character ID'))),
        importSpell: vi.fn(async (id) => ({ id, name: 'Test Spell', type: 'spell', compendium: 'spells', system: {} })),
        importItem: vi.fn(async (id) => ({ id, name: 'Test Item', type: 'equipment', system: { attunement: false, containerId: null, isHomebrew: false } })),
        importMonster: vi.fn(async (id) => id && id !== '0' ? { name: 'Test Monster', type: 'npc', system: {} } : Promise.reject(new Error('Invalid monster ID'))),
        bulkImportSpells: vi.fn(async () => [{ name: 'Test Spell', type: 'spell' }]),
        bulkImportMonsters: vi.fn(async () => [{ name: 'Test Monster', type: 'npc' }]),
        quickTest: vi.fn(async () => ({ success: true })),
        runConnectionTest: vi.fn(async () => ({ success: true })),
        openCharacterImportDialog: vi.fn(() => true),
        openAuthDialog: vi.fn(() => true),
      }}]
    ]),
    settings: {
      get: vi.fn(),
      set: vi.fn(),
      register: vi.fn()
    },
    user: {
      isGM: true
    },
    system: {
      id: 'dnd5e'
    }
  },
  ui: {
    notifications: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
  },
  Hooks: {
    on: vi.fn(),
    once: vi.fn(),
    call: vi.fn(),
    callAll: vi.fn()
  },
  Actor: class MockActor {},
  Item: class MockItem {},
  Scene: class MockScene {},
  Application: class MockApplication {},
  Dialog: class MockDialog {},
  FormApplication: class MockFormApplication {}
};

Object.assign(globalThis, mockFoundryVTT);

// Mock fetch for Node.js environment
if (typeof fetch === 'undefined') {
  globalThis.fetch = vi.fn(async () => ({ json: async () => ({}) }));
}
