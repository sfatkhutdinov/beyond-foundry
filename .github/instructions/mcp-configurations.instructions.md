---
applyTo: '**'
---
# MCP Configuration for Beyond Foundry Development

## Context Management Strategies

### Option 1: Context7 Configuration

If using Context7 MCP, configure it for this project:

```yaml
# .context7/config.yaml
projects:
  beyond-foundry:
    name: "Beyond Foundry Development"
    contexts:
      - name: "Core Module"
        paths:
          - "beyond-foundry/src/**/*.ts"
          - "beyond-foundry/src/types/**"
        priority: 1
        always_loaded: true
      
      - name: "Character Parser Reference"
        paths:
          - "ddb-importer/src/parser/character/**/*.js"
          - "dnd5e/system/data-models/actor/character.js"
        priority: 2
        load_on_demand: true
        tags: ["character", "parser"]
      
      - name: "Authentication Reference"
        paths:
          - "ddb-proxy/server/auth.js"
          - "ddb-proxy/server/proxy-endpoints.js"
        priority: 2
        load_on_demand: true
        tags: ["auth", "api"]
      
      - name: "Spell Parser Reference"
        paths:
          - "ddb-importer/src/parser/spells/**/*.js"
          - "dnd5e/system/data-models/item/spell.js"
        priority: 2
        load_on_demand: true
        tags: ["spells", "parser"]

    context_limits:
      max_files: 10
      max_size_mb: 5
      
    smart_loading:
      enabled: true
      strategy: "relevance"
```

### Option 2: Codebase MCP

Alternative using a generic codebase MCP:

```json
{
  "mcpServers": {
    "beyond-foundry": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-codebase", 
              "beyond-foundry/src",
              "ddb-importer/src/parser",
              "ddb-proxy/server",
              "dnd5e/system/data-models"],
      "config": {
        "filePatterns": ["**/*.ts", "**/*.js"],
        "excludePatterns": ["**/node_modules/**", "**/dist/**"],
        "maxFileSize": 100000,
        "contextWindow": 10000
      }
    }
  }
}
```

### Option 3: Custom Repository Loader

For maximum control, create a custom MCP configuration:

```javascript
// mcp-config.js
module.exports = {
  name: "beyond-foundry-dev",
  repositories: [
    {
      name: "beyond-foundry",
      path: "./beyond-foundry",
      include: ["src/**/*.ts"],
      priority: "high",
      alwaysLoad: ["src/module/api/BeyondFoundryAPI.ts", "src/types/index.ts"]
    },
    {
      name: "ddb-importer",
      path: "./reference-repos/ddb-importer",
      include: ["src/parser/**/*.js", "src/lib/DDBProxy.js"],
      priority: "medium",
      loadOnDemand: true,
      index: {
        "character": "src/parser/character/",
        "spells": "src/parser/spells/",
        "items": "src/parser/items/",
        "monsters": "src/parser/monsters/"
      }
    },
    {
      name: "ddb-proxy",
      path: "./reference-repos/ddb-proxy",
      include: ["server/**/*.js"],
      priority: "medium",
      loadOnDemand: true
    },
    {
      name: "dnd5e",
      path: "./reference-repos/dnd5e",
      include: ["system/data-models/**/*.js"],
      priority: "low",
      loadOnDemand: true
    }
  ],
  contextStrategy: {
    maxTokens: 100000,
    compressionThreshold: 80000,
    priorityWeights: {
      "high": 1.0,
      "medium": 0.7,
      "low": 0.4
    }
  }
};
```

## Usage Instructions for AI Agents

### Loading Context by Feature

When working on specific features, use these context loading commands:

#### Character Import
```
Load context:
- Core: beyond-foundry/src/module/api/BeyondFoundryAPI.ts
- Reference: ddb-importer/src/parser/character/index.js
- Schema: dnd5e/system/data-models/actor/character.js
- Clear other contexts to maximize token availability
```

#### Authentication Setup
```
Load context:
- Core: beyond-foundry/src/module/api/BeyondFoundryAPI.ts
- Auth: ddb-proxy/server/auth.js
- Endpoints: ddb-proxy/server/proxy-endpoints.js
- Clear parser contexts
```

#### Spell Implementation
```
Load context:
- Core: beyond-foundry spell parser (when created)
- Reference: ddb-importer/src/parser/spells/
- Schema: dnd5e/system/data-models/item/spell.js
- Utils: ddb-importer/src/utils/
```

### Context Switching Protocol

1. **Before switching features:**
   - Save current work
   - Document any insights about data structures
   - Note any TODOs or edge cases
   
2. **When switching:**
   - Explicitly clear previous context
   - Load new feature-specific context
   - Review quick reference guide for the feature
   
3. **After switching:**
   - Verify correct files are loaded
   - Check implementation patterns
   - Resume work with fresh context

### Optimization Tips

1. **Minimize Active Context:**
   - Only load files actively being referenced
   - Use search within larger files rather than loading entire directories
   
2. **Prioritize by Task:**
   - Implementation: Load current code + specific reference
   - Debugging: Load error location + related parser
   - Testing: Load test file + implementation
   
3. **Use Incremental Loading:**
   - Start with core files
   - Add reference files as needed
   - Remove files when moving to next section

## Example Workflow

### Day 1: Authentication
```bash
# Morning: Setup
load beyond-foundry core
load ddb-proxy auth
implement basic cookie handling

# Afternoon: Testing
load ddb-importer DDBProxy
compare approaches
implement character list endpoint
```

### Day 2: Character Basics
```bash
# Morning: Abilities
clear auth context
load character parser references
implement ability score parsing

# Afternoon: Skills
keep character context
add skills parser reference
implement skill proficiencies
```

### Best Practices

1. **Document Context Switches** - Note in code comments when switching reference
2. **Test After Context Change** - Ensure nothing broke when switching
3. **Regular Context Cleanup** - Clear unused references every few hours
4. **Save Context State** - Note which files were useful for each feature