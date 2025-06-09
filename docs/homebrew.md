# Beyond Foundry Homebrew & Custom Content

## Status: In Progress

This document describes support for homebrew and custom content in Beyond Foundry.

### Supported Homebrew Types
- Custom items (basic support)
- Custom spells (basic support)
- Custom races/classes (planned)
- Custom backgrounds/feats (planned)

### Importing Homebrew Content
- Homebrew items and spells are imported if present in DDB data
- Custom rules and adventures: planned

### Limitations
- Some homebrew features may require manual adjustment after import
- Not all DDB homebrew fields are mapped

### TODO
- Expand mapping for custom features
- Add user guide for homebrew workflows
- Document known issues and workarounds

---

## Example: Homebrew Item Mapping

D&D Beyond homebrew items are mapped to FoundryVTT items using the following pattern:

```typescript
// Example: Homebrew item mapping
function mapHomebrewItem(ddbItem: any): FoundryItemData {
  return {
    name: ddbItem.name,
    type: ddbItem.type,
    data: {
      ...ddbItem.data,
      isHomebrew: true,
      source: ddbItem.source || 'Homebrew',
    },
  };
}
```

---

## User Workflow: Importing Homebrew Items
1. Create or enable homebrew content on D&D Beyond
2. Run the Beyond Foundry import for characters or items
3. Homebrew items will be detected and imported with a `Homebrew` tag
4. Review imported items in FoundryVTT and adjust as needed

---
