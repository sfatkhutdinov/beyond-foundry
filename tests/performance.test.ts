import { describe, it, expect, beforeAll } from 'vitest';

// Feature: Performance Benchmarks
// Covers: Import speed, stress tests
// NOTE: All tests must use real Beyond Foundry importers and real D&D Beyond data. Do not use mock data.

const COBALT_TOKEN = process.env.DDB_COBALT_TOKEN;
const CHARACTER_ID = process.env.DDB_CHARACTER_ID || '147239148';
const api = globalThis.game?.modules?.get('beyond-foundry')?.api;

describe('Performance (Real Data)', () => {
  beforeAll(() => {
    if (!COBALT_TOKEN) throw new Error('DDB_COBALT_TOKEN not set');
    if (!api) throw new Error('Beyond Foundry API not available in test environment');
  });

  it('benchmarks character import time', async () => {
    const start = performance.now();
    await api.importCharacter(CHARACTER_ID);
    const end = performance.now();
    const duration = end - start;
    console.log(`Character import took ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(5000); // Should import in under 5s
  });

  it('benchmarks memory usage during import (Node only)', async () => {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const before = process.memoryUsage().heapUsed;
      await api.importCharacter(CHARACTER_ID);
      const after = process.memoryUsage().heapUsed;
      const used = (after - before) / 1024 / 1024;
      console.log(`Memory used: ${used.toFixed(2)}MB`);
      expect(used).toBeLessThan(200); // Should not use more than 200MB
    } else {
      console.warn('Memory usage test skipped: process.memoryUsage not available');
    }
  });
});
