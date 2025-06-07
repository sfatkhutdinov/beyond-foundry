# Beyond Foundry - Project Organization

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

## File Naming Conventions

### Tests
- `test-*.js` - Feature tests
- `test-*.cjs` - CommonJS tests
- `validate-*.sh` - Validation scripts

### Scripts
- `analyze-*.js` - Analysis utilities
- `regenerate-*.js` - Data regeneration
- `debug-*.js` - Debug utilities

### Analysis Results
- `*-results/` - Analysis output directories
- `*-147239148.*` - Character-specific files (using character ID)

## Build Process

1. **Source** (`src/`) → **Build** (`build/`)
2. **Configuration**: `tools/rollup.config.js`
3. **Scripts**: 
   - `npm run build` - Single build
   - `npm run build:watch` - Watch mode
   - `npm run clean` - Clean build directory

## Working with the Structure

### Adding New Features
1. Source code goes in `src/module/` or `src/parsers/`
2. Types go in `src/types/`
3. Tests go in `tests/`
4. Documentation goes in `docs/`

### Running Tests
```bash
# Run specific test
node tests/test-api.js

# Run validation
bash tests/validate-final.sh

# Run analysis
node scripts/analyze-character.js
```

### Debugging
1. Debug scripts in `debug/`
2. Analysis results automatically saved to `analysis/`
3. Build outputs in `build/` (check `.map` files for source mapping)

## Maintenance

### Regular Cleanup
- `npm run clean` - Remove build artifacts
- `rm -rf debug/*.tmp` - Clean temporary debug files
- `rm -rf analysis/old-*` - Remove old analysis results

### Before Commits
1. Run `npm run lint:fix`
2. Run `npm run type-check`
3. Run `npm run build` to ensure no build errors
4. Check that only necessary files are staged

## Integration with Development Tools

### VS Code
- `.vscode/` settings respect this structure
- Build tasks use `tools/rollup.config.js`
- Debug configurations point to `build/` directory

### Docker
- `docker-compose.yml` mounts proper directories
- Build outputs in `build/` are accessible to containers

### Git
- `.gitignore` excludes generated files
- Only source code and documentation tracked
- Analysis results can be optionally tracked
