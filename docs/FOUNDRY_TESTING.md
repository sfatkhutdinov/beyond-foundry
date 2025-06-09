# FoundryVTT Integration Testing Guide

This guide walks through testing the Beyond Foundry module in a live FoundryVTT environment.

## Prerequisites

1. **FoundryVTT Installed**: Version 12 or higher with D&D 5e system
2. **ddb-proxy Running**: Docker container on localhost:4000
3. **D&D Beyond Cobalt Token**: For authentication testing
4. **Module Built**: Run `npm run build` to ensure latest changes

## Installation Steps

### Option 1: Development Installation (Recommended)

1. **Copy module to FoundryVTT:**
   ```bash
   # Create symlink for development (updates automatically)
   ln -s "/Users/macbook-pro/Documents/Programming/beyond-foundry" "/path/to/foundrydata/Data/modules/beyond-foundry"
   
   # Or copy files manually
   cp -r "/Users/macbook-pro/Documents/Programming/beyond-foundry" "/path/to/foundrydata/Data/modules/beyond-foundry"
   ```

2. **Required files in module directory:**
   - `module.json` ✅
   - `beyond-foundry.js` ✅
   - `beyond-foundry.css` ✅
   - `lang/en.json` ✅

### Option 2: Package Installation

1. **Create module package:**
   ```bash
   cd /Users/macbook-pro/Documents/Programming/beyond-foundry
   npm run package
   ```

2. **Install in FoundryVTT:**
   - Go to Add-on Modules
   - Click "Install Module"  
   - Browse to the generated .zip file

## Testing Procedure

### 1. Basic Module Loading

1. **Start FoundryVTT** with D&D 5e system
2. **Enable Beyond Foundry** in module management
3. **Restart** and load a world
4. **Check console** for any loading errors

**Expected:** Module loads without errors and shows in active modules list.

### 2. API Initialization

1. **Open browser console** (F12)
2. **Run basic diagnostic:**
   ```javascript
   // Check if module is loaded
   game.modules.get("beyond-foundry")
   
   // Check if API is available
   game.modules.get("beyond-foundry").api
   
   // Run diagnostic test
   game.modules.get("beyond-foundry").api.runDiagnostic()
   ```

**Expected output:**
```
🔧 Beyond Foundry - Quick Diagnostic
✅ Module: beyond-foundry v1.0.0 loaded
✅ API: BeyondFoundryAPI initialized  
✅ Proxy: http://localhost:4000 responding
✅ System: dnd5e compatible
✅ Settings: 6 registered correctly
🎉 All systems operational!
```

### 3. Settings Configuration

1. **Open Module Settings** (Game Settings → Configure Settings → Module Settings)
2. **Configure Beyond Foundry:**
   - Proxy URL: `http://localhost:4000`
   - Debug Mode: Enable
   - Auto Import Items: Enable
   - Import Policy: Ask before importing

3. **Test setting saves** by reopening settings panel

### 4. Authentication Testing

1. **Open console and test authentication:**
   ```javascript
   const api = game.modules.get("beyond-foundry").api;
   
   // Test with your actual cobalt token
   api.authenticate("YOUR_COBALT_TOKEN_HERE")
     .then(result => console.log("Auth result:", result))
     .catch(error => console.error("Auth error:", error));
   ```

2. **Expected successful response:**
   ```javascript
   {
     success: true,
     message: "Authentication successful",
     userId: "12345",
     username: "YourUsername"
   }
   ```

### 5. Character Import Testing

#### Option A: Via Console (Recommended for testing)

1. **Test character fetch:**
   ```javascript
   const api = game.modules.get("beyond-foundry").api;
   
   // Fetch a specific character (replace with your character ID)
   api.fetchCharacter("147239148")
     .then(character => {
       console.log("Character fetched:", character.name);
       return api.importCharacter(character);
     })
     .then(actor => console.log("Character imported:", actor.name))
     .catch(error => console.error("Import error:", error));
   ```

#### Option B: Via UI Dialog

1. **Test dialog opening:**
   ```javascript
   const api = game.modules.get("beyond-foundry").api;
   api.openCharacterImportDialog();
   ```

2. **Test authentication dialog:**
   ```javascript
   const api = game.modules.get("beyond-foundry").api;
   api.openAuthDialog();
   ```

### 6. Full Integration Test

1. **Run comprehensive test:**
   ```javascript
   const api = game.modules.get("beyond-foundry").api;
   api.runFullSystemTest();
   ```

2. **Expected output:**
   ```
   🚀 Beyond Foundry - Full System Test
   ✅ Module loaded and initialized
   ✅ Proxy connection established
   ✅ Settings configured correctly
   ✅ Authentication flow working
   ✅ Character fetch successful
   ✅ Character parsing completed
   ✅ Actor creation successful
   🎉 Full system test passed!
   ```

## Troubleshooting

### Module Won't Load
- Check FoundryVTT console for errors
- Verify all files are present in module directory
- Check FoundryVTT version compatibility (v12+)
- Ensure D&D 5e system is active

### Proxy Connection Issues
- Verify ddb-proxy is running: `docker ps | grep ddb-proxy`
- Test proxy directly: `curl http://localhost:4000/ping`
- Check firewall settings
- Try `http://127.0.0.1:4000` instead of localhost

### Authentication Failures
- Verify cobalt token is current and valid
- Check D&D Beyond subscription status
- Test token in browser: logged into D&D Beyond?
- Look for CORS issues in browser console

### Character Import Issues
- Check character ID is correct
- Verify character is owned by authenticated user
- Look for parsing errors in console
- Check D&D 5e system compatibility

### UI Dialog Issues
- Check for CSS loading errors
- Verify template files are present
- Look for JavaScript errors in console
- Test with different browsers

## Performance Testing

### Memory Usage
```javascript
// Monitor memory usage during import
const beforeMemory = performance.memory?.usedJSHeapSize || 0;
await api.importCharacter(character);
const afterMemory = performance.memory?.usedJSHeapSize || 0;
console.log(`Memory used: ${(afterMemory - beforeMemory) / 1024 / 1024}MB`);
```

### Import Speed
```javascript
// Time character import process
console.time("Character Import");
await api.importCharacter(character);
console.timeEnd("Character Import");
```

## Success Criteria

- ✅ Module loads without errors
- ✅ Settings are configurable and persistent
- ✅ Proxy connection established
- ✅ Authentication works with valid tokens
- ✅ Character data fetches successfully
- ✅ Character parses to valid FoundryVTT actor
- ✅ Actor creates in world correctly
- ✅ UI dialogs open and function
- ✅ No memory leaks during import
- ✅ Import completes in reasonable time (< 5 seconds)

## Next Steps After Successful Testing

1. **User Documentation**: Update user-facing guides
2. **Error Handling**: Improve edge case handling
3. **UI Polish**: Enhance dialog designs
4. **Spell Import**: Implement full spell parsing
5. **Batch Import**: Support multiple character import
6. **Auto-Update**: Implement character sync features
