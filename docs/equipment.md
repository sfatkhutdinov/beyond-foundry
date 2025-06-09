# Beyond Foundry Equipment & Item Import

## Status: In Progress

This document details the equipment and item import system, including advanced mapping and planned enhancements.

### Current Implementation
- Basic equipment import (complete)
- Magic item import (complete)
- Attunement support (complete)

### Advanced Mapping (Planned)
- Container relationships (planned)
- Custom item properties (planned)
- Homebrew item support (see [homebrew.md](homebrew.md))

### Known Issues
- Some equipment types may require manual adjustment
- Advanced mapping for containers and custom fields is in progress

### TODO
- Expand documentation for advanced mapping
- Add code references and examples
- Document known edge cases

---

## Advanced Mapping Details

- **Attunement**: Items requiring attunement are flagged and tracked in the imported actor's inventory.
- **Containers**: Items can be nested within containers (e.g., backpack, bag of holding). Planned support for recursive container relationships.
- **Homebrew Items**: Custom items are mapped using the homebrew workflow (see [homebrew.md](homebrew.md)).

### Example: Container Relationship Mapping
```typescript
// Example: Assigning items to containers
function assignItemsToContainers(items: ItemData[]) {
  const containers = items.filter(i => i.type === 'container');
  items.forEach(item => {
    if (item.containerId) {
      const container = containers.find(c => c.id === item.containerId);
      if (container) {
        container.contents = container.contents || [];
        container.contents.push(item);
      }
    }
  });
}
```

---

## Known Edge Cases
- Nested containers beyond two levels may not import correctly (planned fix)
- Some homebrew item fields may not map 1:1 to Foundry schema
- Attunement slots are not enforced if the DDB data is incomplete

---
