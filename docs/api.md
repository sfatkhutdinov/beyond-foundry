# Beyond Foundry API Reference

## Status: Updated June 2025

This document provides an overview of the Beyond Foundry API, available methods, and usage patterns.

### Core API Methods

#### Character Import
- `importCharacter(characterId: string, options?: ImportOptions): Promise<ImportResult>`
- `getCharacter(characterId: string): Promise<DDBCharacter | null>`

#### Spell Import  
- `importCharacterSpells(actor: Actor, ddbCharacter: DDBCharacter, options?: ImportOptions): Promise<SpellImportResult>`
- `bulkImportSpellsToCompendium(cobaltToken: string, compendiumName?: string): Promise<number>`

#### Item Import
- `bulkImportItemsToCompendium(cobaltToken: string, compendiumName?: string): Promise<number>`

#### Authentication & Connection
- `authenticate(cobaltToken?: string): Promise<AuthResponse>`
- `testProxyConnection(): Promise<boolean>`

#### Utility Methods
- `runConnectionTest(): Promise<void>`
- `runDiagnostic(): Promise<void>`

### Planned/Not Yet Implemented
- `bulkImportCharacters()` - Not yet implemented
- `importMonster()` - Not yet implemented  
- `bulkImportMonsters()` - Not yet implemented

### Usage Examples
- See [FOUNDRY_TESTING.md](FOUNDRY_TESTING.md) for integration tests
- Use diagnostic scripts in `scripts/` for endpoint validation

### TODO
- Add full endpoint parameter and response documentation
- Document error codes and troubleshooting
- Add authentication/authorization details

---

## Example: Character Import Endpoint

**POST** `/import/character`

**Request Body:**
```json
{
  "ddbId": "123456",
  "options": { "importSpells": true }
}
```

**Response:**
```json
{
  "success": true,
  "actorId": "abc123",
  "warnings": []
}
```

---

## Error Codes
- `401 Unauthorized`: Invalid or missing authentication
- `404 Not Found`: DDB ID not found or not owned
- `422 Unprocessable Entity`: Invalid data or schema mismatch
- `500 Internal Server Error`: Unexpected error, see logs

---
