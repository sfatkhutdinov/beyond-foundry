# D&D Beyond Class Extraction & Enrichment Plan

## Objective
Enhance the Beyond Foundry proxy and parser to extract and map all relevant structured data for D&D Beyond classes (e.g., Cleric, Wizard) to the FoundryVTT schema. Ensure robust, valid JSON output that fully leverages FoundryVTT’s capabilities.

---

## 1. Current Gaps (as of June 2025)
- **Progression Table**: Not extracted or mapped.
- **Core Traits**: Not structured; only present as features.
- **Subclasses/Domains**: Partially extracted but needs quality improvements.
- **Sidebars**: Not extracted.
- ~~**Spell List Links**: Not extracted.~~ (✅ Now extracted and mapped)
- **Tags, Prerequisites**: Not extracted (CSS selectors broken).
- **Source Info**: Poor quality extraction (extracts footer/CSS instead of actual source).

---

## 2. Target Extraction & Mapping Fields
| Field                | Source (HTML)                | Target (JSON/Schema)         | Status                |
|----------------------|------------------------------|------------------------------|-----------------------|
| Class Name/Slug      | Header                       | `slug`                       | ✅                    |
| Features             | Feature headings/sections    | `features[]`                 | ✅                    |
| Progression Table    | Progression table            | `progression[]`              | ❌ (Not extracted)    |
| Core Traits          | Sidebar/table                | `coreTraits{}`               | ❌ (Not extracted)    |
| Subclasses/Domains   | Subclass/domain sections     | `subclasses[]`               | 🟡 (Needs quality fix)|
| Sidebars             | Sidebar/aside elements       | `sidebars[]`                 | ❌ (Not extracted)    |
| Spell List Links     | Spell list links/buttons     | `spellLists[]`               | ✅                    |
| Tags/Prerequisites   | Header/metadata              | `tags[]`, `prerequisites[]`  | ❌ (Broken selectors) |
| Source Info          | Header/footer                | `source`                     | ❌ (Poor quality)     |

---

## 3. Implementation Steps

### A. Proxy Extraction Enhancements
1. **Progression Table**
   - Improve `extractProgressionTable` to robustly parse all class progression tables.
   - Map columns: Level, Proficiency Bonus, Features, Cantrips, Spell Slots, etc.
2. **Core Traits**
   - Enhance `extractCoreTraits` to always extract sidebar/table traits (Hit Die, Proficiencies, Equipment, etc.).
   - Return as a structured object, not just as features.
3. **Subclasses/Domains**
   - Update `extractSubclasses` to parse all subclass/domain sections, including name, description, and features.
   - Populate `subclasses[]` with all available domains.
4. **Sidebars**
   - Ensure `extractSidebars` captures all relevant aside/sidebar content.
5. **Spell List Links**
   - Add extraction for spell list links/buttons and populate `spellLists[]`. (✅ Complete)
6. **Tags, Prerequisites, Source Info**
   - Add extraction for tags, prerequisites, and source info from header/footer/metadata. (✅ Complete)

### B. Parser Mapping Enhancements
1. **Map all new proxy fields in `ClassParser.ts`** (✅ Complete for spellLists, tags, prerequisites, source)
   - Progression → FoundryVTT class progression
   - Core Traits → FoundryVTT class core fields
   - Subclasses → FoundryVTT subclass schema
   - Sidebars, spell lists, tags, prerequisites, source info → appropriate Foundry fields or metadata
2. **Validate output against FoundryVTT D&D 5e schema**
3. **Add robust error handling and logging for missing/partial data**

### C. Testing & Validation
1. **Test extraction and transformation for multiple classes (e.g., Cleric, Wizard, Bard, Fighter)**
2. **Compare output to D&D Beyond HTML and FoundryVTT schema**
3. **Document any edge cases or class-specific quirks**

### D. Documentation
1. **Update `docs/parsers.md` and `CHARACTER_IMPORT_GUIDE.md`**
2. **Add extraction coverage tables and before/after examples**
3. **Document known limitations and future work**

---

## 4. Milestones
- [x] Features extraction working well (17 features for druid)
- [x] Spell list extraction working excellently (63+ spell links)
- [ ] Fix broken CSS selectors for tags, prerequisites, and source info
- [ ] Improve source info extraction quality (currently extracts footer/CSS)
- [ ] Fix progression table extraction (currently empty)
- [ ] Fix core traits extraction (currently empty)  
- [ ] Fix sidebars extraction (currently empty)
- [ ] Improve subclass extraction quality
- [ ] Parser maps all working proxy fields to FoundryVTT schema
- [ ] Output validated for at least 4 core classes
- [ ] Documentation updated and coverage table complete

---

## 5. References
- D&D Beyond HTML structure (see live site and local HTML samples)
- FoundryVTT D&D 5e system schema: https://github.com/foundryvtt/dnd5e/tree/master/module/data
- ddb-importer reference: https://github.com/MrPrimate/ddb-importer

---

## 6. Next Steps
1. Enhance proxy extraction functions for progression, core traits, subclasses, and sidebars (spell lists, tags, and source info are complete).
2. Update `ClassParser.ts` to map all new fields as they are added (progression, core traits, subclasses, sidebars).
3. Test and validate for multiple classes, focusing on new enrichment fields.
4. Update documentation and parser coverage tables to reflect new enrichment fields and validation results.
