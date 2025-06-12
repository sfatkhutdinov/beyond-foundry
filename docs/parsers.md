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
| ClassParser      | ✅ Enhanced    | Full FoundryVTT schema, proxy enrichment, homebrew flags, spellLists, tags, prerequisites, source info, **robust HTML parsing, complete feature/subclass/progression extraction, no rawHtml in output** | - | Enriches all fields, supports proxyData, homebrew detection |
| RuleParser       | ⏳ Planned     | -                               | All fields                    |                                    |
| FeatParser       | 🟡 In Progress | -                               | All fields                    |                                    |

---

## Implementation Notes
- ClassParser now supports full FoundryVTT schema enrichment, including description, proficiencies, spellcasting, advancement, prerequisites, tags, starting equipment, spellLists, source info, and homebrew flags. It uses both DDBClass and proxyData (HTML-scraped output) for maximum coverage.
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
- **Class Importer Overhaul**: The class importer now robustly parses D&D Beyond class HTML, extracting all core traits, features, progression tables, and subclasses with high fidelity. All outputs are now clean, canonical JSON—**no raw HTML is included in the output** (the `rawHtml` debug field has been removed).
- **Proxy Directory Fix**: The `beyond-foundry-proxy` directory is now a regular, fully tracked directory in the main repository (not a broken submodule). All proxy code, including `src/class.ts`, is now versioned and tracked with the main repo, ensuring all updates are visible and shareable.

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

# Wizard Class Import: Current State and Enhancement Plan

## Current State (as of 2025-06-11)

- The Wizard class import pipeline successfully pulls and transforms class data from D&D Beyond via the Docker proxy.
- The transformed output (`zzzOutputzzz/wizard-class_transformed.json`) includes:
  - Core features (Proficiencies, Equipment, Spellcasting, Arcane Recovery, Arcane Tradition, Ability Score Improvement, Spell Mastery, Signature Spells, Additional Wizard Spells)
  - Descriptions for each feature
  - Starting equipment (duplicated in both advancement and startingEquipment fields)
- The import covers all major FoundryVTT schema fields for class features, spellcasting, and equipment.
- All linter and compile errors in the parser have been resolved.
- Documentation and enrichment logic are up to date.

## Gaps and Missing Data

- **Progression Table**: No structured advancement table (level-by-level hit dice, spell slots, features, etc.)
- **Subclasses**: No extraction or mapping of available subclasses (Arcane Traditions) or their features.
- **Tags & Metadata**: No explicit tags, prerequisites, or source book references.
- **Spell List Links**: No structured list or links to the wizard spell list; only a textual reference.
- **Sidebar/Summary Data**: No extraction of sidebar blocks (e.g., "Your Spellbook") as structured data.
- **Source Info**: No mapping of source book/page for the class or features.
- **Homebrew Flags**: Not explicitly set for homebrew content (though logic exists).

## Enhancement Plan

1. **Proxy Enhancements**
   - Extract structured progression tables (levels, spell slots, features per level).
   - Extract subclass (Arcane Tradition) data and features.
   - Extract tags, prerequisites, and source info from HTML.
   - Extract and structure spell list links and sidebar/summary blocks.

2. **Parser Enhancements**
   - Map new proxy fields to FoundryVTT schema (advancement, subclasses, tags, prerequisites, source, spell lists).
   - Ensure all new fields are type-checked and documented.
   - Add robust error handling for missing/partial data.

3. **Testing & Validation**
   - Pull and transform Wizard class data with enhanced proxy/parser.
   - Validate output in FoundryVTT and update documentation.

---

# Implementation: Proxy and Parser Enhancement (Step 1)

Proceeding to implement proxy enhancements for structured extraction of:
- Progression tables (levels, spell slots, features)
- Subclass data
- Tags, prerequisites, and source info
- Spell list links and sidebar/summary blocks

Will update the proxy extraction logic in `beyond-foundry-proxy/src/class.ts` to support these fields.
