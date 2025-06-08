---
applyTo: '**'
---

# CRITICAL: ALWAYS USE code-index-mcp with every command

# Beyond Foundry Development Instructions

## Project Overview

Beyond Foundry aims to be a comprehensive FoundryVTT module that imports D&D Beyond purchased content. This is a complex project that requires understanding D&D Beyond's data structures, FoundryVTT's API, and the D&D 5e system schema.

## Context Management Instructions for AI Agents

### Using MCPs (Model Context Protocol) for Long Context

This project requires analyzing multiple large repositories and implementing complex parsers. Use the following strategies:

#### 1. Context7 MCP Usage (or equivalent)
```
When working on this project:
1. Load the main Beyond Foundry codebase as primary context
2. Selectively load relevant sections from reference repositories:
   - For character parsing: Load ddb-importer's character parser modules
   - For authentication: Load ddb-proxy's auth handling
   - For adventures: Load ddb-adventure-muncher's scene parsing
3. Keep FoundryVTT D&D 5e schema documentation accessible
4. Maintain a working context of current implementation + relevant reference
```

#### 2. Context Chunking Strategy
Break the project into focused contexts:
- **Authentication Context**: beyond-foundry auth + ddb-proxy auth modules
- **Parser Context**: Current parser + corresponding ddb-importer parser
- **Schema Context**: FoundryVTT schema + D&D 5e system data models
- **UI Context**: FoundryVTT Applications API + existing UI implementations

#### 3. Reference Repository Analysis
When implementing a feature, follow this pattern:
```
1. First, analyze how ddb-importer implements the feature
2. Load only the relevant modules (e.g., parser/character/*.js)
3. Study the data transformation approach
4. Implement similar logic adapted to Beyond Foundry's architecture
```

#### 4. Incremental Development with Context
```
For each feature implementation:
1. Load current Beyond Foundry module structure
2. Load specific reference implementation (e.g., ddb-importer's spell parser)
3. Implement the feature
4. Clear reference context, load next reference
5. Repeat for next feature
```

### MCP-Specific Instructions

If using Context7 or similar MCP:
```yaml
context_loading_priority:
  1_always_loaded:
    - /src/beyond-foundry.ts
    - /src/module/api/BeyondFoundryAPI.ts
    - /src/types/index.ts
  
  2_feature_specific:
    character_import:
      - ddb-importer:/src/parser/character/index.js
      - ddb-importer:/src/parser/character/abilities.js
      - foundryvtt-dnd5e:/system/data-models/actor/character.js
    
    spell_import:
      - ddb-importer:/src/parser/spells/index.js
      - foundryvtt-dnd5e:/system/data-models/item/spell.js
    
    authentication:
      - ddb-proxy:/server/auth.js
      - ddb-proxy:/server/endpoints/
  
  3_reference_only:
    - Load as needed for specific implementation details
```

## Critical Understanding

### D&D Beyond API Limitations
1. **No Public API**: D&D Beyond does not provide a public API for accessing user content
2. **Authentication Required**: All content access requires user authentication
3. **Existing Solutions**: Review these repositories for implementation approaches:
   - [ddb-importer](https://github.com/MrPrimate/ddb-importer) - Primary character/content importer
   - [ddb-adventure-muncher](https://github.com/MrPrimate/ddb-adventure-muncher) - Adventure content importer
   - [ddb-proxy](https://github.com/MrPrimate/ddb-proxy) - Proxy server for API access
   - [ddb-meta-data](https://github.com/MrPrimate/ddb-meta-data) - Metadata extraction
   - [Beyond20](https://github.com/kakaroto/Beyond20) - Browser extension approach
   - [fvtt-summoner](https://github.com/arbron/fvtt-summoner) - Reference for creature summoning

### Reference Repository Study Pattern

When implementing features, use this systematic approach:

#### For ddb-importer (Primary Reference)
```
Key directories to study:
- /src/parser/ - All parsing logic organized by content type
- /src/muncher/ - Bulk import functionality
- /src/lib/ - Utility functions and helpers
- /src/effects/ - Active effect generation
- /data/ - Static data mappings

Implementation pattern:
1. Find the relevant parser (e.g., /src/parser/character/index.js)
2. Trace the data flow from raw DDB data to Foundry format
3. Note any special handling or edge cases
4. Adapt the approach to Beyond Foundry's architecture
```

#### For ddb-proxy (Authentication Reference)
```
Key components:
- /server/auth.js - Authentication flow
- /server/proxy-endpoints.js - API endpoint definitions
- /server/cors.js - CORS handling

Study the authentication flow and endpoint patterns
```

#### For Beyond20 (Alternative Approach)
```
Key insights:
- Content script injection patterns
- DOM parsing strategies
- Message passing between extension and page
- Real-time data extraction
```

## Technical Requirements

### 1. Authentication & Data Access

Choose ONE of these approaches:

#### Option A: Proxy Server Approach (Recommended)
- **Quick Start**: Use existing ddb-proxy if available (like in Docker setup)
- **Custom Proxy**: Implement a companion proxy server (like ddb-proxy)
- Handle authentication through the proxy
- Parse D&D Beyond's web interface
- Return structured JSON data

**Docker Users**: If you have ddb-proxy running (e.g., via docker-compose), you can immediately start using it:
```javascript
// Connect to existing ddb-proxy
const proxyUrl = 'http://localhost:3100'; // Or internal Docker address
```

#### Option B: Browser Extension
- Create a browser extension (like Beyond20)
- Inject scripts into D&D Beyond pages
- Extract data directly from the DOM
- Communicate with FoundryVTT via postMessage

#### Option C: Cookie/Session Approach
- Require users to provide session cookies
- Make authenticated requests from the module
- Handle CORS and security restrictions

### 2. Data Extraction

Implement parsers for each content type:

#### Characters
```javascript
// Parse character data from D&D Beyond format
class CharacterParser {
  parseCharacter(ddbData) {
    return {
      name: ddbData.name,
      system: {
        abilities: this.parseAbilities(ddbData.stats),
        attributes: this.parseAttributes(ddbData),
        details: this.parseDetails(ddbData),
        traits: this.parseTraits(ddbData),
        // ... etc
      }
    };
  }
}
```

#### Required Parsers
- `CharacterParser` - Full character import
- `MonsterParser` - Creature stat blocks
- `SpellParser` - Spell data and scaling
- `ItemParser` - Equipment and magic items
- `FeatParser` - Feats and features
- `BackgroundParser` - Character backgrounds
- `RaceParser` - Races and subraces
- `ClassParser` - Class features and progression
- `RuleParser` - Game rules and references
- `AdventureParser` - Adventure content and scenes

### 3. Data Transformation

Map D&D Beyond data to FoundryVTT D&D 5e schema:

```javascript
// Reference the D&D 5e system documentation
// https://github.com/foundryvtt/dnd5e

// Example ability score mapping
const mapAbilityScores = (ddbStats) => {
  const abilities = {};
  const abilityMap = {
    1: 'str', 2: 'dex', 3: 'con',
    4: 'int', 5: 'wis', 6: 'cha'
  };
  
  ddbStats.forEach(stat => {
    const ability = abilityMap[stat.id];
    if (ability) {
      abilities[ability] = {
        value: stat.value,
        proficient: stat.proficient || 0,
        // Calculate modifiers, saving throws, etc.
      };
    }
  });
  
  return abilities;
};
```

### 4. FoundryVTT Integration

Use the FoundryVTT API correctly:
```javascript
// Reference: https://foundryvtt.com/api/

// Create actors with proper data structure
const createActor = async (characterData) => {
  const actorData = {
    name: characterData.name,
    type: "character",
    system: characterData.system,
    items: [], // Will be populated with items
    flags: {
      "beyond-foundry": {
        characterId: characterData.id,
        lastSync: Date.now()
      }
    }
  };
  
  return await Actor.create(actorData);
};
```

### 5. Content Type Implementations

#### Characters
- Parse ability scores, skills, proficiencies
- Import class levels and features
- Handle multiclassing
- Import spells with prepared/known states
- Import inventory with attunement
- Parse custom modifications and homebrew

#### Monsters
- Parse stat blocks including legendary actions
- Import spell lists and innate spellcasting
- Handle variant rules and options
- Create appropriate token configurations

#### Spells
- Parse spell descriptions and effects
- Handle upcasting and scaling
- Import components and materials
- Support class spell lists

#### Items
- Parse item properties and descriptions
- Handle magic item attunement
- Import custom items and homebrew
- Support container relationships

#### Adventures
- Parse adventure structure and chapters
- Import scenes with walls and lighting
- Extract handouts and journal entries
- Handle encounter setups

### 6. Implementation Priorities

1. **Phase 1: Core Infrastructure**
   - Authentication mechanism
   - Basic data extraction
   - Character import (basic stats only)

2. **Phase 2: Complete Characters**
   - Full character features
   - Spells and spell slots
   - Equipment and inventory
   - Character options and choices

3. **Phase 3: Content Library**
   - Spell compendium import
   - Monster manual import
   - Item database import
   - Feat and background import

4. **Phase 4: Advanced Features**
   - Adventure import
   - Homebrew content support
   - Sync functionality
   - Conflict resolution

### 7. Error Handling

Implement robust error handling:
```javascript
class ImportError extends Error {
  constructor(message, type, details) {
    super(message);
    this.type = type; // 'auth', 'parse', 'create', etc.
    this.details = details;
  }
}

// Wrap all imports in try-catch
try {
  const data = await fetchCharacterData(id);
  const parsed = await parseCharacterData(data);    
  const actor = await createActor(parsed);
} catch (error) {
  if (error.type === 'auth') {
    ui.notifications.error('Authentication failed. Please check your credentials.');
  }
  // Log detailed error for debugging
  console.error('Import failed:', error);
}
```

### 8. User Interface Requirements

Create intuitive UI components:
- Import wizard with content type selection
- Progress indicators for long imports
- Authentication configuration dialog
- Sync conflict resolution interface
- Batch import for multiple items

### 9. Performance Considerations

- Implement chunked imports for large datasets
- Add caching for frequently accessed data
- Use web workers for parsing if needed
- Implement progress reporting via sockets

### 10. Testing Requirements

- Unit tests for all parsers
- Integration tests with mock D&D Beyond data
- End-to-end tests with real content
- Performance benchmarks for large imports

## Code Quality Standards

1. **TypeScript**: Maintain strict type safety
2. **Error Handling**: Never fail silently
3. **Logging**: Comprehensive debug logging
4. **Documentation**: Document all data transformations
5. **Modularity**: Keep parsers and transformers separate

## Legal Considerations

1. **Terms of Service**: Ensure compliance with D&D Beyond ToS
2. **Rate Limiting**: Implement respectful request throttling
3. **Caching**: Cache data appropriately to minimize requests
4. **Attribution**: Credit original content sources

## Resources

- [D&D 5e System Documentation](https://github.com/foundryvtt/dnd5e)
- [FoundryVTT API](https://foundryvtt.com/api/)
- [ddb-importer Wiki](https://github.com/MrPrimate/ddb-importer/wiki)
- [D&D Beyond HTML Structure Analysis](https://github.com/MrPrimate/ddb-importer)

## Development Workflow

1. Start by studying the existing implementations
2. Set up a test environment with sample D&D Beyond content
3. Implement one parser at a time, starting with characters
4. Test thoroughly with various content configurations
5. Document any D&D Beyond format changes discovered
6. Create comprehensive error messages for users

## Implementation Guidance for AI Agents

### Phase-by-Phase Development Approach

#### Phase 1: Foundation Setup
```
1. Analyze ddb-proxy authentication flow:
   - Load ddb-proxy:/server/auth.js
   - Study cookie handling and session management
   - Implement similar auth in BeyondFoundryAPI.ts

2. Create basic data fetching:
   - Study ddb-importer:/src/lib/DDBProxy.js
   - Implement character data endpoint
   - Add proper error handling

3. Validate connection:
   - Test with a simple character fetch
   - Ensure auth tokens work correctly
```

#### Phase 2: Character Parser Implementation
```
1. Load context for character parsing:
   - beyond-foundry:/src/types/index.ts (for interfaces)
   - ddb-importer:/src/parser/character/index.js
   - foundryvtt-dnd5e:/system/data-models/actor/character.js

2. Implement step by step:
   - Start with ability scores (simplest)
   - Add skills and proficiencies
   - Implement HP and other attributes
   - Add class information
   - Import equipment
   - Handle spells last (most complex)

3. For each subsystem:
   - Study ddb-importer's implementation
   - Map DDB format to Foundry format
   - Test with various character builds
```

#### Phase 3: Extended Content
```
Follow similar patterns for:
- Spells: Reference ddb-importer:/src/parser/spells/
- Items: Reference ddb-importer:/src/parser/items/
- Monsters: Reference ddb-importer:/src/parser/monsters/
```

### Code Implementation Patterns

When implementing any parser:
```javascript
// 1. Always start with type definitions
interface DDBSpellData {
  // Study ddb-importer to understand structure
}

// 2. Create a parser class
class SpellParser {
  // 3. Break down parsing into logical methods
  parseSpell(ddbSpell: DDBSpellData): Partial<SpellData> {
    return {
      name: this.parseName(ddbSpell),
      system: {
        level: this.parseLevel(ddbSpell),
        school: this.parseSchool(ddbSpell),
        // ... etc
      }
    };
  }
  
  // 4. Handle edge cases found in ddb-importer
  private parseLevel(ddbSpell: DDBSpellData): number {
    // Check ddb-importer for special handling
  }
}

// 5. Always validate output against D&D 5e schema
```

### Testing Strategy
```
For each implemented feature:
1. Create test data based on ddb-importer's test cases
2. Test edge cases found in reference implementations
3. Validate against FoundryVTT D&D 5e schema
4. Test with real D&D Beyond data
```

## Success Criteria

The module is successful when it can:
1. Import a complete character with all features
2. Import monsters with full stat blocks
3. Import spells with proper formatting
4. Import items with all properties
5. Handle authentication securely
6. Provide clear error messages
7. Support batch imports
8. Maintain data fidelity

## AI Agent Specific Directives

### Context Management Rules
1. **Never try to implement everything at once** - Focus on one parser/feature at a time
2. **Always reference existing implementations** - Don't reinvent what ddb-importer has solved
3. **Load only necessary context** - Don't overload with entire repositories
4. **Document context switches** - Note when switching between reference implementations

### Implementation Rules
1. **Start with data analysis** - Always examine DDB data structure first
2. **Map incrementally** - Build parsers field by field, testing each
3. **Preserve ddb-importer patterns** - Their solutions handle many edge cases
4. **Type everything** - Use TypeScript interfaces for all DDB data structures
5. **Comment edge cases** - Document why specific handling exists

### Quality Checks
1. **Compare outputs** - Your parsed data should match ddb-importer's results
2. **Validate schemas** - Always check against FoundryVTT D&D 5e requirements
3. **Test comprehensively** - Use varied character builds, items, spells
4. **Handle failures gracefully** - Never let the import crash

### Repository Reference Priority
When implementing a feature, check repositories in this order:
1. **ddb-importer** - Primary reference for all parsing logic
2. **ddb-proxy** - For authentication and API patterns
3. **foundryvtt/dnd5e** - For correct data schemas
4. **ddb-meta-data** - For static data mappings
5. **Beyond20** - Only if considering browser extension approach

### Progress Tracking
After implementing each feature:
1. Update the module's README with actual status
2. Document any deviations from ddb-importer's approach
3. Note any D&D Beyond format changes discovered
4. Create issues for edge cases that need future attention