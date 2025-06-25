# Scripts Directory

This directory contains utility and test scripts for Beyond Foundry.

## Main Scripts
- `importAllSpellsTest.ts` — Bulk import all spells for testing (**Partial/Stub: API method is a placeholder**)
- `importCharacterTest.ts` — Test character import (**Fully functional in Node/test environment**)
- `importClassTest.ts` — Test class import (**Class data import works; class features and spell import for classes are partial/stub**)
- `config.ts` — Script configuration
- `parse-ddb-character.ts` — Parse a D&D Beyond character
- `testEnhancedSpellParser.ts` — Test the enhanced spell parser (**Fully functional; requires spell data in zzzOutputzzz/imported_spells.json**)
- `enhancedSpellParserDemo.ts` — Demo for enhanced spell parsing
- `importSpells.ts` — Import spells utility (**Fully functional; now uses .env if no CLI arg**)
- `spellEnhancementAnalysis.ts` — Analyze spell enhancement

## Experimental/Dev Scripts
- See `scripts/dev/` for experimental or empty scripts.

## Script Status & Requirements
- All main scripts now work with the current codebase and .env setup.
- Some features (e.g., compendium linking, UI dialogs) require FoundryVTT and cannot be tested in Node.
- Some scripts are partial/stubs (see above).

## Onboarding
- Use these scripts for testing, development, and analysis.
- See the main README and docs for workflow and integration details. 