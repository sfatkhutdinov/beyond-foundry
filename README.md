# Beyond Foundry

> **Note:** This is the **main and canonical repository** for Beyond Foundry. All development, issues, and releases are tracked here.
> 
> **Repository Status:**
> - ✅ **Directory organization complete** (June 10, 2025)
> - ✅ All test files moved to `tests/manual/` and `tests/debug/`
> - ✅ Sample data organized in `data/samples/`
> - ✅ Documentation structured in `docs/analysis/` and `docs/fixes/`
> - ✅ Styles moved to `src/styles/` with updated module.json
> - ✅ Configuration files organized in `tools/config/`
> - ✅ Updated .gitignore with new directory patterns
> - ✅ Comprehensive README files added to all new directories
> - **IMPORTANT:** The main branch is protected on GitHub. If you need to remove large files from history, you must temporarily disable branch protection to allow a force-push, or contact GitHub support for assistance. See NEXT_STEPS.md for details.
> - To prevent future issues, ensure `.gitignore` excludes all large binary files and archives (see below).

## 2025-06-12: Class Importer & Proxy Directory Overhaul

- **Class Importer Overhaul:**
  - The class importer now robustly parses D&D Beyond class HTML, extracting all core traits, features, progression tables, and subclasses with high fidelity.
  - Extraction logic is tightly coupled to the actual HTML structure, ensuring reliable and future-proof imports.
  - All outputs are now clean, canonical JSON—**no raw HTML is included in the output** (the `rawHtml` debug field has been removed).
  - Subclass, feature, and progression extraction is now complete and type-safe.
- **Proxy Directory Fix:**
  - The `beyond-foundry-proxy` directory is now a regular, fully tracked directory in the main repository (not a broken submodule).
  - All proxy code, including `src/class.ts`, is now versioned and tracked with the main repo, ensuring all updates are visible and shareable.
  - Developers should now update, commit, and push changes to proxy code as with any other part of the repo.
- **Recommended Workflow:**
  - Make changes to proxy code in `beyond-foundry-proxy/` as needed.
  - Rebuild the Docker container and test endpoints after any parser or proxy update.
  - All changes will be tracked and versioned by git, and can be reviewed in PRs or via `git log`.

Beyond Foundry is a FoundryVTT module that imports your purchased D&D Beyond content. This README provides an overview of the project, its purpose, development status, and setup instructions.

## 🚦 Development Status (June 2025)

- ✅ **Character Import:** Fully functional, tested with real D&D Beyond data
- ✅ **Spell Import:** Production-ready, supports all spellcasting classes and multiclassing ([details](docs/SPELL_ENHANCEMENT_COMPLETE.md))
- ✅ **Proxy Integration:** ddb-proxy integration complete, Docker-ready
- ✅ **UI Dialogs:** Import and authentication dialogs implemented ([see UI](docs/ui.md))
- ✅ **TypeScript Build System:** Modern, strict, and reliable ([modernization](docs/MODERNIZATION_COMPLETE.md))
- ✅ **Bulk Import & Compendium:** Spell and item bulk import with canonical compendium linking (requires cobalt token)
- ✅ **Equipment & Items:** Basic import with compendium linking (advanced features planned)
- 🟡 **Advanced Features:** Auto-sync, batch import, selective import in planning
- ❌ **Monster Import:** Not yet implemented (parser stub exists)
- ❌ **Bulk Character Import:** Not yet implemented

See [docs/development-status.md](docs/development-status.md) and [docs/roadmap.md](docs/roadmap.md) for detailed progress and goals.

## ⚠️ Large File Handling & .gitignore

- All large files (e.g., FoundryVTT zips, cache, binaries) **must not** be committed to git. Use `.gitignore` to exclude them.
- If a large file is accidentally committed, follow the instructions in NEXT_STEPS.md to remove it from history.
- Consider using [Git LFS](https://git-lfs.github.com/) for any required large assets.

## ✨ Features

### 🎭 Character Import
- Complete character data import from D&D Beyond
- Comprehensive character sheet mapping to FoundryVTT D&D 5e system
- Support for all character levels, classes, races, and backgrounds
- **Enhanced class import:** All FoundryVTT class schema fields mapped, proxy enrichment, homebrew flag support

### 🧙‍♂️ Spell Integration (Production Ready!)
- **Complete spell import** from character spell lists
- **Canonical compendium linking**: Spells are now linked to a single compendium entry, preventing duplicates
- **Bulk spell import**: Populate the compendium with all D&D Beyond spells in one step
- **Advanced spell parsing** with proper FoundryVTT formatting
- **Spell preparation modes**: Prepared, Pact Magic, Always Prepared, At Will, Innate
- **Scaling formulas** and higher level effects
- **Component parsing** (verbal, somatic, material, focus)
- **Duration, range, and area of effect** calculations
- **School mapping** and spell validation

### 🛡️ Equipment & Items
- Item import with proper categorization
- Equipment mapping to FoundryVTT item types
- Inventory management integration

### 🔐 Authentication & Proxy Support
- Secure authentication via ddb-proxy
- Cookie-based session management
- Multi-user support

### 🎛️ User Interface
- **Enhanced import dialog** with spell import options
- **Real-time import progress** tracking
- **Bulk spell import** and canonical compendium linking
- **Batch character import** support (planned)
- **Import option customization**

### 📚 Class Import (NEW)
- Import D&D Beyond class data (features, subclasses, spell lists) via the `/proxy/classes` endpoint
- Uses ddb-proxy Docker setup for secure, authenticated extraction
- Output is saved as canonical JSON (see `zzzOutputzzz/bard-class.json` for example)
- See [docs/parsers.md](docs/parsers.md) for parser details and [FOUNDRY_TESTING.md](docs/FOUNDRY_TESTING.md) for proxy setup

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   # Start ddb-proxy (required for D&D Beyond API access)
   docker-compose up -d
   ```

2. **Configure Authentication**
   - Get your CobaltSession cookie from D&D Beyond
   - Configure it in module settings

3. **Import Characters & Spells**
   - Find character IDs from D&D Beyond URLs (`dndbeyond.com/characters/{ID}`)
   - Use the import dialog to add and import characters
   - Choose spell preparation mode and other options
   - Use bulk spell import to populate the compendium

4. **Test Integration**
   ```javascript
   // In FoundryVTT console
   game.modules.get("beyond-foundry").api.runConnectionTest()
   ```

## 📚 Documentation

- **[Development Status](docs/development-status.md)** - Current progress and feature checklist
- **[Roadmap](docs/roadmap.md)** - Planned features and phases
- **[Spell Enhancement](docs/SPELL_ENHANCEMENT_COMPLETE.md)** - Spell import details
- **[Project Organization](docs/project-organization.md)** - Directory structure and file organization
- **[Development Setup](docs/setup.md)** - Getting started with development
- **[Authentication Guide](docs/authentication.md)** - Setting up D&D Beyond authentication
- **[Parser Documentation](docs/parsers.md)** - Understanding the parsing system, modular parser architecture, interface conventions, and advanced feature stubs (see ItemParser and FeatureParser for TODOs on homebrew flags, enhanced properties, and system fields)
- **[Quick Reference](docs/quick-reference.md)** - Developer quick reference
- **[UI Components](docs/ui.md)** - Import and authentication dialogs
- **[Docker Setup](docs/DOCKER_SETUP.md)** - Running with Docker and ddb-proxy
- See [docs/CHARACTER_IMPORT_GUIDE.md](docs/CHARACTER_IMPORT_GUIDE.md) for schema mapping and enrichment notes

## Documentation Index

- [Project Organization](docs/project-organization.md): Directory structure, proxy rationale, and release milestones
- [Architecture](docs/architecture.md)
- [Authentication](docs/authentication.md)
- [Development Status](docs/development-status.md)
- [FOUNDRY_INTEGRATION_GUIDE](docs/FOUNDRY_INTEGRATION_GUIDE.md)
- [FOUNDRY_TESTING](docs/FOUNDRY_TESTING.md)
- [Legal](docs/legal.md)
- [Parsers](docs/parsers.md)
- [Quick Reference](docs/quick-reference.md)
- [Roadmap](docs/roadmap.md)
- [Setup](docs/setup.md)
- [SPELL_ENHANCEMENT_COMPLETE](docs/SPELL_ENHANCEMENT_COMPLETE.md)
- [Testing](docs/testing.md)
- [UI](docs/ui.md)

## ✨ Canonical Spell Compendium Linking & Bulk Import

Beyond Foundry now uses a canonical compendium for all spells:
- When importing a character, spells are linked to a single compendium entry (by DDB ID or name) instead of creating duplicate embedded items.
- You can bulk import all D&D Beyond spells into a compendium for fast, consistent spell access.
- The character import workflow will reference compendium spells where possible, falling back to embedded items only if a compendium entry is missing.

### How to Bulk Import Spells to a Compendium

**Note**: This feature requires a valid Cobalt session token.

1. Open the FoundryVTT console (F12).
2. Run:
   ```javascript
   // Replace with your actual cobalt token and compendium name
   const cobaltToken = "your_cobalt_session_token_here";
   await game.modules.get("beyond-foundry").api.bulkImportSpellsToCompendium(cobaltToken, "beyondfoundry.spells");
   ```
3. Wait for the import to complete. All D&D Beyond spells will be available in the compendium.

**Important**: You must provide your D&D Beyond Cobalt session token as the first parameter.

### How Character Spell Import Works Now
- When importing a character, Beyond Foundry checks the compendium for each spell (by DDB ID or name).
- If found, the actor is linked to the compendium spell (no duplicate embedded item is created).
- If not found, the spell is imported as an embedded item (rare).
- This ensures all spells reference a single, canonical source.

### Developer Notes
- The compendium workflow uses dynamic Foundry API access (`as any`) for compatibility with v10/v11+.
- See `src/module/api/BeyondFoundryAPI.ts` for implementation details.

## 🛡️ Canonical Item Compendium Linking & Bulk Import

Beyond Foundry now uses a canonical compendium for all items, mirroring the spell import system:
- When importing a character, items are linked to a single compendium entry (by DDB ID) instead of creating duplicate embedded items.
- You can bulk import all D&D Beyond items into a compendium for fast, consistent item access.
- The character import workflow will reference compendium items where possible, falling back to embedded items only if a compendium entry is missing.
- All imported items must include `flags['beyond-foundry'].ddbId` for compendium matching and linking.

### How to Bulk Import Items to a Compendium

**Note**: This feature requires a valid Cobalt session token.

1. Open the FoundryVTT console (F12).
2. Run:
   ```javascript
   // Replace with your actual cobalt token and compendium name
   const cobaltToken = "your_cobalt_session_token_here";
   await game.modules.get("beyond-foundry").api.bulkImportItemsToCompendium(cobaltToken, "beyondfoundry.items");
   ```
3. Wait for the import to complete. All D&D Beyond items will be available in the compendium.

**Important**: You must provide your D&D Beyond Cobalt session token as the first parameter.

### How Character Item Import Works Now
- When importing a character, Beyond Foundry checks the compendium for each item (by DDB ID).
- If found, the actor is linked to the compendium item (no duplicate embedded item is created).
- If not found, the item is imported as an embedded item (rare).
- This ensures all items reference a single, canonical source.

### Developer Notes
- The compendium workflow uses dynamic Foundry API access (`as any`) for compatibility with v10/v11+.
- See `src/module/api/BeyondFoundryAPI.ts` for implementation details, including the new `bulkImportItemsToCompendium` and `addItemsToActor` helpers.
- The canonical item structure for FoundryVTT is more detailed than the analysis output and must include all required fields for compendium linking and Foundry integration.
- The analysis output (e.g., `comprehensive-analysis-*.json`) is for debugging/validation and is intentionally simpler than the final import structure.

## Development & Context Management Instructions

See [.github/instructions/development-context-management.instructions.md](.github/instructions/development-context-management.instructions.md) for consolidated instructions on:
- Context management (MCP/Context7)
- Quick references for AI agents and developers
- Best practices for context switching and feature development

## Docker & Proxy Testing Workflow

See [.github/instructions/docker-proxy-workflow.instructions.md](.github/instructions/docker-proxy-workflow.instructions.md) for all Docker, proxy, and containerized development/testing instructions.

## 🛠️ Development

### Project Structure
```
src/                   # Source code
├── module/           # Core module files
├── parsers/          # D&D Beyond data parsers
└── types/            # TypeScript definitions

build/                # Compiled output
tests/                # Test files
scripts/              # Utility scripts
docs/                 # Documentation
analysis/             # Character analysis results
```

### Build Commands
```bash
npm run build         # Build once
npm run build:watch   # Build and watch for changes
npm run clean         # Clean build directory
npm run lint          # Check code style
npm run type-check    # Validate TypeScript
```

### Maintenance
```bash
# Run project maintenance
./scripts/maintain-project.sh
```

See `docs/roadmap.md` for detailed progress and goals.

## 🐳 Docker/Proxy Authentication: Baking in Your Cobalt Cookie

For local development and terminal-based testing, you can bake your D&D Beyond Cobalt cookie into the proxy Docker container. This allows you to test endpoints without passing the token in every request.

### How to Use

1. **Set the `COBALT_COOKIE` environment variable** when running the proxy container. You can do this in two ways:

   - **Via `.env` file** (recommended for local dev):
     1. Create a file named `.env` in the `beyond-foundry-proxy/` directory (or project root).
     2. Add this line (replace with your actual token):
        ```env
        COBALT_COOKIE=your_cobalt_session_token_here
        ```
     3. The `docker-compose.yml` is already configured to load this variable.

   - **Via shell environment variable**:
     ```sh
     export COBALT_COOKIE=your_cobalt_session_token_here
     docker-compose up -d
     ```

2. **Restart the proxy container** after setting the variable:
   ```sh
   docker-compose down && docker-compose up -d
   ```

3. **Test endpoints** without passing a token in the body:
   ```sh
   curl -X POST http://localhost:4000/proxy/auth
   ```
   If the cookie is set, you should get a success response.

**Security Note:** Never commit your `.env` file or Cobalt token to version control. `.env` is already in `.gitignore`.
