# Beyond Foundry Compendium Management

## Overview

This document outlines the compendium management system in Beyond Foundry, including how to create, manage, and use compendiums for imported content.

## 🎯 Compendium Types

### 1. Core Compendiums
- `beyondfoundry.spells` - All imported spells
- `beyondfoundry.items` - All imported items
- `beyondfoundry.monsters` - All imported monsters
- `beyondfoundry.classes` - All imported classes
- `beyondfoundry.races` - All imported races

### 2. Custom Compendiums
- User-created compendiums
- Campaign-specific compendiums
- Homebrew compendiums
- Shared compendiums

## 🔧 Compendium Operations

### 1. Creating Compendiums
```typescript
// Example: Creating a new compendium
await game.modules.get("beyond-foundry").api.createCompendium({
  name: "beyondfoundry.spells",
  label: "Beyond Foundry Spells",
  path: "packs/beyondfoundry-spells.db",
  type: "Item",
  system: "dnd5e"
});
```

### 2. Managing Content
```typescript
// Example: Adding content to a compendium
await game.modules.get("beyond-foundry").api.addToCompendium({
  compendium: "beyondfoundry.spells",
  content: spellData,
  options: {
    updateExisting: true,
    importFlags: true
  }
});
```

## 📦 Content Organization

### 1. Structure
- Content is organized by type
- Each piece of content has metadata
- Content is linked to D&D Beyond sources
- Content includes import history

### 2. Metadata
- D&D Beyond ID
- Import date
- Last update
- Source information
- Custom flags

## 🔍 Content Management

### 1. Importing Content
- Bulk import
- Individual import
- Update existing
- Merge content
- Validate content

### 2. Exporting Content
- Export to JSON
- Export to module
- Share compendium
- Backup content
- Restore content

## 🛠️ Development Guidelines

### 1. Compendium API
```typescript
// Example: Using the compendium API
class CompendiumManager {
  async createCompendium(options: CompendiumOptions): Promise<Compendium> {
    // Create compendium
    const compendium = await this.create(options);
    
    // Initialize structure
    await this.initialize(compendium);
    
    return compendium;
  }
  
  async addContent(compendium: string, content: any): Promise<void> {
    // Validate content
    this.validate(content);
    
    // Add to compendium
    await this.add(compendium, content);
    
    // Update metadata
    await this.updateMetadata(compendium, content);
  }
}
```

### 2. Best Practices
- Use proper validation
- Handle errors gracefully
- Maintain metadata
- Update references
- Clean up unused content

## 📝 Management Checklist

### 1. Setup
- [ ] Create compendiums
- [ ] Set up structure
- [ ] Configure permissions
- [ ] Set up backup
- [ ] Test access

### 2. Maintenance
- [ ] Update content
- [ ] Clean up unused
- [ ] Validate content
- [ ] Update metadata
- [ ] Check permissions

### 3. Backup
- [ ] Regular backups
- [ ] Test restore
- [ ] Archive old
- [ ] Monitor space
- [ ] Update strategy

## 🔄 Regular Tasks

### 1. Daily Tasks
- Check for updates
- Monitor usage
- Handle errors
- Update metadata
- Clean up temp

### 2. Weekly Tasks
- Full backup
- Content validation
- Permission check
- Space check
- Performance check

### 3. Monthly Tasks
- Deep cleanup
- Structure review
- Permission audit
- Performance audit
- Strategy review

## 📚 Additional Resources

### 1. Documentation
- [FoundryVTT Compendium Guide](https://foundryvtt.com/article/compendium/)
- [D&D 5e System Guide](https://foundryvtt.com/packages/dnd5e)
- [Module Development Guide](https://foundryvtt.com/article/module-development/)

### 2. Tools
- Compendium Manager
- Content Validator
- Backup Tool
- Import Tool
- Export Tool

## 🚀 Future Plans

### 1. Planned Features
- Advanced search
- Content versioning
- Sharing system
- Advanced backup
- Content validation

### 2. Improvements
- Better organization
- Enhanced search
- Improved backup
- Better validation
- More automation

## ⚠️ Known Issues

### 1. Current Limitations
- Basic search
- Limited sharing
- Basic backup
- Limited validation
- Basic automation

### 2. Planned Fixes
- Enhanced search
- Better sharing
- Improved backup
- Better validation
- More automation

## 📈 Usage Statistics

### 1. Current Usage
- Number of compendiums
- Content count
- User count
- Storage usage
- Performance metrics

### 2. Trends
- Growing usage
- Popular content
- Common issues
- User feedback
- Performance trends

---

## Usage Example: Bulk Spell Import

To import all spells into a compendium:

```typescript
const cobaltToken = "your_cobalt_session_token_here";
await api.bulkImportSpellsToCompendium(cobaltToken, 'beyondfoundry.spells');
```

**Note**: This requires a valid D&D Beyond Cobalt session token.

---

## Troubleshooting: Compendium Sync
- Ensure compendium is unlocked and writable
- Check for duplicate entries (use canonical linking)
- If sync fails, review logs for error messages
- For large imports, monitor memory usage and split into smaller batches if needed

---
