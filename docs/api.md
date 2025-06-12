# Beyond Foundry API Reference

## Overview

This document provides a comprehensive reference for the Beyond Foundry API, including all available methods, types, and usage examples.

## 🎯 Core API

### 1. Module Access
```typescript
// Get the Beyond Foundry module
const beyondFoundry = game.modules.get("beyond-foundry");

// Access the API
const api = beyondFoundry.api;
```

### 2. Main API Methods

#### Character Import
```typescript
// Import a character
const result = await api.importCharacter(characterId, {
  importSpells: true,
  importItems: true,
  updateExisting: false,
  createCompendiumItems: true,
  spellPreparationMode: 'prepared',
  spellCompendiumName: 'beyondfoundry.spells',
  itemCompendiumName: 'beyondfoundry.items'
});

// Result type
interface ImportResult {
  success: boolean;
  actor?: FoundryActor;
  errors?: string[];
  warnings?: string[];
  importedItems?: number;
  importedSpells?: number;
  endpoint: string;
}
```

#### Spell Management
```typescript
// Import character spells
const result = await api.importCharacterSpells(actor, ddbCharacter, {
  importSpells: true,
  spellPreparationMode: 'prepared',
  spellCompendiumName: 'beyondfoundry.spells'
});

// Bulk import spells to compendium
const count = await api.bulkImportSpellsToCompendium(cobaltToken, 'beyondfoundry.spells');
```

#### Item Management
```typescript
// Bulk import items to compendium
const count = await api.bulkImportItemsToCompendium(cobaltToken, 'beyondfoundry.items');
```

#### Class Import
```typescript
// Import a class
const classData = await api.importClass(classId, {
  updateExisting: true
});
```

## 📦 API Types

### 1. Import Options
```typescript
interface ImportOptions {
  importItems: boolean;
  importSpells: boolean;
  updateExisting: boolean;
  createCompendiumItems: boolean;
  spellPreparationMode?: 'prepared' | 'pact' | 'always' | 'atwill' | 'innate';
  spellCompendiumName?: string;
  itemCompendiumName?: string;
}
```

### 2. API Response Types
```typescript
interface APIResponse {
  success: boolean;
  endpoint: string;
  error?: string;
}

interface CharacterEndpointResponse extends APIResponse {
  characterId: string;
  data?: {
    ddbCharacter: DDBCharacter;
    foundryActor: FoundryActor;
    metadata: {
      sourceId: string;
      importedAt: string;
      version: string;
    };
  };
  totalItems?: number;
  totalSpells?: number;
  totalFeatures?: number;
}
```

## 🔧 Utility Methods

### 1. Authentication
```typescript
// Test proxy connection
const isConnected = await api.testProxyConnection();

// Authenticate with D&D Beyond
const authResult = await api.authenticate(cobaltToken);
```

### 2. Diagnostics
```typescript
// Run diagnostic
await api.runDiagnostic();

// Quick test
await api.quickTest(cobaltToken, characterId);
```

## 🛠️ Error Handling

### 1. Error Types
```typescript
interface BeyondFoundryError extends Error {
  code: string;
  details?: any;
}

// Example error handling
try {
  await api.importCharacter(characterId, options);
} catch (error) {
  if (error instanceof BeyondFoundryError) {
    console.error(`Error ${error.code}: ${error.message}`);
  }
}
```

### 2. Common Error Codes
- `AUTH_FAILED` - Authentication failed
- `INVALID_ID` - Invalid character/spell/item ID
- `IMPORT_FAILED` - Import failed
- `VALIDATION_FAILED` - Validation failed
- `COMPENDIUM_ERROR` - Compendium operation failed

## 📝 Usage Examples

### 1. Basic Character Import
```typescript
// Import a character with spells and items
const result = await api.importCharacter(characterId, {
  importSpells: true,
  importItems: true,
  updateExisting: false,
  createCompendiumItems: true
});

if (result.success) {
  console.log(`Imported character: ${result.actor?.name}`);
  console.log(`Imported ${result.importedSpells} spells`);
  console.log(`Imported ${result.importedItems} items`);
} else {
  console.error('Import failed:', result.errors);
}
```

### 2. Bulk Spell Import
```typescript
// Import all spells to compendium
const count = await api.bulkImportSpellsToCompendium(cobaltToken);
console.log(`Imported ${count} spells to compendium`);
```

### 3. Item Management
```typescript
// Import items to compendium
const count = await api.bulkImportItemsToCompendium(cobaltToken);
console.log(`Imported ${count} items to compendium`);
```

## 🔄 Event System

### 1. Available Events
```typescript
// Listen for import events
game.modules.get("beyond-foundry").api.on("importStart", (data) => {
  console.log("Import started:", data);
});

game.modules.get("beyond-foundry").api.on("importComplete", (data) => {
  console.log("Import completed:", data);
});
```

### 2. Event Types
- `importStart` - Import started
- `importProgress` - Import progress update
- `importComplete` - Import completed
- `importError` - Import error
- `validationStart` - Validation started
- `validationComplete` - Validation completed

## 📚 Additional Resources

### 1. Documentation
- [FoundryVTT API](https://foundryvtt.com/api/)
- [D&D 5e System](https://foundryvtt.com/packages/dnd5e)
- [Module Development](https://foundryvtt.com/article/module-development/)

### 2. Examples
- [Basic Usage](examples/basic-usage.md)
- [Advanced Usage](examples/advanced-usage.md)
- [Error Handling](examples/error-handling.md)

## 🚀 Future API Features

### 1. Planned Methods
- Advanced character import
- Bulk monster import
- Homebrew management
- Content sharing
- Advanced validation

### 2. Planned Types
- Monster types
- Homebrew types
- Sharing types
- Validation types
- Event types

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
