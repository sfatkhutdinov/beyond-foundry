# Testing Strategy

## Types
- Unit tests: Individual parsers
- Integration: Full import flow
- End-to-end: From DDB to Foundry

## Tools
- Jest or similar test runner

---

## Endpoint Test Matrix

| Endpoint             | Test Cases Covered                                 | Status         |
|---------------------|----------------------------------------------------|:-------------:|
| /import/character   | Valid import, missing data, auth error, edge cases | ✅ Complete    |
| /import/spell       | Valid import, upcasting, multiclass, error cases   | ✅ Complete    |
| /import/item        | Basic/advanced item, attunement, containers, error | 🟡 In Progress |
| /import/monster     | Stat block, spellcasting, variants, error cases    | ✅ Complete    |
| /import/bulk        | Bulk spell, bulk character, error handling         | 🟡 In Progress |

---

## Usage Examples

### Character Import
```bash
curl -X POST http://localhost:4000/import/character -d '{"ddbId":123456}'
```

### Spell Import
```bash
curl -X POST http://localhost:4000/import/spell -d '{"ddbId":7890}'
```

---

## Integration Testing
- Use `npm run test` for automated endpoint tests
- Manual tests: see [FOUNDRY_TESTING.md](FOUNDRY_TESTING.md)
- Diagnostic scripts: `scripts/` directory

---

## Troubleshooting
- Ensure ddb-proxy is running and accessible
- Check authentication token (cobalt cookie)
- Review error messages for schema or data issues
- See [api.md](api.md) for endpoint reference

---

## TODO
- Expand test cases for advanced equipment and bulk import
- Add more edge case and error scenario tests
