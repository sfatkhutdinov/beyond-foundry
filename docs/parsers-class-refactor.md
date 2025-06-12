# Beyond Foundry Class Parser Refactor Plan

## Overview
This document outlines the plan for refactoring and enhancing the D&D class HTML parsing and mapping logic in `beyond-foundry-proxy/src/class.ts` to ensure full compatibility with the dnd5e system schema and robust, accurate data extraction from D&D Beyond HTML/API sources.

---

## Goals
- **Accurate Extraction:** Parse all relevant class, feature, and subclass data from D&D Beyond HTML/API.
- **Schema Alignment:** Output data must match the dnd5e system's class item schema (see `references/dnd5e/module/data/item/class.mjs`).
- **Robustness:** Handle missing, malformed, or variant HTML gracefully.
- **Maintainability:** Modular, well-documented extraction functions.

---

## Key Extraction & Mapping Functions

### 1. Core Trait Extraction
- **Function:** `extractCoreTraits($)`
- **Goal:** Extract and normalize all core class traits (Hit Die, Primary Ability, Saving Throws, Skills, Weapons, Armor, Tools, Equipment, etc.).
- **Normalization:** Map all keys to canonical dnd5e schema keys (e.g., "Hit Die", not "hit point die").
- **Edge Cases:** Handle missing or variant trait rows.

### 2. Progression Table Extraction
- **Function:** `extractProgressionTable($)`
- **Goal:** Parse the class progression table (level, proficiency bonus, features, sneak attack, etc.) into an array of objects.
- **Mapping:** Ensure each row is mapped to `{ level, columns: [...] }`.

### 3. Feature Extraction
- **Function:** `extractFeatures($)`
- **Goal:** Extract all class features, associating each with the correct level and name.
- **Level Detection:** Parse level from heading (e.g., "Level 3: Steady Aim" → `requiredLevel: 3`).
- **Description:** Extract all paragraphs and lists associated with the feature.
- **Edge Cases:** Handle features that span multiple paragraphs or have embedded lists.

### 4. Subclass Extraction
- **Function:** `extractSubclasses($)`
- **Goal:** Extract all subclasses, each with its own name, overview, and features.
- **Feature Nesting:** Ensure subclass features are nested under their subclass, with correct levels and descriptions.
- **Tables:** Extract any subclass-specific tables (e.g., spellcasting tables).

### 5. Advancement Extraction
- **Function:** `extractAdvancement(coreTraits)`
- **Goal:** Map saving throws and skill proficiencies to the dnd5e `advancement` array format.
- **Mapping:**
  - Saving Throws: `{ type: "Trait", level: 1, configuration: { grants: ["saves:Dexterity", ...] }, value: { chosen: [...] } }`
  - Skills: `{ type: "Trait", level: 1, configuration: { choices: [{ count, pool: ["skills:Acrobatics", ...] }] }, value: { chosen: [] } }`

### 6. Spellcasting Extraction
- **Function:** `extractSpellcasting($, features, coreTraits)`
- **Goal:** Extract spellcasting progression, ability, and spell lists from tables and feature text.
- **Mapping:** Output `{ progression, ability, lists }` as per dnd5e schema.
- **Edge Cases:** Handle classes with no spellcasting, or with subclass-only spellcasting.

### 7. Sidebars & Additional Tables
- **Function:** `extractSidebars($)` and `extractAdditionalTables($)`
- **Goal:** Extract all sidebar-like content (e.g., "Becoming a Rogue") and any additional tables (e.g., subclass spell tables).
- **Mapping:** Sidebars as array of strings; tables as array of `{ title, headers, rows }`.

### 8. Data Normalization & Merging
- **Function:** `normalizeAndMerge(apiData, htmlData)`
- **Goal:** Merge API and HTML data, preferring API where present but filling gaps with HTML. Normalize all keys and structures to match dnd5e schema.

### 9. Validation
- **Function:** `validateClassData(data)`
- **Goal:** Validate final output against the class schema. Log and handle errors.

---

## Implementation Steps
1. **Write/Refactor Extraction Functions:**
   - Modularize and document each extraction function as above.
2. **Normalize Keys and Structures:**
   - Ensure all output keys match dnd5e schema.
3. **Implement Robust Merging:**
   - Merge API and HTML data, filling gaps and avoiding data loss.
4. **Add/Update Tests:**
   - Add tests for each extraction function and for full class parsing.
5. **Validate Output:**
   - Run output through schema validation and compare to canonical dnd5e class items.
6. **Document Edge Cases:**
   - Note any known issues or edge cases in this file for future reference.

---

## References
- `references/dnd5e/module/data/item/class.mjs` (dnd5e class schema)
- `beyond-foundry-proxy/src/class.ts` (current implementation)
- D&D Beyond HTML samples (e.g., `beyond-foundry-proxy/zzzOutputzzz/rawHtml.html`)

---

## Success Criteria
- Output matches dnd5e schema and passes validation.
- All class, feature, and subclass data is accurately extracted and mapped.
- Robust to HTML/API changes and missing data.
- Well-documented, maintainable codebase. 