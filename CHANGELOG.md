# Changelog

## [1.2.0] - 2025-06-09 - Item and Compendium Enhancement Release

### 🪄 Major Features
- **Complete Item Import System**: Full integration of item parsing into character import workflow, including magical effects and variants.
- **Canonical Item Compendium Linking**: Items are linked to a single compendium entry, preventing duplicates during character import.
- **Bulk Item Import**: Functionality to populate a compendium with all D&D Beyond items.

### ✨ Item Features
- **Comprehensive Item Data Conversion**: Description, properties, weight, cost, rarity, type, etc.
- **Magical Effects & Variants**: Correctly parses and applies magical properties and item variants.
- **FoundryVTT Item Mapping**: Accurate mapping to D&D 5e system item types.
- **Active Effects**: Item effects integration with FoundryVTT (where applicable).

### 🎛️ Compendium Improvements
- **Item Compendium Support**: `bulkImportItemsToCompendium` function added to API.
- **Character Item Linking**: `addItemsToActor` helper updated to link to compendium items by DDB ID.
- **Robust Fallback**: If an item is not found in the compendium, it's imported as an embedded item.

### 🔧 Technical Improvements
- **ItemParser Enhancements**: Updated to handle diverse item structures from D&D Beyond.
- **API Extension**: New API methods for item bulk import and compendium management.
- **Type Definitions**: Expanded TypeScript types for item data structures.

### 🐛 Bug Fixes
- Ensured `flags['beyond-foundry'].ddbId` is consistently added to all imported items for reliable compendium matching.
- Addressed potential issues with item data inconsistencies from D&D Beyond API.

### 📚 Documentation
- **Updated README**: Reflects new item import and compendium capabilities.
- **Revised Development Status & Roadmap**: Shows progress on item-related features.
- **Code Comments**: Added detailed comments for new item and compendium logic.

### 🔄 Breaking Changes
- None - designed for backward compatibility.

## [1.1.0] - 2025-06-06 - Spell Integration Release

### 🪄 Major Features
- **Complete Spell Import System**: Full integration of spell parsing into character import workflow
- **Advanced Spell Parser**: Comprehensive D&D Beyond to FoundryVTT spell conversion
- **Spell Preparation Modes**: Support for Prepared, Pact Magic, Always Prepared, At Will, and Innate spellcasting
- **Enhanced Import Dialog**: New UI with spell import options and real-time progress

### ✨ Spell Features
- **Complete Spell Data Conversion**: Description, components, duration, range, scaling
- **School Mapping**: Proper spell school identification and validation  
- **Component Parsing**: Verbal, somatic, material, and focus components
- **Scaling Formulas**: Higher level spell effects and damage scaling
- **Active Effects**: Spell effects integration with FoundryVTT
- **Class Spell Lists**: Proper association with character classes

### 🎛️ User Interface Improvements
- **Import Options Panel**: Customizable spell preparation mode selection
- **Progress Tracking**: Real-time feedback during character and spell import
- **Error Handling**: Comprehensive error reporting and warnings
- **Batch Import**: Support for importing multiple characters with spell options

### 🔧 Technical Improvements
- **TypeScript Enhancement**: Extended type definitions for spell parsing
- **API Integration**: Seamless integration between SpellParser and BeyondFoundryAPI
- **Error Resilience**: Robust error handling for spell parsing failures
- **Performance Optimization**: Efficient batch spell processing

### 🐛 Bug Fixes
- Fixed TypeScript compilation errors in API integration
- Resolved Actor interface type issues for FoundryVTT compatibility
- Improved spell data structure handling for D&D Beyond format

### 📚 Documentation
- **Spell Integration Test**: Comprehensive testing script for spell functionality
- **Updated README**: Enhanced feature documentation with spell integration highlights
- **Code Comments**: Extensive documentation of spell parsing logic

### 🔄 Breaking Changes
- None - fully backward compatible

## [1.0.0] - Initial release
- Project structure and planning
- Proxy communication setup
