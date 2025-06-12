# Changelog

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

## [1.2.0] - 2025-06-12 - Class Importer & Proxy Directory Overhaul

### 🧙‍♂️ Class Importer Overhaul
- **Robust HTML Parsing**: The class importer now fully parses D&D Beyond class HTML, extracting all core traits, features, progression tables, and subclasses with high fidelity.
- **Clean Output**: All outputs are now clean, canonical JSON—**no raw HTML is included in the output** (the `rawHtml` debug field has been removed).
- **Complete Extraction**: Subclass, feature, and progression extraction is now complete and type-safe.

### 🔧 Repository Structure Fix
- **Proxy Directory Fix**: The `beyond-foundry-proxy` directory is now a regular, fully tracked directory in the main repository (not a broken submodule).
- **Improved Tracking**: All proxy code, including `src/class.ts`, is now versioned and tracked with the main repo, ensuring all updates are visible and shareable.
- **Recommended Workflow**: Developers should now update, commit, and push changes to proxy code as with any other part of the repo.

### 📚 Documentation
- **Updated README**: Enhanced feature documentation with class importer and proxy directory overhaul highlights.
- **Code Comments**: Extensive documentation of class parsing logic.

### 🔄 Breaking Changes
- None - fully backward compatible
