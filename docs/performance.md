# Beyond Foundry Performance

## Status: In Progress

This document tracks performance benchmarks, optimization strategies, and known bottlenecks for Beyond Foundry imports.

### Current Benchmarks
- Character import: <pending data>
- Spell import: <pending data>
- Bulk import: <pending data>

### Performance Testing Status
**Status**: Benchmarks not yet collected. Performance testing infrastructure is in place but comprehensive metrics need to be gathered.

### Expected Performance (Estimates)
- Importing 5th-level character: ~2-5s (estimated, local proxy)
- Importing 10 characters (bulk): ~20-50s (estimated)
- Spell import (all spells): ~5-15s (estimated)

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
