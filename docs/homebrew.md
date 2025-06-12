# Beyond Foundry Homebrew Support

## Overview

This document outlines the homebrew content support in Beyond Foundry, including how to import, manage, and use homebrew content from D&D Beyond.

## 🎯 Supported Homebrew Types

### 1. Character Options
- Custom Classes
- Custom Subclasses
- Custom Races
- Custom Backgrounds
- Custom Feats

### 2. Game Content
- Custom Spells
- Custom Items
- Custom Monsters
- Custom Features
- Custom Proficiencies

## 🔧 Import Process

### 1. Character Import with Homebrew
```typescript
// Example: Importing a character with homebrew content
const character = await game.modules.get("beyond-foundry").api.importCharacter({
  id: "character-id",
  includeHomebrew: true,
  homebrewOptions: {
    includeCustomClasses: true,
    includeCustomRaces: true,
    includeCustomSpells: true
  }
});
```

### 2. Bulk Homebrew Import
```typescript
// Example: Bulk importing homebrew content
await game.modules.get("beyond-foundry").api.importHomebrew({
  types: ["spells", "items", "monsters"],
  source: "ddb-homebrew-id"
});
```

## 📦 Homebrew Management

### 1. Storage
- Homebrew content is stored in FoundryVTT compendiums
- Each homebrew type has its own compendium
- Content is linked to D&D Beyond sources

### 2. Organization
- Homebrew content is organized by type
- Each piece of content includes source information
- Content is tagged for easy filtering

## 🔍 Homebrew Validation

### 1. Content Validation
- Validate against D&D 5e rules
- Check for required fields
- Verify balance and compatibility
- Ensure proper formatting

### 2. Error Handling
- Log validation errors
- Provide user feedback
- Suggest fixes
- Maintain error history

## 🛠️ Development Guidelines

### 1. Adding Homebrew Support
```typescript
// Example: Adding homebrew support to a parser
class HomebrewParser extends BaseParser {
  async parse(content: any): Promise<HomebrewContent> {
    // Validate homebrew content
    this.validate(content);
    
    // Parse content
    const parsed = await this.parseContent(content);
    
    // Store in compendium
    await this.storeInCompendium(parsed);
    
    return parsed;
  }
}
```

### 2. Homebrew Integration
- Use the homebrew flag system
- Implement proper validation
- Handle errors gracefully
- Provide user feedback

## 📝 Homebrew Checklist

### 1. Content Creation
- [ ] Validate against D&D 5e rules
- [ ] Check for required fields
- [ ] Verify balance
- [ ] Test compatibility
- [ ] Document changes

### 2. Import Process
- [ ] Validate content
- [ ] Parse content
- [ ] Store in compendium
- [ ] Link to sources
- [ ] Update references

### 3. User Experience
- [ ] Provide clear feedback
- [ ] Handle errors gracefully
- [ ] Show progress
- [ ] Allow customization
- [ ] Support rollback

## 🔄 Maintenance

### 1. Regular Tasks
- Update homebrew content
- Validate existing content
- Clean up unused content
- Update documentation
- Monitor usage

### 2. User Support
- Answer questions
- Provide guidance
- Fix issues
- Update content
- Gather feedback

## 📚 Additional Resources

### 1. Documentation
- [D&D Beyond Homebrew Guide](https://www.dndbeyond.com/homebrew)
- [FoundryVTT Compendium Guide](https://foundryvtt.com/article/compendium/)
- [D&D 5e Rules](https://www.dndbeyond.com/sources)

### 2. Tools
- Homebrew Validator
- Content Manager
- Import Tool
- Export Tool

## 🚀 Future Plans

### 1. Planned Features
- Advanced homebrew validation
- Custom homebrew creation
- Homebrew sharing
- Homebrew marketplace
- Advanced customization

### 2. Improvements
- Better error handling
- Enhanced validation
- Improved user interface
- Better documentation
- More customization options

## ⚠️ Known Issues

### 1. Current Limitations
- Limited homebrew validation
- Basic error handling
- Limited customization
- Basic user interface
- Limited documentation

### 2. Planned Fixes
- Enhanced validation
- Better error handling
- More customization
- Improved interface
- Better documentation

## 📈 Usage Statistics

### 1. Current Usage
- Number of homebrew items
- Popular homebrew types
- Common issues
- User feedback
- Performance metrics

### 2. Trends
- Growing usage
- Popular features
- Common requests
- User satisfaction
- Performance trends

---

## Example: Homebrew Item Mapping

D&D Beyond homebrew items are mapped to FoundryVTT items using the following pattern:

```typescript
// Example: Homebrew item mapping
function mapHomebrewItem(ddbItem: any): FoundryItemData {
  return {
    name: ddbItem.name,
    type: ddbItem.type,
    data: {
      ...ddbItem.data,
      isHomebrew: true,
      source: ddbItem.source || 'Homebrew',
    },
  };
}
```

---

## User Workflow: Importing Homebrew Items
1. Create or enable homebrew content on D&D Beyond
2. Run the Beyond Foundry import for characters or items
3. Homebrew items will be detected and imported with a `Homebrew` tag
4. Review imported items in FoundryVTT and adjust as needed

---
