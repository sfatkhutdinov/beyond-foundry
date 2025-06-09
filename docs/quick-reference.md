# Developer Quick Reference

## URLs
- Proxy (external): http://localhost:4000
- Proxy (internal): http://ddb-proxy:3000

## Commands
- `npm run build`
- `npm run build:watch`
- `docker-compose logs -f`
- `node scripts/test-enhanced-spell-import.js`  # Test spell import
- `node scripts/test-proxy-integration.js`      # Test proxy and character import
- `node scripts/enhanced-parser-standalone.js`  # Standalone parser test

## Analysis & Test Data
- `analysis/` - Raw and enhanced parser outputs
- `debug/` - Debug data for real characters
- See [FOUNDRY_TESTING.md](FOUNDRY_TESTING.md) for integration steps

## Where to Find Parsers
- `src/parsers/` - All parser implementations
- `src/module/api/BeyondFoundryAPI.ts` - Main API

## Docs
- [Spell Enhancement](SPELL_ENHANCEMENT_COMPLETE.md)
- [Testing Guide](FOUNDRY_TESTING.md)
- [Parsers](parsers.md)

- For context management, see: ../.github/instructions/development-context-management.instructions.md
- For Docker & proxy workflows, see: ../.github/instructions/docker-proxy-workflow.instructions.md
