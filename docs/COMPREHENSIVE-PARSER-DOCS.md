# Comprehensive Parser Documentation

This document provides a detailed overview of all parsers in Beyond Foundry, their coverage, and known limitations.

## Parsers Overview
- **CharacterParser**: Complete. Handles all D&D Beyond character data, including multiclass, features, inventory, spells, and homebrew.
- **SpellParser**: Complete. Supports all spellcasting classes, upcasting, components, and compendium linking.
- **ItemParser**: Complete. Imports weapons, armor, gear, and basic magic items. Advanced magic, attunement, and containers are in progress.
- **MonsterParser**: Complete. Imports stat blocks, abilities, legendary actions, and spell lists.
- **FeatParser**: Partial. Prerequisites and benefits supported; feature interactions and edge cases in progress.
- **BackgroundParser**: Partial. Features, traits, and proficiencies supported; some edge cases remain.
- **RaceParser**: Complete. Racial traits, subraces, and ability score improvements.
- **ClassParser**: Complete. Features, progression, subclasses, and spell lists.
- **RuleParser**: Planned. Game rules and references.
- **AdventureParser**: Planned. Adventure content, scenes, and handouts.

## Known Limitations & TODOs
- Homebrew content support is partial for some types.
- Advanced item attunement and container relationships are in progress.
- Adventure and rule importers are planned but not yet implemented.

## References
- See [parsers.md](./parsers.md) for a summary table.
- See [development-status.md](./development-status.md) for current progress.
