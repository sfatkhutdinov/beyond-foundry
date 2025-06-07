# Parser Specifications

## Overview
Beyond Foundry uses modular parsers for each D&D Beyond content type. Each parser is designed to map DDB data to FoundryVTT's D&D 5e schema, following patterns from ddb-importer and reference analysis.

---

## Parser Coverage Table

| Parser           | Status         | Supported Fields                | Missing / TODOs                | Reference / Notes                  |
|------------------|:-------------:|---------------------------------|-------------------------------|------------------------------------|
| CharacterParser  | ✅ Complete    | Stats, abilities, class, inventory, skills, backgrounds, features | Homebrew, edge cases           | [ddb-importer/character](../../reference/ddb-importer/src/parser/character/) |
| SpellParser      | ✅ Production  | All spellcasting classes, multiclass, components, scaling, metadata | Homebrew, rare edge cases      | [SPELL_ENHANCEMENT_COMPLETE.md](SPELL_ENHANCEMENT_COMPLETE.md) |
| EquipmentParser  | 🟡 In Progress | Weapons, armor, gear, basic magic items | Advanced magic, variants, attunement | [ddb-importer/items](../../reference/ddb-importer/src/parser/items/) |
| MonsterParser    | ⏳ Planned     | -                               | All fields                    | [ddb-importer/monsters](../../reference/ddb-importer/src/parser/monsters/) |

---

## Implementation Notes
- Parsers are located in `src/parsers/`
- Each parser is modular and type-safe (TypeScript)
- Reference implementations: ddb-importer, ddb-proxy
- See `analysis/` for sample data and parser outputs

## Known Issues & TODOs
- Homebrew content requires additional mapping and testing
- Some rare DDB edge cases may not be fully supported yet
- Equipment attunement and advanced item features are in progress

---

For detailed spell parser implementation, see [SPELL_ENHANCEMENT_COMPLETE.md](SPELL_ENHANCEMENT_COMPLETE.md).
