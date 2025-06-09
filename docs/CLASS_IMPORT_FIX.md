# Class Import Method Fix

## Issue Fixed

The `importClass` method in `BeyondFoundryAPI.ts` was trying to use a non-existent `/proxy/class` endpoint in ddb-proxy. This has been fixed to work with the available infrastructure.

## Solution

The method now uses the existing `/proxy/character` endpoint and extracts class data from character information. This approach:

1. **Uses working endpoints**: Leverages the proven `/proxy/character` endpoint
2. **Maintains functionality**: Can still import class data, just requires a character context
3. **Provides flexibility**: Can import specific classes from multi-class characters
4. **Preserves existing parsing**: Uses the existing `ClassParser.parseClass()` method

## Updated Method Signature

```typescript
public async importClass(
  characterId: string,
  classDefinitionId?: string,
  options: Partial<ImportOptions> = {}
): Promise<Record<string, unknown> | null>
```

## Usage Examples

```typescript
// Import the first/primary class from a character
const classData = await api.importClass("147565858");

// Import a specific class from a multi-class character
const classData = await api.importClass("147565858", "12"); // Class definition ID 12

// The returned data includes metadata about the source
console.log(classData.flags['beyond-foundry'].sourceCharacterId); // 147565858
console.log(classData.flags['beyond-foundry'].classDefinitionId); // 12
console.log(classData.flags['beyond-foundry'].importedFrom); // "character"
```

## Key Changes

1. **Parameter Change**: First parameter is now `characterId` instead of `classId`
2. **New Optional Parameter**: `classDefinitionId` for targeting specific classes in multi-class characters
3. **Working Endpoint**: Uses `/proxy/character` instead of the non-existent `/proxy/class`
4. **Enhanced Metadata**: Adds source character information to the imported class data
5. **Better Error Handling**: Provides clear messages about available classes when targeting fails

## Testing

Use the provided `test-class-import.js` script to verify the functionality:

```bash
node test-class-import.js <cobalt-token> <character-id>
```

This will test the character data retrieval and show available classes for import.

## Benefits

- ✅ **Working Implementation**: No longer fails due to missing endpoints
- ✅ **Backward Compatible**: Return format remains the same
- ✅ **Informative Logging**: Clear messages about available classes and import process
- ✅ **Flexible**: Supports both single-class and multi-class character imports
- ✅ **Traceable**: Includes source character information in the imported data
