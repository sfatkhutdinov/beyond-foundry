# Beyond Foundry

A FoundryVTT module that imports your purchased D&D Beyond content into FoundryVTT. This module aims to provide comprehensive import functionality for all D&D Beyond content types while respecting content ownership and licensing.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FoundryVTT](https://img.shields.io/badge/FoundryVTT-v13-informational)](https://foundryvtt.com/)
[![D&D 5e](https://img.shields.io/badge/D%26D%205e-v5.0.0%2B-red)](https://foundryvtt.com/packages/dnd5e)

## ⚠️ Important Disclaimers

- **D&D Beyond API**: D&D Beyond does not provide a public API. This module uses web scraping techniques that may violate their Terms of Service. Use at your own risk.
- **Content Ownership**: This module only imports content you have purchased or have access to on D&D Beyond.
- **Account Safety**: Using automated tools to access D&D Beyond may risk account suspension.
- **Not Official**: This module is not affiliated with, endorsed, or sponsored by D&D Beyond or Wizards of the Coast.

## 🎯 Project Goals

Beyond Foundry aims to import the following D&D Beyond content types:

- **Characters**: Complete character sheets with all stats, features, and equipment
- **Monsters**: Full stat blocks with actions, legendary actions, and lair actions
- **Spells**: Complete spell descriptions with scaling and components
- **Items**: Equipment, magic items, and artifacts with full properties
- **Features & Traits**: Class features, racial traits, and feats
- **Backgrounds**: Character backgrounds with features and proficiencies
- **Races/Species**: Complete racial information with variants
- **Classes**: Class progression, features, and subclasses
- **Source Materials**: Rules references and game content
- **Adventures**: Complete adventures with maps, encounters, and handouts

## 🚧 Current Status

**This module is in early development.** The current codebase provides:
- ❌ Module architecture and structure
- ❌ Settings framework
- ❌ Logging system
- ❌ D&D Beyond authentication (not implemented)
- ❌ Content parsing (not implemented)
- ❌ Import functionality (not implemented)

## 🔧 Technical Approach

Due to the lack of a public D&D Beyond API, this module will require one of the following approaches:

### Option 1: Proxy Server (Recommended)
- A companion server application that handles D&D Beyond authentication
- Similar to [ddb-proxy](https://github.com/MrPrimate/ddb-proxy)
- Provides a clean API for the FoundryVTT module

### Option 2: Browser Extension
- A browser extension that extracts data from D&D Beyond pages
- Similar to [Beyond20](https://github.com/kakaroto/Beyond20)
- Communicates with FoundryVTT via local messaging

### Option 3: Direct Cookie Authentication
- Users provide their D&D Beyond session cookies
- Module makes authenticated requests directly
- Most complex due to CORS and security restrictions

## 📚 Similar Projects

This module draws inspiration from several existing projects:

- [ddb-importer](https://github.com/MrPrimate/ddb-importer) - The most comprehensive D&D Beyond importer
- [Beyond20](https://github.com/kakaroto/Beyond20) - Browser extension for D&D Beyond integration
- [ddb-adventure-muncher](https://github.com/MrPrimate/ddb-adventure-muncher) - Adventure content importer

Consider using these existing solutions if they meet your needs.

## 🛠️ Development

### Architecture Decisions Needed

Before contributing, please note these key decisions need to be made:

1. **Authentication Method**: Which approach (proxy, extension, or direct) to implement
2. **Data Parsing Strategy**: DOM parsing vs API interception
3. **Storage Architecture**: How to cache imported content
4. **Update Mechanism**: How to handle content synchronization

### Development Setup

```bash
# Clone the repository
git clone https://github.com/sfatkhutdinov/beyond-foundry.git
cd beyond-foundry

# Install dependencies
npm install

# Build the module
npm run build

# Start development
npm run dev
```

### Contributing

**Important**: Before contributing significant code, please:
1. Review existing solutions (ddb-importer, Beyond20)
2. Understand D&D Beyond's data structures
3. Familiarize yourself with FoundryVTT's API
4. Discuss major features in an issue first

### Technical Challenges

Contributors should be aware of these challenges:
- D&D Beyond frequently changes their site structure
- No official API means reverse-engineering data formats
- Complex data transformations between systems
- Authentication and session management
- Rate limiting and respectful scraping

## 📋 Roadmap

### Phase 1: Foundation (Current)
- [ ] Module structure and build system
- [ ] Basic settings and configuration
- [ ] Authentication method decision
- [ ] Proof of concept for data extraction

### Phase 2: Character Import
- [ ] Basic character stats and abilities
- [ ] Class and level information
- [ ] Skills and proficiencies
- [ ] Equipment and inventory

### Phase 3: Extended Content
- [ ] Spells and spellcasting
- [ ] Feats and features
- [ ] Character options and variants
- [ ] Homebrew content support

### Phase 4: Compendium Content
- [ ] Monster/NPC import
- [ ] Spell compendium
- [ ] Item database
- [ ] Rules references

### Phase 5: Advanced Features
- [ ] Adventure import
- [ ] Automated synchronization
- [ ] Batch operations
- [ ] Conflict resolution

## ⚖️ Legal Considerations

- This module does not include any D&D Beyond content
- Users must own or have access to content on D&D Beyond
- Web scraping may violate D&D Beyond's Terms of Service
- Use this module at your own risk
- Consider supporting D&D Beyond by purchasing content officially

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Acknowledgments

- **MrPrimate** for ddb-importer and showing what's possible
- **KaKaRoTo** for Beyond20 and the browser extension approach
- **D&D Beyond** for providing an excellent D&D toolset
- **FoundryVTT** community for continued support

## ⚠️ Disclaimer

This module is an independent project and is not affiliated with, endorsed, sponsored, or specifically approved by Wizards of the Coast LLC or D&D Beyond. Dungeons & Dragons, D&D, their respective logos, and all Wizards titles and characters are property of Wizards of the Coast LLC in the U.S.A. and other countries.

---

**Note**: This is an experimental project exploring D&D Beyond integration. For a production-ready solution, consider using [ddb-importer](https://github.com/MrPrimate/ddb-importer) which has years of development and community support.