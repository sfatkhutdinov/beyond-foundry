# Beyond Foundry Test Suite

This directory contains organized, named, and comprehensive tests for all Beyond Foundry capabilities. Each test file targets a specific feature or integration, and all tests are runnable via a single command (e.g., `npm test`).

## Test Organization

- `character-import.test.ts` — Character import (all levels, classes, backgrounds, multiclass)
- `spell-import.test.ts` — Spell import (all classes, upcasting, compendium linking)
- `item-import.test.ts` — Equipment & item import (attunement, containers, homebrew)
- `monster-import.test.ts` — Monster stat blocks, variants, spellcasting
- `feat-import.test.ts` — Feats and feature import (partial)
- `background-import.test.ts` — Backgrounds (partial)
- `compendium.test.ts` — Bulk import, compendium management
- `api-endpoints.test.ts` — Endpoint coverage and error handling
- `performance.test.ts` — Performance benchmarks and stress tests
- `ui.test.ts` — UI dialogs, bulk import, error reporting
- `homebrew.test.ts` — Homebrew content import and mapping

## Real Data-Only Policy

**All tests must use real Beyond Foundry module functionality and real D&D Beyond data.**
- No mock data or mock importers are permitted.
- Tests should reflect actual user workflows and real-world scenarios.
- See each test file for details and required D&D Beyond content.

## Running All Tests

```bash
npm test
```

Or, for a specific test:

```bash
npx vitest run tests/character-import.test.ts
```

## Coverage

Each test file is mapped to a feature in the main checklist. See the top of each file for the feature(s) it covers.

## Adding or Updating Tests

- Add new test files for new features or capabilities.
- Update existing tests as features evolve or new edge cases are discovered.
- Ensure all tests follow the real-data-only policy.
- Document any required D&D Beyond content or setup at the top of each test file.

## Test Runner & Configuration

- Tests are run using [Vitest](https://vitest.dev/) (see `vitest.config.ts`).
- Ensure your environment is configured to access real D&D Beyond content via the Beyond Foundry module and proxy.
- For proxy setup, see `docs/FOUNDRY_TESTING.md` and `docs/authentication.md`.

## Troubleshooting

- If a test fails due to missing D&D Beyond content, ensure you own the required content and are authenticated.
- For proxy or authentication issues, see the troubleshooting sections in `docs/FOUNDRY_TESTING.md` and `docs/authentication.md`.

## Related Documentation

- [FOUNDRY_TESTING.md](../docs/FOUNDRY_TESTING.md)
- [testing.md](../docs/testing.md)
- [development-status.md](../docs/development-status.md)
- [api.md](../docs/api.md)
- [equipment.md](../docs/equipment.md)
- [homebrew.md](../docs/homebrew.md)
- [compendium.md](../docs/compendium.md)

---

For more information, see the main project [README.md](../README.md) and the documentation in the `docs/` directory.
