# Beyond Foundry - Project Organization

> **Note:** This is the main and canonical repository for Beyond Foundry. All development, issue tracking, and releases are centralized here.

## Directory Structure

This document explains the organized directory structure of the Beyond Foundry project.

### Core Directories

```
src/                    # Source code
├── module/            # Main module files
├── parsers/           # D&D Beyond data parsers
└── types/             # TypeScript type definitions

build/                 # Compiled output (generated)
├── beyond-foundry.js  # Main module file
├── beyond-foundry.css # Compiled styles
└── ...                # Other build artifacts

templates/             # Handlebars templates for UI
lang/                  # Localization files
```

### Development & Testing

```
tests/                 # All test files
├── test-*.js         # JavaScript tests
├── test-*.cjs        # CommonJS tests
└── validate-*.sh     # Validation scripts

scripts/               # Utility scripts
├── analyze-*.js      # Character analysis tools
├── regenerate-*.js   # Data regeneration utilities
└── validate-*.js     # Validation utilities

tools/                 # Build configuration
└── rollup.config.js  # Rollup build config

debug/                 # Debug files and outputs
├── debug-*.js        # Debug scripts
└── debug-*.json      # Debug data
```

### Documentation & Analysis

```
docs/                  # Project documentation
├── *.md              # Core documentation
└── development/       # Development-specific docs

analysis/              # Character/data analysis results
├── character-analysis/         # Raw character data
├── comprehensive-parser-results/  # Parser outputs
├── enhanced-parser-results/    # Enhanced analysis
├── equipment-parser-results/   # Equipment parsing
└── parser-test-results/        # Test results

reference/             # External reference code
├── ddb-importer/     # DDB Importer reference
├── ddb-proxy/        # DDB Proxy reference
└── foundryvtt-dnd5e/ # FoundryVTT D&D 5e reference
```

### Archive & Obsolete Folders

- `docs/archive/` — Outdated, superseded, or archival documentation
- `data/obsolete/` — Large, obsolete, or sample data files
- `class_jsons/archive/` — Intermediate or legacy class parsing files
- `references/archive/` — Old or unused reference files
- `scripts/dev/` — Experimental or empty scripts
- `tests/legacy/` — Legacy or empty test files

**Maintenance Tip:** Periodically review these folders and delete files you are sure you will never need.

## File Naming Conventions

### Tests
- `

## Feature Status Summary (June 2025)

- Character Import: Fully functional in test scripts (JSON output, no raw HTML, correct mapping)
- Class Import: Main class data imports and parses; class features and spell import for classes are stubs/partial
- Spell Import Utility: Bulk spell import via `importSpells.ts` works and generates comprehensive spell JSON
- Enhanced Spell Parser: Successfully parses and analyzes spells, generating activities for all tested spells
- Bulk Spell Import via API: `importAllSpells` is a placeholder; not implemented in the main API
- Class Feature Import: `importClassFeatures` is a stub
- Compendium Linking & UI Dialogs: Only available in FoundryVTT environment
- Some scripts require CLI token, not just env var
- Monster Import: Not yet implemented (parser stub exists)
- Bulk Character Import: Not yet implemented

**Note:** All test scripts now work with the current codebase and .env setup, but some features are stubs or require FoundryVTT.