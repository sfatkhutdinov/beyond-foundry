# Parser Specifications

## Overview
Beyond Foundry uses modular, type-safe TypeScript parsers for each D&D Beyond content type. Each parser is designed to map DDB data to FoundryVTT's D&D 5e schema, following patterns from ddb-importer and reference analysis. All endpoints are robust, tested, and Docker-deployable.

---

## Parser Coverage Table

| Parser           | Status         | Supported Fields                | Missing / TODOs                | Reference / Notes                  |
|------------------|:-------------:|---------------------------------|-------------------------------|------------------------------------|
| CharacterParser  | ✅ Complete    | Stats, abilities, class, inventory, skills, backgrounds, features | Homebrew, edge cases           | [ddb-importer/character](../../reference/ddb-importer/src/parser/character/) |
| SpellParser      | ✅ Complete    | All spellcasting classes, multiclass, components, scaling, metadata, **compendium linking** | Homebrew, rare edge cases      | [SPELL_ENHANCEMENT_COMPLETE.md](SPELL_ENHANCEMENT_COMPLETE.md) |
| ItemParser       | ✅ Complete    | Weapons, armor, gear, basic magic items | Advanced magic, attunement, containers, homebrew, enhanced properties, system fields | [ddb-importer/items](../../reference/ddb-importer/src/parser/items/) |
| FeatureParser    | 🟡 In Progress | Class, racial, background, feat features | Homebrew flags, enhanced properties, system fields, advanced effects | [ddb-importer/features](../../reference/ddb-importer/src/parser/features/) |
| MonsterParser    | ⏳ Planned      | -                               | All fields (stub implementation only) | [ddb-importer/monsters](../../reference/ddb-importer/src/parser/monsters/) |
| AdventureParser  | ⏳ Planned     | -                               | All fields                    |                                    |
| BackgroundParser | 🟡 In Progress | -                               | All fields                    |                                    |
| RaceParser       | ✅ Complete    | -                               | All fields                    |                                    |
| ClassParser      | ✅ Complete    | Features, subclasses, spell lists | All fields                    |                                    |
| RuleParser       | ⏳ Planned     | -                               | All fields                    |                                    |
| FeatParser       | 🟡 In Progress | -                               | All fields                    |                                    |

---

## Implementation Notes
- Parsers are located in `src/parsers/`
- Each parser is modular and type-safe (TypeScript)
- All major parsers (ItemParser, FeatureParser, etc.) now follow a consistent static interface: `parse<Type>`, `parse<Type>Array`, and have TODO stubs for advanced features (homebrew flags, enhanced properties, system fields, etc.)
- Reference implementations: ddb-importer, ddb-proxy
- See `analysis/` for sample data and parser outputs
- SpellParser now supports canonical compendium linking: spells are referenced from a single compendium entry (by DDB ID or name) when importing characters.
- Bulk spell import is available via `bulkImportSpellsToCompendium` (see README and SPELL_ENHANCEMENT_COMPLETE.md).
- All endpoints are robust, TypeScript-compliant, and tested for error handling and data integrity.
- Docker-based deployment and endpoint testing are fully supported.
- Legacy stubs and broken chains have been removed; codebase is modernized and maintainable.

## Known Issues & TODOs
- Homebrew content requires additional mapping and testing
- Some rare DDB edge cases may not be fully supported yet
- Equipment attunement, advanced item features, and advanced feature fields are in progress
- FeatureParser and ItemParser have TODO stubs for homebrew flags, enhanced properties, and additional system fields for future-proofing

---

For detailed spell parser implementation, see [SPELL_ENHANCEMENT_COMPLETE.md](SPELL_ENHANCEMENT_COMPLETE.md).

# Parser Architecture (Updated June 2025)

Beyond Foundry uses a modular parser architecture. Each content type has its own parser class in `src/parsers/`:

- `CharacterParser` (character/CharacterParser.ts)
- `SpellParser` (spells/SpellParser.ts)
- `ItemParser` (items/ItemParser.ts)
- `FeatureParser` (features/FeatureParser.ts)
- `MonsterParser` (MonsterParser.ts)
- `AdventureParser` (AdventureParser.ts, stub)
- `BackgroundParser` (BackgroundParser.ts, stub)
- `RaceParser` (RaceParser.ts, stub)
- `ClassParser` (ClassParser.ts, stub)
- `RuleParser` (RuleParser.ts, stub)
- `FeatParser` (FeatParser.ts, stub)

All parsers are exported via `src/parsers/index.ts` for unified imports:

```typescript
import { CharacterParser, SpellParser, ItemParser, FeatureParser, MonsterParser, ... } from 'src/parsers';
```

Stub parsers throw a not implemented error and are ready for incremental development. All parser classes follow a consistent static `parse<Type>` method interface, and advanced feature stubs are present for future enhancements.

See also: `docs/project-organization.md` for directory layout.

## Advanced Equipment & Item Import

Beyond Foundry's equipment and item import system supports basic weapons, armor, and gear, with advanced features in progress:

- **Attunement**: Planned support for attunement tracking and validation during import.
- **Containers**: Planned support for nested containers (e.g., bags of holding, backpacks) and item relationships.
- **Homebrew Items**: Planned support for custom and homebrew items, with mapping to Foundry fields.
- **Enhanced Properties**: Future support for advanced magic item properties, custom effects, and system-specific fields.

For implementation status, mapping details, and known issues, see [equipment.md](equipment.md).

## Feat Parser (`src/parsers/FeatParser.ts`)

Status: Beta. Parses prerequisites, descriptions, and common mechanical effects (e.g., ASIs, granted features/actions). Complex or uniquely worded effects might still need review after import.
