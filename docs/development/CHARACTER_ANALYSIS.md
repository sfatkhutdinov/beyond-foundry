# Character Data Analysis Guide

## Testing Character ID 147239148

This guide walks you through analyzing the specific character data structure for character ID 147239148 from D&D Beyond.

## Step 1: Get Your Cobalt Token

1. **Log in to D&D Beyond**: Go to [dndbeyond.com](https://www.dndbeyond.com) and log in
2. **Open Developer Tools**: Press F12 to open browser developer tools
3. **Navigate to Cookies**: 
   - Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
   - Expand **Cookies**
   - Click on `https://www.dndbeyond.com`
4. **Find CobaltSession**: Look for a cookie named `CobaltSession`
5. **Copy the Value**: Copy the entire value (it will be a long string)

⚠️ **Security Note**: Keep this token private! It provides access to your D&D Beyond account.

## Step 2: Run the Character Analysis

Use our specialized analysis script to fetch and analyze the character data:

```bash
# Navigate to the project directory
cd /Users/macbook-pro/Documents/Programming/beyond-foundry

# Run the analysis script with your cobalt token
node analyze-character.js "YOUR_COBALT_TOKEN_HERE"

# Or specify a different character ID
node analyze-character.js "YOUR_COBALT_TOKEN_HERE" "147239148"
```

## Step 3: Review the Analysis Results

The script will create an `analysis/character-analysis/` directory with detailed files:

### Files Created:

1. **`character-147239148-raw.json`**: Complete raw D&D Beyond character data
2. **`character-147239148-insights.json`**: Extracted key information and statistics
3. **`character-147239148-structure.txt`**: Detailed data structure analysis

### Console Output Includes:

- ✅ **Basic Character Info**: Name, level, race, classes
- 📊 **Ability Scores**: STR, DEX, CON, INT, WIS, CHA values
- 📋 **Content Summary**: Skills, spells, equipment counts
- 🏗️ **Data Structure**: Hierarchical breakdown of the JSON structure
- 💡 **Parser Recommendations**: Suggestions for improving CharacterParser

## Step 4: Analyze the Results

### Key Areas to Examine:

1. **Ability Scores** (`character.stats`):
   - How are ability scores structured?
   - Are modifiers included?

2. **Skills** (`character.modifiers`):
   - How are skill proficiencies represented?
   - What about expertise (double proficiency)?

3. **Spells** (`character.spells`):
   - How are known/prepared spells stored?
   - What spell slot information is available?

4. **Equipment** (`character.inventory`):
   - How are items structured?
   - What about equipped vs. unequipped items?

5. **Class Features** (`character.classFeatures`):
   - How are racial and class features represented?
   - What about custom features?

## Step 5: Identify Parser Gaps

Compare the D&D Beyond data structure with our current `CharacterParser.ts`:

### Current Parser Methods to Review:

```typescript
// Check these methods in src/parsers/character/CharacterParser.ts
- parseAbilities()      // Ability scores
- parseSkills()         // Skill proficiencies  
- parseSpells()         // Spellcasting
- parseAttributes()     // HP, AC, etc.
- parseDetails()        // Background, race, etc.
- parseTraits()         // Features and traits
- parseCurrency()       // Money and resources
```

### Questions to Answer:

1. **Are all D&D Beyond data fields being used?**
2. **Is the FoundryVTT format correct for D&D 5e system?**
3. **What data is missing or incorrectly mapped?**
4. **Are there new D&D Beyond fields we're not handling?**

## Step 6: Test Parser Improvements

After identifying gaps, test the updated parser:

```bash
# Rebuild the module after making changes
npm run build

# Test in FoundryVTT console
game.modules.get("beyond-foundry").api.importCharacter("147239148")
```

## Common Issues and Solutions

### Issue: "Authentication failed"
- **Solution**: Your cobalt token may be expired. Get a fresh one from D&D Beyond.

### Issue: "Character not found"
- **Solution**: The character might not belong to your account or be set to private.

### Issue: "Proxy connection failed"
- **Solution**: Make sure ddb-proxy is running on localhost:3100.

### Issue: "Permission denied"
- **Solution**: You need access to the character (owner or shared with you).

## Expected Character 147239148 Analysis

Based on typical D&D Beyond characters, we expect to find:

- **Complete ability scores** with racial/ASI bonuses
- **Class features** from character progression
- **Equipment** including magic items
- **Spells** if the character has spellcasting
- **Background features** and traits
- **Proficiencies** for skills, tools, languages

## Next Steps After Analysis

1. **Update CharacterParser**: Fix any identified data mapping issues
2. **Add Missing Fields**: Include any D&D Beyond data we're not using
3. **Test Import**: Verify the character imports correctly into FoundryVTT
4. **Validate Output**: Ensure the FoundryVTT actor has all expected data
5. **Document Changes**: Update the parser documentation

## Troubleshooting

If you encounter issues:

1. **Check ddb-proxy logs** for connection problems
2. **Verify cobalt token** is current and valid
3. **Test with a different character** to isolate issues
4. **Check FoundryVTT console** for import errors
5. **Review network requests** in browser dev tools

---

**Remember**: This analysis helps us understand how D&D Beyond structures character data so we can improve our parser to create better FoundryVTT actors!
