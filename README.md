# Beyond Foundry

Beyond Foundry is a FoundryVTT module that imports your purchased D&D Beyond content. This README provides an overview of the project, its purpose, development status, and setup instructions.

## ✨ Features

### 🎭 Character Import
- Complete character data import from D&D Beyond
- Comprehensive character sheet mapping to FoundryVTT D&D 5e system
- Support for all character levels, classes, races, and backgrounds

### 🪄 Spell Integration (NEW!)
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
- **Batch character import** support
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

...

See `docs/roadmap.md` for detailed progress and goals.
