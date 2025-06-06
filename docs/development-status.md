# Beyond Foundry Development Setup

## Current Status: ✅ READY FOR DEVELOPMENT

The Beyond Foundry module structure is now set up and ready for development!

### What's Been Set Up

1. **📁 Project Structure**
   - ✅ TypeScript source files in `src/`
   - ✅ Module entry point: `src/module/beyond-foundry.ts` 
   - ✅ API class: `src/module/api/BeyondFoundryAPI.ts`
   - ✅ Type definitions: `src/types/index.ts`
   - ✅ Utilities: logger, settings, constants

2. **🔧 Build System**
   - ✅ Rollup + TypeScript compilation
   - ✅ Watch mode for development: `npm run build:watch`
   - ✅ Built files: `beyond-foundry.js`, `beyond-foundry.css`

3. **📊 Context7 Configuration**
   - ✅ Context management for AI development
   - ✅ Reference repositories loaded on-demand
   - ✅ Smart loading strategy configured

4. **🐳 Docker Integration Ready**
   - ✅ Settings for Docker proxy URL (`http://ddb-proxy:3000`)
   - ✅ Fallback to localhost proxy (`http://localhost:3100`)
   - ✅ Proxy connection testing built-in

## Quick Start

### For Developers

1. **Start development:**
   ```bash
   npm run build:watch  # Auto-rebuild on changes
   ```

2. **Test in FoundryVTT:**
   - Install the module in FoundryVTT
   - Enable debug mode in module settings
   - Open console and run: `game.modules.get('beyond-foundry').api.runConnectionTest()`

### For Docker Users

1. **Ensure services are running:**
   ```bash
   docker-compose up -d  # Should include ddb-proxy and foundry
   ```

2. **Test proxy connection:**
   ```bash
   curl http://localhost:3100/ping  # Should respond with proxy status
   ```

3. **In FoundryVTT, test the connection:**
   ```javascript
   // In F12 console
   const api = game.modules.get('beyond-foundry').api;
   await api.testProxyConnection();
   ```

## What's Next

Now you can start implementing the core features:

### 1. Authentication (Next Step)
- Test with existing ddb-proxy
- Implement Cobalt token handling
- Character list retrieval

### 2. Character Parsing
- Study `reference/ddb-importer/src/parser/character/`
- Implement basic ability score parsing
- Add character creation

### 3. Content Import
- Spells, items, equipment
- Compendium integration

## Available Scripts

```bash
npm run build         # Build once
npm run build:watch   # Watch and rebuild
npm run dev          # Alias for build:watch  
npm run lint         # Check code style
npm run type-check   # Check TypeScript without building
```

## Module API

The module exposes its API globally:

```javascript
// Access via FoundryVTT console
const api = game.modules.get('beyond-foundry').api;

// Test proxy connection
await api.testProxyConnection();

// Run full connection test
await api.runConnectionTest();

// Get character list (requires auth)
const characters = await api.getCharacterList();

// Import character (requires auth) 
const result = await api.importCharacter('characterId');
```

## File Structure Reference

```
src/
├── module/
│   ├── beyond-foundry.ts          # Main module entry
│   ├── constants.ts               # Module constants
│   ├── api/
│   │   └── BeyondFoundryAPI.ts    # Main API class  
│   ├── utils/
│   │   ├── logger.ts              # Logging utility
│   │   └── settings.ts            # Settings management
│   └── parsers/                   # Future parsers
└── types/
    ├── index.ts                   # Type definitions
    └── foundry-minimal.d.ts       # FoundryVTT globals
```

## Development Tips

1. **Use Context7** - Load relevant reference files as needed
2. **Test with Docker** - Use existing ddb-proxy for immediate testing
3. **Incremental Development** - Start with basic auth, then character basics
4. **Reference Implementation** - Study ddb-importer patterns
5. **Debug Mode** - Enable for detailed logging and test commands

---

🚀 **Ready to start developing!** The foundation is solid and ready for feature implementation.
