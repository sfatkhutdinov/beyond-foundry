---
applyTo: '**'
---
# Beyond Foundry Quick Reference for AI Agents

## 🚀 Quick Start Checklist

When starting work on Beyond Foundry:
- [ ] Load Beyond Foundry current codebase
- [ ] Identify which feature to implement
- [ ] Load ONLY relevant reference code
- [ ] Check ddb-importer's implementation first
- [ ] Implement incrementally with testing

## 📁 Key File Locations

### Beyond Foundry (Current Project)
```
/src/module/api/BeyondFoundryAPI.ts    # Main API class - START HERE
/src/types/index.ts                     # TypeScript interfaces
/src/module/utils/                      # Utilities (logger, settings, socket)
```

### Docker Environment (if applicable)
```
# Proxy URL for Docker users
Internal: http://ddb-proxy:3000         # Container-to-container
External: http://localhost:3100         # Browser access

# Quick proxy test
curl http://localhost:3100/ping
```

### ddb-importer (Primary Reference)
```
# Character Parsing
/src/parser/character/index.js          # Main character parser
/src/parser/character/abilities.js      # Ability scores
/src/parser/character/skills.js         # Skills & proficiencies
/src/parser/character/spells.js         # Character spells
/src/parser/character/items.js          # Equipment

# Other Content
/src/parser/spells/                     # Spell compendium
/src/parser/items/                      # Item definitions
/src/parser/monsters/                   # Monster stat blocks

# Utilities
/src/lib/DDBProxy.js                    # API communication
/src/utils/                             # Helper functions
```

### ddb-proxy (Authentication)
```
/server/auth.js                         # Authentication flow
/server/proxy-endpoints.js              # Endpoint definitions
/server/schemas/                        # Data schemas
```

### FoundryVTT D&D 5e Schema
```
/system/data-models/actor/character.js  # Character data structure
/system/data-models/item/spell.js       # Spell data structure
/system/data-models/item/equipment.js   # Item data structure
```

## 🔧 Implementation Patterns

### Basic Parser Structure
```javascript
// In BeyondFoundryAPI.ts or new parser file
class CharacterParser {
  parse(ddbData: DDBCharacter): CharacterData {
    return {
      name: ddbData.name,
      type: "character",
      system: {
        abilities: this.parseAbilities(ddbData),
        attributes: this.parseAttributes(ddbData),
        details: this.parseDetails(ddbData),
        skills: this.parseSkills(ddbData),
        // ... continue for each section
      }
    };
  }
  
  private parseAbilities(ddbData: DDBCharacter) {
    // Reference: ddb-importer/src/parser/character/abilities.js
    // Map DDB stats to Foundry abilities
  }
}
```

### Common Mappings
```javascript
// Ability Score IDs (DDB -> Foundry)
const ABILITY_MAP = {
  1: 'str',  // Strength
  2: 'dex',  // Dexterity  
  3: 'con',  // Constitution
  4: 'int',  // Intelligence
  5: 'wis',  // Wisdom
  6: 'cha'   // Charisma
};

// Skill IDs (DDB -> Foundry)
const SKILL_MAP = {
  3: 'acr',   // Acrobatics
  11: 'ani',  // Animal Handling
  6: 'arc',   // Arcana
  // ... see ddb-importer/src/parser/character/skills.js
};
```

## 🎯 Feature Implementation Order

1. **Authentication** (Required First)
   - Context: Load ddb-proxy auth modules
   - Implement: Cookie/session handling
   - Test: Can fetch character list
   - **Docker Users**: Test with existing proxy first:
     ```javascript
     const response = await fetch('http://localhost:3100/ping');
     ```

2. **Basic Character Import**
   - Context: character parser files
   - Order: abilities → skills → HP → AC
   - Test: Level 1 character imports

3. **Character Equipment**
   - Context: items parser
   - Handle: Weapons, armor, gear
   - Test: Various equipment types

4. **Character Spells**
   - Context: spells parser  
   - Complex: Prepared vs known
   - Test: Different caster types

5. **Compendium Content**
   - Context: Specific content parsers
   - Order: Spells → Items → Monsters

## ⚡ Quick Commands

### Load Minimal Context
```
Load:
1. beyond-foundry/src/module/api/BeyondFoundryAPI.ts
2. beyond-foundry/src/types/index.ts
3. ddb-importer/src/parser/character/[specific-file].js
4. dnd5e/system/data-models/actor/character.js
```

### Test Implementation
```javascript
// Quick test in BeyondFoundryAPI
async testCharacterImport() {
  const mockData = { /* minimal DDB data */ };
  const parser = new CharacterParser();
  const result = parser.parse(mockData);
  console.log("Parsed:", result);
  // Validate against schema
}
```

## 🚨 Common Pitfalls

1. **Don't parse everything** - DDB data has lots of unused fields
2. **Check for null/undefined** - DDB data can be inconsistent
3. **Handle homebrew** - Custom content needs special handling
4. **Respect rate limits** - DDB will block rapid requests
5. **Cache when possible** - Reduce API calls

## 📝 Progress Tracking Template

When implementing a feature:
```markdown
## Feature: [Name]
- [ ] Studied ddb-importer implementation
- [ ] Created TypeScript interfaces
- [ ] Implemented basic parser
- [ ] Added error handling
- [ ] Tested with sample data
- [ ] Handled edge cases
- [ ] Updated documentation

Notes:
- DDB Format: [any discoveries]
- Edge Cases: [special handling needed]
- TODO: [future improvements]
```