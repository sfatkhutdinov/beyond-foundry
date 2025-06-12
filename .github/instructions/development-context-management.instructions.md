# Beyond Foundry Development & Context Management Instructions

## Overview
This document consolidates all essential instructions for development workflows, context management (including MCP/Context7), and quick references for both developers and AI agents working on Beyond Foundry.

---

## 1. Project Context Management (MCP/Context7)

### Context Management Strategies
- Use Model Context Protocols (MCP) or Context7 for large/multi-repo work.
- Always minimize loaded context to only what is relevant for the current feature.

#### Example Context7 Configuration
```yaml
# .context7/config.yaml
projects:
  beyond-foundry:
    name: "Beyond Foundry Development"
    contexts:
      - name: "Core Module"
      - name: "Character Parser Reference"
      - name: "Authentication Reference"
      - name: "Spell Parser Reference"
    context_limits:
      max_files: 10
      max_size_mb: 5
    smart_loading:
      enabled: true
      strategy: "relevance"
```

#### Example Custom MCP Loader
```javascript
// mcp-config.js
module.exports = {
  name: "beyond-foundry-dev",
  repositories: [
    { name: "beyond-foundry", path: "./beyond-foundry", alwaysLoad: ["src/module/api/BeyondFoundryAPI.ts", "src/types/index.ts"] },
    { loadOnDemand: true }
  ],
  contextStrategy: {
    maxTokens: 100000,
    compressionThreshold: 80000,
    priorityWeights: { /* ... */ }
  }
};
```

### Context Loading by Feature
- Character Import: beyond-foundry/src/module/api/BeyondFoundryAPI.ts, ddb-importer/src/parser/character/index.js, dnd5e/system/data-models/actor/character.js
- Authentication: beyond-foundry/src/module/api/BeyondFoundryAPI.ts, ddb-proxy/server/auth.js, ddb-proxy/server/proxy-endpoints.js
- Spell Implementation: beyond-foundry spell parser (when created), ddb-importer/src/parser/spells/, dnd5e/system/data-models/item/spell.js
- Class Implementation: beyond-foundry-proxy/src/class.ts, ddb-importer/src/parser/class/, dnd5e/system/data-models/class/

#### Context Switching Protocol
1. Save current work and document insights/TODOs.
2. Clear previous context before switching features.
3. Load only new feature-specific context.
4. Test after context change.
5. Regularly clean up unused references.

---

## 2. Quick Reference for AI Agents & Developers

### Quick Start Checklist
- Load Beyond Foundry codebase
- Identify feature to implement
- Load only relevant reference code
- Check ddb-importer implementation first
- Implement incrementally with testing

### Key File Locations
- Beyond Foundry: src/module/api/BeyondFoundryAPI.ts, src/types/index.ts, src/module/utils/
- Reference Projects: ddb-importer/src/parser/character/index.js, ddb-importer/src/parser/spells/, ddb-proxy/server/auth.js, foundryvtt-dnd5e/system/data-models/

### Implementation Patterns
- Study ddb-importer for each feature first.
- Use mapping tables for DDB → Foundry conversions.
- Implement parsers incrementally, test with real data.

#### Example: Ability Score Mapping
```js
const ABILITY_MAP = { 1: 'str', 2: 'dex', 3: 'con', 4: 'int', 5: 'wis', 6: 'cha' };
```

### Progress Tracking Template
```markdown
## Feature: [Name]
- [ ] Studied ddb-importer implementation
- [ ] Created TypeScript interfaces
- [ ] Implemented basic parser
- [ ] Added error handling
- [ ] Tested with sample data
- [ ] Handled edge cases
- [ ] Updated documentation
- [ ] Removed raw HTML from output (if applicable)
- [ ] Added complete feature/subclass/progression extraction (if applicable)
Notes:
- DDB Format: [discoveries]
- Edge Cases: [special handling]
- TODO: [future improvements]
- HTML Parsing: [specific parsing strategies]
- Feature Extraction: [extraction patterns]
```

---

## 3. Best Practices & Optimization
- Minimize active context: Only load what you need.
- Document context switches in code comments.
- Test after context changes.
- Cache and rate-limit API calls to avoid DDB blocks.
- Handle homebrew and null/undefined fields robustly.

---

## 4. Additional Resources
- See README.md for project overview and links.
- See docs/quick-reference.md for command and analysis/test data.
- See docs/development-status.md for feature checklist.

---

*This document supersedes previous MCP, context, and quick-reference instructions. All redundant or outdated instructions have been removed for clarity and maintainability.*
