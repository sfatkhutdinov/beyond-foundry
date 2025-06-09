# Beyond Foundry API Reference

This document describes the public API surface of the Beyond Foundry module for developers and advanced users.

## Main API Class: `BeyondFoundryAPI`

### Methods
- `authenticate(token: string): Promise<boolean>`
- `importCharacter(id: string, options?): Promise<Actor>`
- `importMonster(id: string, options?): Promise<Actor>`
- `importSpell(id: string, options?): Promise<Item>`
- `importItem(id: string, options?): Promise<Item>`
- `importAdventure(id: string, options?): Promise<Adventure>`
- `bulkImportSpells(filter?): Promise<Item[]>`
- `bulkImportMonsters(filter?): Promise<Actor[]>`
- `updateContent(type: ContentType, id: string): Promise<Document>`
- `syncUserContent(): Promise<SyncResult>`

## Usage Example
```js
const api = game.modules.get('beyond-foundry').api;
await api.importCharacter('123456');
```

## Events & Hooks
- `beyond-foundry:import-complete`
- `beyond-foundry:import-error`

## See Also
- [parsers.md](./parsers.md)
- [setup.md](./setup.md)
