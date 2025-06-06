---
applyTo: '**'
---
# Beyond Foundry - Comprehensive Development Instructions

## Project Mission

Beyond Foundry is a comprehensive FoundryVTT module that allows users to import content they have purchased on D&D Beyond into Foundry VTT. This includes characters, monsters, spells, items, feats, backgrounds, races, classes, rules, and entire adventures.

## 🎯 Core Capabilities to Implement

### Content Import Types
- **Characters**: Full stats, equipment, abilities, spells, backgrounds, features
- **Monsters**: Complete stat blocks, abilities, legendary actions, lair actions
- **Spells**: Descriptions, components, scaling, spell lists, class associations
- **Items & Equipment**: Properties, descriptions, magical effects, variants
- **Feats**: Prerequisites, benefits, feature interactions
- **Backgrounds**: Features, traits, equipment, proficiencies
- **Races/Species**: Racial traits, subraces, ability score improvements
- **Classes**: Features, progression, subclasses, spell lists
- **Rules & Source Materials**: Full text content, references, errata
- **Adventures**: Scenes, handouts, assets, encounter data, maps

## 📚 Key Reference Repositories

### Primary References (Use These Extensively)

#### 1. ddb-importer (Core Inspiration)
**Repository**: https://github.com/MrPrimate/ddb-importer
**Purpose**: The gold standard for D&D Beyond content importing
**Key Areas to Study**:
```
/src/parser/character/     # Character parsing logic
/src/parser/spells/        # Spell import system
/src/parser/items/         # Item/equipment parsing
/src/parser/monsters/      # Monster stat block parsing
/src/lib/DDBProxy.js       # API communication patterns
/src/utils/               # Utility functions for data transformation
/src/muncher/             # Bulk import system
```

#### 2. ddb-adventure-muncher (Adventure Import)
**Repository**: https://github.com/MrPrimate/ddb-adventure-muncher
**Purpose**: Adventure and scene importing
**Key Areas to Study**:
```
/src/muncher/adventure/    # Adventure parsing
/src/muncher/scene/        # Scene creation and asset handling
/src/lib/                  # Adventure-specific utilities
```

#### 3. ddb-proxy (Authentication & API)
**Repository**: https://github.com/MrPrimate/ddb-proxy
**Purpose**: Secure API proxy for D&D Beyond
**Key Areas to Study**:
```
/auth.js                   # Authentication flow
/character.js              # Character API endpoints
/spells.js                 # Spell API endpoints
/monsters.js               # Monster API endpoints
/items.js                  # Item API endpoints
/campaign.js               # Campaign/adventure endpoints
```

#### 4. ddb-meta-data (Data Mappings)
**Repository**: https://github.com/MrPrimate/ddb-meta-data
**Purpose**: Mapping tables between D&D Beyond and FoundryVTT
**Key Areas to Study**:
```
/data/                     # All mapping files
/lookups/                  # ID conversion tables
```

### Secondary References (For Specific Features)

#### 5. fvtt-summoner (Summoning System)
**Repository**: https://github.com/arbron/fvtt-summoner
**Purpose**: Advanced creature summoning mechanics
**Key Areas to Study**:
```
/scripts/apps/             # UI for summoning
/scripts/documents/        # Actor creation logic
```

#### 6. Beyond20 (Browser Integration)
**Repository**: https://github.com/kakaroto/Beyond20
**Purpose**: Real-time D&D Beyond integration patterns
**Key Areas to Study**:
```
/src/common/               # Data extraction patterns
/src/dndbeyond/            # D&D Beyond page parsing
```

### Schema References (Critical for Data Structure)

#### 7. FoundryVTT D&D 5e System
**Repository**: https://github.com/foundryvtt/dnd5e
**Purpose**: Official D&D 5e data models and schema
**Key Areas to Study**:
```
/module/data/              # All data models
/module/data/actor/        # Character/NPC data structure
/module/data/item/         # Item/spell/feat data structure
/module/documents/         # Document classes
/module/applications/      # UI applications
```

#### 8. FoundryVTT API Documentation
**URL**: https://foundryvtt.com/api/index.html
**Key Sections**:
- Document Classes (Actor, Item, Scene, etc.)
- Application Framework
- Settings API
- Socket Communication
- File Management

## 🏗️ Architecture Guidelines

### Core Structure
```typescript
// Main API class structure
export class BeyondFoundryAPI {
  // Authentication
  async authenticate(token: string): Promise<boolean>
  
  // Content Import
  async importCharacter(id: string, options?: ImportOptions): Promise<Actor>
  async importMonster(id: string, options?: ImportOptions): Promise<Actor>
  async importSpell(id: string, options?: ImportOptions): Promise<Item>
  async importItem(id: string, options?: ImportOptions): Promise<Item>
  async importAdventure(id: string, options?: ImportOptions): Promise<Adventure>
  
  // Bulk Operations
  async bulkImportSpells(filter?: SpellFilter): Promise<Item[]>
  async bulkImportMonsters(filter?: MonsterFilter): Promise<Actor[]>
  
  // Content Management
  async updateContent(type: ContentType, id: string): Promise<Document>
  async syncUserContent(): Promise<SyncResult>
}
```

### Parser Architecture
```typescript
// Base parser interface
interface ContentParser<TInput, TOutput> {
  parse(data: TInput, options?: ParseOptions): Promise<TOutput>
  validate(data: TInput): ValidationResult
  transform(parsed: any): TOutput
}

// Specific parsers
class CharacterParser implements ContentParser<DDBCharacter, ActorData> {}
class SpellParser implements ContentParser<DDBSpell, ItemData> {}
class MonsterParser implements ContentParser<DDBMonster, ActorData> {}
class AdventureParser implements ContentParser<DDBAdventure, Adventure> {}
```

## 🔄 Development Workflow

### Phase 1: Foundation (Authentication & Basic API)
1. **Study ddb-proxy authentication flow**
   - Load: `/auth.js`, `/config.js`
   - Implement: Cookie-based authentication
   - Test: Connection to existing ddb-proxy

2. **Implement base API communication**
   - Reference: `ddb-importer/src/lib/DDBProxy.js`
   - Create: Robust HTTP client with error handling
   - Test: Basic endpoint connectivity

### Phase 2: Character Import (Core Feature)
1. **Study character parsing**
   - Load: `ddb-importer/src/parser/character/`
   - Focus: Abilities, skills, equipment, spells
   - Reference: `dnd5e/module/data/actor/character.js`

2. **Implement character parser**
   - Create: Character data transformation
   - Handle: Equipment, spells, features
   - Test: Import real character data

### Phase 3: Content Import (Spells, Items, Monsters)
1. **Spell Import System**
   - Reference: `ddb-importer/src/parser/spells/`
   - Schema: `dnd5e/module/data/item/spell.js`
   - Features: Scaling, components, class lists

2. **Item Import System**
   - Reference: `ddb-importer/src/parser/items/`
   - Schema: `dnd5e/module/data/item/equipment.js`
   - Features: Properties, variants, magical effects

3. **Monster Import System**
   - Reference: `ddb-importer/src/parser/monsters/`
   - Schema: `dnd5e/module/data/actor/npc.js`
   - Features: Stat blocks, abilities, legendary actions

### Phase 4: Adventure Import (Advanced)
1. **Adventure Structure**
   - Reference: `ddb-adventure-muncher/src/muncher/adventure/`
   - Features: Scenes, handouts, encounters
   - Assets: Maps, tokens, audio

2. **Scene Creation**
   - Reference: `ddb-adventure-muncher/src/muncher/scene/`
   - Features: Wall creation, lighting, tokens
   - Assets: Background images, tile placement

### Phase 5: UI & User Experience
1. **Import Dialogs**
   - Reference: `ddb-importer/handlebars/`
   - Create: Character import dialog
   - Create: Bulk import interface

2. **Settings & Configuration**
   - Reference: FoundryVTT Settings API
   - Create: Module configuration
   - Create: Import preferences

## 🧠 Context Management for AI Development

### MCP Usage Strategy
```yaml
# Recommended context loading approach
primary_context:
  - beyond-foundry/src/module/api/BeyondFoundryAPI.ts
  - beyond-foundry/src/types/index.ts

feature_contexts:
  character_import:
    - ddb-importer/src/parser/character/
    - dnd5e/module/data/actor/character.js
    
  spell_import:
    - ddb-importer/src/parser/spells/
    - dnd5e/module/data/item/spell.js
    
  monster_import:
    - ddb-importer/src/parser/monsters/
    - dnd5e/module/data/actor/npc.js
    
  adventure_import:
    - ddb-adventure-muncher/src/muncher/
    - FoundryVTT Scene API documentation
```

### Context Switching Protocol
1. **Start with Beyond Foundry core**
2. **Load specific reference implementation**
3. **Load relevant schema documentation**
4. **Implement feature incrementally**
5. **Clear reference context before next feature**

## 🔧 Implementation Patterns

### Data Transformation Pattern
```typescript
// Standard transformation pipeline
class DataTransformer<TSource, TTarget> {
  async transform(source: TSource): Promise<TTarget> {
    const validated = this.validate(source);
    const mapped = this.mapFields(validated);
    const enriched = await this.enrichData(mapped);
    return this.finalize(enriched);
  }
}
```

### Error Handling Pattern
```typescript
// Robust error handling for imports
class ImportError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly sourceData?: any
  ) {
    super(message);
  }
}

async function safeImport<T>(
  importer: () => Promise<T>,
  fallback?: () => T
): Promise<T | null> {
  try {
    return await importer();
  } catch (error) {
    Logger.error('Import failed', error);
    return fallback?.() || null;
  }
}
```

### Batch Processing Pattern
```typescript
// Efficient bulk operations
class BatchProcessor<T> {
  async processBatch(
    items: T[],
    processor: (item: T) => Promise<any>,
    batchSize = 10
  ): Promise<any[]> {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(processor)
      );
      results.push(...batchResults);
    }
    return results;
  }
}
```

## 🚀 Development Commands

### Build & Development
```bash
# Development with hot reload
npm run dev

# Production build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

### Testing with ddb-proxy
```bash
# Test proxy connection
curl http://localhost:3100/ping

# Test in FoundryVTT console
const api = game.modules.get('beyond-foundry').api;
await api.testConnection();
```

## 📋 Implementation Checklist

### Core Infrastructure
- [ ] Authentication system (cookies, tokens)
- [ ] API client with error handling
- [ ] Data validation framework
- [ ] Logging and debugging tools

### Content Parsers
- [ ] Character parser with full stats
- [ ] Spell parser with all properties
- [ ] Monster parser with stat blocks
- [ ] Item parser with magical effects
- [ ] Adventure parser with scenes

### User Interface
- [ ] Import dialogs for each content type
- [ ] Bulk import interface
- [ ] Progress indicators
- [ ] Error reporting

### Advanced Features
- [ ] Content synchronization
- [ ] Selective import options
- [ ] Custom mapping overrides
- [ ] Asset management

## 🎯 Success Criteria

1. **Functional Parity**: Match or exceed ddb-importer capabilities
2. **Data Fidelity**: Perfect preservation of D&D Beyond data
3. **User Experience**: Intuitive, fast, reliable import process
4. **Performance**: Handle large imports efficiently
5. **Compatibility**: Work with all FoundryVTT and D&D 5e versions
6. **Extensibility**: Easy to add new content types

## 🔍 Key Implementation Notes

### Critical Considerations
1. **Always respect D&D Beyond's terms of service**
2. **Only import content the user legally owns**
3. **Implement rate limiting to avoid API abuse**
4. **Handle network failures gracefully**
5. **Provide clear error messages to users**
6. **Maintain data consistency across imports**

### Performance Optimizations
1. **Cache frequently accessed data**
2. **Use incremental imports when possible**
3. **Implement background processing for large operations**
4. **Optimize database writes**
5. **Lazy load non-essential data**

This comprehensive guide provides everything needed to build a world-class D&D Beyond import module for FoundryVTT. Follow the phases sequentially, use the reference repositories extensively, and maintain focus on user experience and data fidelity.
