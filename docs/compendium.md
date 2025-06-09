# Beyond Foundry Compendium Management

## Status: In Progress

This document covers compendium management, bulk import/export, and canonical linking in Beyond Foundry.

### Features
- Bulk spell import (complete)
- Canonical compendium linking (complete)
- Bulk character import (planned)
- Compendium export (planned)

### Usage
- See [UI Components](ui.md) for bulk import dialogs
- Use compendium tools for managing imported content

### TODO
- Add guide for bulk character import
- Document compendium export process
- Add troubleshooting for compendium sync

---

## Usage Example: Bulk Spell Import

To import all spells into a compendium:

```typescript
await api.bulkImportSpells({ compendium: 'beyond.spells' });
```

---

## Troubleshooting: Compendium Sync
- Ensure compendium is unlocked and writable
- Check for duplicate entries (use canonical linking)
- If sync fails, review logs for error messages
- For large imports, monitor memory usage and split into smaller batches if needed

---
