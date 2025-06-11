# Character Import Guide for D&D Beyond Character 147565858

<!-- Enhancement Note (June 2025):
Class import now uses full schema enrichment via ClassParser, including proxyData (HTML-scraped) enrichment and homebrew flag detection. All FoundryVTT class fields are mapped where possible. See docs/parsers.md for details. -->

This guide provides multiple methods to import character data from https://www.dndbeyond.com/characters/147565858 and save it as `147565858.json` in the tests directory.

## Method 1: Using ddb-proxy (Recommended)

This method uses the existing ddb-proxy infrastructure for complete character data.

### Prerequisites
- ddb-proxy running on localhost:4000 ✅ (already running)
- Valid D&D Beyond Cobalt Session token
- Access to the character (public or owned by your account)

### Steps

1. **Get your Cobalt Session token:**
   ```bash
   # Go to dndbeyond.com and log in
   # Open browser dev tools (F12)
   # Go to Application/Storage > Cookies > dndbeyond.com
   # Find and copy the "CobaltSession" cookie value
   ```

2. **Run the import script:**
   ```bash
   cd /Users/macbook-pro/Documents/Programming/beyond-foundry
   node scripts/import-character-147565858.js "YOUR_COBALT_TOKEN_HERE"
   ```

3. **Expected output:**
   ```
   🎭 Character Import Tool for D&D Beyond
   =====================================
   📋 Target Character: 147565858
   📁 Output File: 147565858.json

   📡 Testing ddb-proxy connection...
   ✅ ddb-proxy is responding

   🔐 Testing authentication...
   ✅ Authentication successful
   👤 User ID: [your-user-id]

   🎯 Fetching character data for ID: 147565858...
   🔗 Character URL: https://www.dndbeyond.com/characters/147565858
   ✅ Successfully fetched character data
   📊 Character: [Character Name]
   🎭 Race: [Character Race]
   ⚔️ Classes: [Character Classes]
   ❤️ Hit Points: [HP]
   🎒 Items: [Item Count]
   ✨ Spells: [Spell Count]

   💾 Successfully saved character data to: /Users/macbook-pro/Documents/Programming/beyond-foundry/tests/147565858.json
   📏 File size: [X] KB

   🎉 Character import completed successfully!
   ```

## Method 2: Using Browser Automation

This method uses Puppeteer to extract basic character data directly from the web page.

### Prerequisites
- Node.js with Puppeteer
- Character must be publicly accessible

### Steps

1. **Install Puppeteer (if not already installed):**
   ```bash
   npm install puppeteer
   ```

2. **Run the browser automation script:**
   ```bash
   cd /Users/macbook-pro/Documents/Programming/beyond-foundry
   node scripts/import-character-browser.js
   ```

### Limitations
- May only extract basic character information
- Requires character to be publicly accessible
- Less reliable than ddb-proxy method

## Method 3: Manual JSON Creation

If automated methods don't work, you can manually create the character data.

### Steps

1. **Visit the character page:**
   ```
   https://www.dndbeyond.com/characters/147565858
   ```

2. **Extract data manually:**
   - Character name, race, classes
   - Ability scores
   - Equipment and spells
   - Background and features

3. **Create the JSON file:**
   ```bash
   # Create the file in the tests directory
   touch /Users/macbook-pro/Documents/Programming/beyond-foundry/tests/147565858.json
   ```

4. **Format the JSON data:**
   ```json
   {
     "id": 147565858,
     "name": "[Character Name]",
     "race": {
       "fullName": "[Race Name]",
       "definition": {
         "name": "[Race]"
       }
     },
     "classes": [
       {
         "definition": {
           "name": "[Class Name]"
         },
         "level": 1
       }
     ],
     "baseHitPoints": 0,
     "inventory": [],
     "spells": {},
     "_extraction": {
       "method": "manual",
       "timestamp": "[ISO Date]",
       "note": "Manually created character data"
     }
   }
   ```

## Expected Result

After successful import, you should have:
- File: `/Users/macbook-pro/Documents/Programming/beyond-foundry/tests/147565858.json`
- Contains complete raw character data from D&D Beyond
- Can be used for testing the CharacterParser
- Validates the Beyond Foundry integration with real data

## Troubleshooting

### ddb-proxy not running
```bash
# Start ddb-proxy (from ddb-proxy directory)
npm start
```

### Authentication issues
- Make sure your Cobalt Session token is current
- Log out and back into D&D Beyond to refresh the token
- Copy the entire token value without extra spaces

### Character not accessible
- Verify the character ID in the URL
- Make sure the character is public or you own it
- Check that the character exists and wasn't deleted

### Network issues
- Check internet connectivity
- Verify D&D Beyond is accessible
- Try using a VPN if there are regional restrictions

## Next Steps

After importing the character data:

1. **Validate the data:**
   ```bash
   # Check the file was created
   ls -la /Users/macbook-pro/Documents/Programming/beyond-foundry/tests/147565858.json
   
   # Preview the data
   head -20 /Users/macbook-pro/Documents/Programming/beyond-foundry/tests/147565858.json
   ```

2. **Test with CharacterParser:**
   ```bash
   # Run parser tests with the real data
   node tests/test-parser.js
   ```

3. **Update documentation:**
   - Record the successful import
   - Document any issues found
   - Update test cases as needed

# Beyond Foundry D&D Beyond Character Import: FoundryVTT Actor Schema Mapping

## Overview
This document details the mapping between D&D Beyond character data and the FoundryVTT dnd5e actor schema, highlighting fields that are fully mapped, partially mapped, or missing, and provides guidance for future enhancements.

---

## 1. Core Actor Fields
| Foundry Field                | DDB Source Field(s)                | Status         | Notes |
|-----------------------------|-------------------------------------|----------------|-------|
| name                        | name                                | ✔️ Full        | |
| img                         | decorations.avatarUrl                | ✔️ Full        | |
| type                        | 'character'                         | ✔️ Full        | |
| system.abilities            | stats, bonusStats, overrideStats     | ✔️ Full        | Uses id mapping |
| system.attributes.hp        | baseHitPoints, bonusHitPoints, overrideHitPoints, temporaryHitPoints | ✔️ Full | |
| system.attributes.inspiration | inspiration                        | ✔️ Full        | Boolean in DDB, number in Foundry |
| system.details.race         | race.fullName                        | ✔️ Full        | |
| system.details.background   | background.definition.name            | ✔️ Full        | |
| system.details.xp.value     | currentXp                            | ✔️ Full        | |
| system.details.level        | classes                              | ✔️ Full        | Sum of class levels |
| system.details.classes      | classes                              | ✔️ Full        | Parsed for class, subclass, level |
| system.traits.size          | race.size                            | ✔️ Full        | Mapped via table |
| system.currency             | currencies                           | ✔️ Full        | |
| system.skills               | modifiers, classes                   | ✔️ Full        | Proficiencies from modifiers |
| system.spells               | spells, classSpells                  | ✔️ Full        | Via SpellParser |
| system.items                | inventory, feats, features, spells   | ✔️ Full        | |
| flags['beyond-foundry']     | all                                  | ✔️ Full        | Original DDB data, sync info |

---

## 2. Advanced/Optional Fields (Enhancement Opportunities)
| Foundry Field                        | DDB Source Field(s)         | Status         | Enhancement Plan |
|--------------------------------------|-----------------------------|----------------|------------------|
| system.attributes.death.success      | deathSaves.successes        | ❌ Missing      | Map if present   |
| system.attributes.death.failure      | deathSaves.failures         | ❌ Missing      | Map if present   |
| system.attributes.exhaustion         | exhaustion                  | ❌ Missing      | Map if present   |
| system.details.gender                | gender                      | ❌ Missing      | Map if present   |
| system.details.eyes                  | eyes                        | ❌ Missing      | Map if present   |
| system.details.hair                  | hair                        | ❌ Missing      | Map if present   |
| system.details.skin                  | skin                        | ❌ Missing      | Map if present   |
| system.details.height                | height                      | ❌ Missing      | Map if present   |
| system.details.weight                | weight                      | ❌ Missing      | Map if present   |
| system.details.faith                 | faith                       | ❌ Missing      | Map if present   |
| system.details.age                   | age                         | ❌ Missing      | Map if present   |
| system.resources.primary/secondary/tertiary | class features/resources | ❌ Missing      | Derive from DDB if possible |
| system.attributes.attunement.value   | inventory (isAttuned)       | ❌ Missing      | Sum attuned items |
| system.traits.weaponProf.mastery     | weapon masteries            | ❌ Missing      | Map if present   |
| system.favorites                     | favorites/starred           | ❌ Missing      | Map if present   |
| system.traits.custom                 | notes.otherNotes            | ❌ Missing      | Map if present   |

---

## 3. Mapping Notes
- All fields should be robust to missing/null data.
- Advanced fields should be mapped if present in DDB, otherwise omitted.
- Attunement is calculated by summing attuned items in inventory.
- Resources (primary/secondary/tertiary) can be derived from class features (e.g., Sorcery Points, Channel Divinity) if exposed by DDB.
- Personality/ideals/bonds/flaws can be mapped from notes or background if present.

---

## 4. Enhancement Checklist
- [ ] Map death save counters if present
- [ ] Map exhaustion if present
- [ ] Map detailed appearance fields (gender, eyes, hair, skin, height, weight, faith, age)
- [ ] Map attunement value
- [ ] Map resources (primary/secondary/tertiary) if possible
- [ ] Map custom traits/notes
- [ ] Map weapon mastery and favorites if DDB exposes them

---

## 5. References
- [FoundryVTT dnd5e actor schema](references/dnd5e/module/data/actor/character.mjs)
- [D&D Beyond API structure](docs/api.md)
- [Beyond Foundry CharacterParser](src/parsers/character/CharacterParser.ts)

---

This document should be updated as new fields are mapped or as DDB/Foundry schemas evolve.
