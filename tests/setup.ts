// Test setup file for Vitest
import { vi } from 'vitest';

// Mock FoundryVTT globals
const mockFoundryVTT = {
  game: {
    modules: new Map(),
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

// Assign to global
Object.assign(globalThis, mockFoundryVTT);

// Mock fetch for Node.js environment
if (typeof fetch === 'undefined') {
  global.fetch = vi.fn();
}

// Console setup for tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
};
