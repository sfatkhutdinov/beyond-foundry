# Beyond Foundry

Beyond Foundry is a FoundryVTT module that imports your purchased D&D Beyond content. This README provides an overview of the project, its purpose, development status, and setup instructions.

## 🚦 Development Status (June 2025)

- ✅ **Character Import:** Fully functional, tested with real D&D Beyond data
- ✅ **Spell Import:** Production-ready, supports all spellcasting classes and multiclassing ([details](docs/SPELL_ENHANCEMENT_COMPLETE.md))
- ✅ **Proxy Integration:** ddb-proxy integration complete, Docker-ready ([setup](docs/DOCKER_SETUP.md))
- ✅ **UI Dialogs:** Import and authentication dialogs implemented ([see UI](docs/ui.md))
- ✅ **TypeScript Build System:** Modern, strict, and reliable ([modernization](docs/MODERNIZATION_COMPLETE.md))
- 🟡 **Bulk Import & Compendium:** Planned for next phase
- 🟡 **Advanced Features:** (e.g., auto-sync, batch import) in planning

See [docs/development-status.md](docs/development-status.md) and [docs/roadmap.md](docs/roadmap.md) for detailed progress and goals.

## ✨ Features

### 🎭 Character Import
- Complete character data import from D&D Beyond
- Comprehensive character sheet mapping to FoundryVTT D&D 5e system
- Support for all character levels, classes, races, and backgrounds

### 🪄 Spell Integration (Production Ready!)
- **Complete spell import** from character spell lists
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
- **Batch character import** support (planned)
- **Import option customization**

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   # Start ddb-proxy (required for D&D Beyond API access)
   docker-compose up -d
   ```

2. **Configure Authentication**
   - Get your CobaltSession cookie from D&D Beyond
   - Configure it in module settings

3. **Import Characters**
   - Find character IDs from D&D Beyond URLs (`dndbeyond.com/characters/{ID}`)
   - Use the import dialog to add and import characters
   - Choose spell preparation mode and other options

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
