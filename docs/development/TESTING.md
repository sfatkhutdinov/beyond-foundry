# Beyond Foundry Testing Guide

This guide covers how to test the Beyond Foundry module with the ddb-proxy setup.

## Prerequisites

1. **ddb-proxy running**: Make sure ddb-proxy is running on `localhost:3100`
2. **D&D Beyond account**: You need a valid D&D Beyond account with characters
3. **Cobalt token**: Your D&D Beyond session token
4. **Character IDs**: Know the IDs of characters you want to test with

## Getting Required Information

### 1. Getting Your Cobalt Token

1. Log in to [D&D Beyond](https://www.dndbeyond.com) in your browser
2. Open Developer Tools (F12)
3. Go to **Application** > **Cookies** > `https://www.dndbeyond.com`
4. Find the `CobaltSession` cookie and copy its value
5. ⚠️ **Keep this token private!** It provides access to your D&D Beyond account

### 2. Finding Character IDs

1. Go to [D&D Beyond Characters](https://www.dndbeyond.com/characters)
2. Click on a character you want to test with
3. Look at the URL: `https://www.dndbeyond.com/characters/{YOUR_CHARACTER_ID}`
4. Copy the numeric ID from the URL

**Example:**
- URL: `https://www.dndbeyond.com/characters/123456789`
- Character ID: `123456789`

## Testing Methods

### Method 1: Basic API Testing

The basic test script validates API connection, authentication, and character retrieval:

```bash
# Test authentication only
node test-api.js "your-cobalt-token"

# Test authentication and character retrieval
node test-api.js "your-cobalt-token" "your-character-id"
```

### Method 2: Character Data Analysis (Recommended for Development)

For detailed analysis of D&D Beyond data structure, use the analysis script:

```bash
# Analyze character ID 147239148 (default)
node analyze-character.js "your-cobalt-token"

# Analyze a specific character
node analyze-character.js "your-cobalt-token" "your-character-id"
```

This creates detailed analysis files in `analysis/character-analysis/` directory with:
- Raw D&D Beyond JSON data
- Extracted character insights
- Complete data structure breakdown
- Parser improvement recommendations

### Method 3: Parser Validation Testing

Test the CharacterParser against real D&D Beyond data:

```bash
# Test parser with character ID 147239148
node test-parser.js "your-cobalt-token" "147239148"

# Test parser with any character
node test-parser.js "your-cobalt-token" "your-character-id"
```

This validates that the parser correctly transforms D&D Beyond data into FoundryVTT format.

**Example output:**
```
🧪 Starting Beyond Foundry API Test...

=== Test 1: Proxy Connection ===
[INFO] ✅ Proxy connection successful

=== Test 2: Authentication ===
[INFO] ✅ Authentication successful

=== Test 3: Character List Limitation ===
[WARN] ⚠️  ddb-proxy does not provide a character list endpoint
[INFO] 📝 To get characters, you need to know the character ID

=== Test 4: Character Data Retrieval ===
[INFO] ✅ Character data retrieved: Thalion Brightblade

📄 Character Details for Thalion Brightblade:
  - Race: High Elf
  - Classes: Fighter 5
  - Background: Noble
  - HP: 42

✅ Character data retrieval successful!
```

### Method 4: FoundryVTT Console Testing

Once the Node.js tests pass, test within FoundryVTT:

1. Copy `beyond-foundry.js` to your FoundryVTT modules folder
2. Enable the Beyond Foundry module
3. Open the FoundryVTT console (F12)
4. Run the following commands:

```javascript
// Test authentication and basic API
game.modules.get("beyond-foundry").api.quickTest("your-cobalt-token", "your-character-id")

// Test character import
game.modules.get("beyond-foundry").api.importCharacter("your-character-id")

// Test connection only
game.modules.get("beyond-foundry").api.runConnectionTest()
```

## Testing Character ID 147239148

For comprehensive testing and analysis, we're using character ID **147239148** as our reference character. This character provides a good test case for analyzing D&D Beyond data structure.

### Quick Test Commands:

```bash
# Complete analysis of character 147239148
node analyze-character.js "your-cobalt-token" "147239148"

# Test parser against character 147239148  
node test-parser.js "your-cobalt-token" "147239148"

# Basic API test with character 147239148
node test-api.js "your-cobalt-token" "147239148"
```

### What This Character Tests:

Character 147239148 helps us validate:
- ✅ **Basic character data** (name, race, class, level)
- ✅ **Ability scores** and modifiers
- ✅ **Skills and proficiencies**
- ✅ **Equipment and inventory**
- ✅ **Spells** (if character has spellcasting)
- ✅ **Class and racial features**
- ✅ **Background information**

### Analysis Output:

The analysis scripts will generate:
1. **Raw JSON data** from D&D Beyond
2. **Structured insights** about character content
3. **Data structure mapping** for parser development
4. **Validation reports** for FoundryVTT compatibility
5. **Improvement recommendations** for CharacterParser

See `CHARACTER_ANALYSIS.md` for detailed instructions on analyzing this character.

## Understanding the Limitations

### Character List Endpoint Missing

**Important Discovery:** The ddb-proxy does **NOT** have a `/proxy/character/list` endpoint. This means:

- ❌ Cannot retrieve a list of all characters
- ❌ Cannot browse characters within the module UI
- ✅ Can retrieve individual characters if you know their ID
- ✅ Authentication works perfectly
- ✅ Individual character import works

### Current Workflow

1. **Manual ID Collection**: Users must manually get character IDs from D&D Beyond URLs
2. **Direct Import**: Import characters one by one using known IDs
3. **No Character Browser**: The module cannot show a list of available characters

## Troubleshooting

### Common Issues

1. **Proxy Connection Failed**
   - Ensure ddb-proxy is running on `localhost:3100`
   - Check if the proxy container/process is active
   - Verify the endpoint with: `curl http://localhost:3100/ping`

2. **Authentication Failed**
   - Verify your cobalt token is correct and not expired
   - Log out and back in to D&D Beyond to refresh the token
   - Check for extra spaces or characters in the token

3. **Character Not Found**
   - Verify the character ID is correct
   - Ensure the character belongs to your D&D Beyond account
   - Make sure the character is not private/shared

4. **Module Not Working in FoundryVTT**
   - Check the browser console for JavaScript errors
   - Ensure the module is enabled in FoundryVTT settings
   - Verify you're using D&D 5e system in FoundryVTT

### Debug Mode

Enable debug mode in FoundryVTT module settings to see detailed logs:

1. Go to **Configure Settings** > **Module Settings**
2. Find **Beyond Foundry** settings
3. Enable **Debug Mode**
4. Check the browser console for detailed logs

## API Reference

### Available Methods

```javascript
const api = game.modules.get("beyond-foundry").api;

// Test proxy connection
await api.testProxyConnection()

// Authenticate with D&D Beyond
await api.authenticate("cobalt-token")

// Get character data
await api.getCharacter("character-id")

// Import character to FoundryVTT
await api.importCharacter("character-id")

// Quick test (auth + character)
await api.quickTest("cobalt-token", "character-id")

// Connection test
await api.runConnectionTest()
```

### Expected Data Structure

Character data returned from ddb-proxy includes:
- Basic info: name, race, classes, background
- Ability scores and modifiers
- Hit points, armor class
- Skills and proficiencies
- Equipment and spells
- Character features and traits

## Next Steps

Once testing is successful:

1. **UI Enhancement**: Update the module UI to request character IDs manually
2. **Batch Import**: Allow importing multiple characters by ID list
3. **Character Discovery**: Explore alternative ways to discover character IDs
4. **Error Handling**: Improve error messages and user guidance

## Support

If you encounter issues:

1. Check this testing guide first
2. Verify all prerequisites are met
3. Run the Node.js test script to isolate issues
4. Check the FoundryVTT console for errors
5. Review ddb-proxy logs for server-side issues
