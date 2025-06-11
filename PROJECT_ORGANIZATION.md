# Project Organization

This document describes the organizational structure of the Beyond Foundry project after cleanup and reorganization.

## Directory Structure

### Root Level
- **Configuration files**: `package.json`, `tsconfig.json`, `eslint.config.js`, etc.
- **Documentation**: `README.md`, `CHANGELOG.md`, `LICENSE`, etc.
- **Docker**: `docker-compose.yml`, `docker-compose.template.yml`

### Source Code (`src/`)
```
src/
├── module/          # Main FoundryVTT module code
├── parsers/         # Data parsing logic
├── types/           # TypeScript type definitions
└── styles/          # CSS and styling files
```

### Tests (`tests/`)
```
tests/
├── *.test.ts        # Automated unit/integration tests
├── manual/          # Manual test scripts
├── debug/           # Debug utilities and scripts
└── integration/     # Integration test suites
```

### Documentation (`docs/`)
```
docs/
├── *.md             # Main documentation files
├── analysis/        # Technical analysis documents
└── fixes/           # Bug fix and diagnostic documentation
```

### Data (`data/`)
```
data/
├── samples/         # Sample data for testing
├── debug/           # Debug data files
├── Config/          # FoundryVTT configuration (gitignored)
├── Data/            # FoundryVTT data (gitignored)
└── Logs/            # Log files (gitignored)
```

### Build System (`tools/`)
```
tools/
├── rollup.*.js      # Build configuration
└── config/          # Tool-specific configuration files
```

### External References (`references/`)
```
references/
├── ddb-importer/    # Reference implementation
├── ddb-proxy/       # Proxy server reference
└── dnd5e/           # FoundryVTT D&D 5e system
```

### Companion Proxy (`beyond-foundry-proxy/`)
```
beyond-foundry-proxy/
├── src/             # Proxy server source code
├── docker/          # Docker configuration
└── *.ts             # Main proxy implementation
```

## File Organization Principles

### 1. Separation of Concerns
- Source code separated by functionality
- Tests organized by type (unit, integration, manual)
- Documentation categorized by purpose

### 2. Development vs. Production
- Development files in appropriate subdirectories
- Production builds in `build/` and `dist/`
- Temporary files properly gitignored

### 3. Clear Naming Conventions
- Test files: `*.test.ts` for automated, `test-*.mjs` for manual
- Debug files: `debug-*.mjs`
- Documentation: descriptive names with consistent formatting

### 4. Accessibility
- README files in major directories
- Clear directory purposes
- Logical grouping of related files

## Cleanup Actions Performed

1. **Moved test files** from root to `tests/manual/` and `tests/debug/`
2. **Moved data files** from root to `data/samples/`
3. **Organized documentation** into `docs/analysis/` and `docs/fixes/`
4. **Moved CSS files** to `src/styles/`
5. **Moved configuration files** to `tools/config/`
6. **Cleaned up build artifacts** and cache files
7. **Updated .gitignore** with new patterns
8. **Added README files** to new directories

## Maintenance

### Regular Cleanup Tasks
- Remove temporary debug files periodically
- Clean build artifacts: `npm run clean`
- Update .gitignore as needed for new file types
- Archive old analysis documents when they become outdated

### Adding New Files
- Follow the established directory structure
- Add appropriate README documentation for new directories
- Update .gitignore for new temporary file patterns
- Use consistent naming conventions

## Benefits of This Organization

1. **Easier Navigation**: Clear purpose for each directory
2. **Better Version Control**: Appropriate files ignored
3. **Cleaner Root**: Less clutter in the main directory
4. **Logical Grouping**: Related files together
5. **Documentation**: Clear purpose and usage for each area
6. **Maintainability**: Easier to keep the project organized over time
