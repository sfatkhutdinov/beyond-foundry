# D&D Beyond Class Extraction Logic: Findings & Action Plan

## Summary
This document outlines the current state, key findings, and a robust plan for refactoring and completing the D&D Beyond class extraction logic for Beyond Foundry. The goal is to ensure all critical class data (description, core traits, progression, features, subclasses, sidebars, spell lists, etc.) is reliably extracted and mapped to the FoundryVTT schema, regardless of D&D Beyond's HTML structure.

---

## Key Findings

1. **HTML Structure Variability**
   - D&D Beyond class pages use two main structures:
     - **Table-based** (e.g., Wizard): Core traits and progression are in tables.
     - **Heading-based** (e.g., Druid, Rogue): Core traits and features are in sections under headings.
   - Some classes mix both structures.

2. **Selector Issues**
   - Previous extraction logic relied on selectors that do not match all class types, leading to missing/incomplete data.
   - Sidebars, tags, prerequisites, and source info selectors are especially fragile.

3. **Schema Mapping Gaps**
   - Progression, core traits, sidebars, and some subclass data are not always mapped or are missing in the output.
   - Spell lists and features extraction is robust, but other fields need improvement.

4. **Reference Implementations**
   - ddb-importer and Beyond20 use fallback and multi-path extraction strategies for robustness.
   - FoundryVTT schema requires structured arrays/objects for progression, traits, subclasses, etc.

---

## Action Plan

### 1. Extraction Logic Refactor (Proxy Layer)
- **Detect Structure:**
  - Implement logic to detect table-based vs. heading-based pages.
  - Always run both extraction paths in a single pass to handle mixed cases.

- **Progression Table:**
  - Use robust selectors for `.table-compendium.table--features`.
  - Fallback: Parse by heading/section if table is missing.
  - Map all columns (level, proficiency, features, spell slots, etc.) to a structured array.

- **Core Traits:**
  - Use `.table-compendium.table--left-all` for core traits.
  - Fallback: Parse by heading/section (e.g., `<h3>Proficiencies</h3>` and following content).
  - Return as a structured object (hit die, proficiencies, equipment, etc.).

- **Features & Subclasses:**
  - Parse features and subclasses by heading/section, not just by table.
  - Extract all subclass/domain options, including features and descriptions.

- **Sidebars:**
  - Use `aside.text--rules-sidebar` or similar selectors.
  - Extract all sidebar/aside content and map to `sidebars[]`.

- **Spell Lists:**
  - Ensure all spell list links/buttons are captured and mapped.

- **Tags, Prerequisites, Source:**
  - Only extract if present; otherwise, omit or leave empty.
  - Fix selectors as per latest HTML analysis.

- **Debug Logging:**
  - Add logs for which extraction path was used and what was found/missed.

### 2. Parser Mapping (`ClassParser.ts`)
- Map all new proxy fields (`progression`, `coreTraits`, `sidebars`, `subclasses`, etc.) to the FoundryVTT schema.
- Add robust error handling and logging for missing/partial data.
- Validate output against the FoundryVTT D&D 5e schema.

### 3. Testing & Validation
- Test extraction on multiple classes: Rogue, Druid, Bard, Wizard, etc.
- Compare output JSON to the expected schema and the D&D Beyond HTML.
- Update documentation and coverage tables.

### 4. Documentation
- Update all relevant docs to reflect new logic, field coverage, and validation results.

---

## References
- `docs/HTML_STRUCTURE_ANALYSIS.md`, `CLASS_EXTRACTION_ANALYSIS_REPORT.md`, `CLASS_EXTRACTION_ENRICHMENT_PLAN.md`
- ddb-importer `/src/parser/classes/` and `/src/parser/character/`
- FoundryVTT D&D 5e schema: https://github.com/foundryvtt/dnd5e/tree/master/module/data

---

## Next Steps
1. Refactor extraction logic in `beyond-foundry-proxy/src/class.ts` as above.
2. Update `ClassParser.ts` to map all new fields.
3. Test and validate for multiple classes.
4. Update documentation and parser coverage tables.
