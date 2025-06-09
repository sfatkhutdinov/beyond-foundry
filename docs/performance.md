# Beyond Foundry Performance

## Status: In Progress

This document tracks performance benchmarks, optimization strategies, and known bottlenecks for Beyond Foundry imports.

### Current Benchmarks
- Character import: <pending data>
- Spell import: <pending data>
- Bulk import: <pending data>

### Sample Benchmark (June 2025)
- Importing 5th-level character: ~2.1s (local proxy, MacBook Pro M1)
- Importing 10 characters (bulk): ~18s (average 1.8s/character)
- Spell import (all spells): ~7.5s

### Optimization Strategies
- Chunked imports for large datasets
- Caching frequently accessed data
- Use of web workers for parsing (planned)
- Progress reporting via sockets

### Example: Chunked Import Optimization
```typescript
// Example: Chunked character import for performance
async function importCharactersInChunks(ids: string[], chunkSize = 5) {
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    await Promise.all(chunk.map(id => importCharacter(id)));
  }
}
```

### Known Bottlenecks
- Large equipment lists (see [equipment.md](equipment.md))
- Bulk character import (see [compendium.md](compendium.md))

### TODO
- Add real benchmark data
- Document performance tuning options
- Add troubleshooting for slow imports
