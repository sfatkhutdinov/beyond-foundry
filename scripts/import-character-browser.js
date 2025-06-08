#!/usr/bin/env node

/**
 * Browser Automation Character Import for Character ID 147565858
 * This script uses Puppeteer to fetch character data directly from D&D Beyond
 * when ddb-proxy is not available or authentication is complex
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CHARACTER_ID = '147565858';
const CHARACTER_URL = `https://www.dndbeyond.com/characters/${CHARACTER_ID}`;
const OUTPUT_FILE = '147565858.json';

console.log('🤖 Browser Automation Character Import');
console.log('='*50);
console.log(`📋 Target Character: ${CHARACTER_ID}`);
console.log(`🔗 URL: ${CHARACTER_URL}`);
console.log(`📁 Output File: ${OUTPUT_FILE}`);

/**
 * Extract character data from the D&D Beyond page
 */
async function extractCharacterData(page) {
  console.log('\n🔍 Extracting character data from page...');
  
  try {
    // Wait for the character data to load
    await page.waitForSelector('.ct-character-header__name', { timeout: 10000 });
    
    // Extract character data from the page's JavaScript context
    const characterData = await page.evaluate(() => {
      // D&D Beyond stores character data in global variables
      // Try to find the character data in various possible locations
      
      // Method 1: Look for window.characterData or similar
      if (window.characterData) {
        return window.characterData;
      }
      
      // Method 2: Look for Redux store data
      if (window.__REDUX_STORE__ && window.__REDUX_STORE__.character) {
        return window.__REDUX_STORE__.character;
      }
      
      // Method 3: Look in the page's script tags for JSON data
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const script of scripts) {
        const content = script.textContent || script.innerHTML;
        if (content.includes('"character"') && content.includes('"name"')) {
          try {
            // Try to extract JSON data from script content
            const matches = content.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/s);
            if (matches) {
              const initialState = JSON.parse(matches[1]);
              if (initialState.character) {
                return initialState.character;
              }
            }
          } catch (e) {
            // Continue to next script
          }
        }
      }
      
      // Method 4: Parse DOM elements for basic character info
      const basicData = {
        name: document.querySelector('.ct-character-header__name')?.textContent?.trim(),
        race: document.querySelector('.ct-character-header__race')?.textContent?.trim(),
        classes: Array.from(document.querySelectorAll('.ct-character-header__class')).map(el => el.textContent?.trim()),
        level: document.querySelector('.ct-character-header__level')?.textContent?.trim(),
        background: document.querySelector('.ct-character-header__background')?.textContent?.trim(),
        
        // Try to get ability scores
        abilities: {},
        
        // Note that this is incomplete data
        _source: 'DOM_PARSED',
        _incomplete: true,
        _message: 'Full character data not accessible via DOM parsing. This is basic info only.'
      };
      
      // Try to get ability scores
      const abilityElements = document.querySelectorAll('.ct-quick-info__ability');
      abilityElements.forEach(el => {
        const abilityName = el.querySelector('.ct-quick-info__ability-name')?.textContent?.trim()?.toLowerCase();
        const abilityScore = el.querySelector('.ct-quick-info__ability-score')?.textContent?.trim();
        if (abilityName && abilityScore) {
          basicData.abilities[abilityName] = parseInt(abilityScore);
        }
      });
      
      return basicData;
    });
    
    if (characterData) {
      console.log('✅ Character data extracted successfully');
      
      if (characterData._incomplete) {
        console.log('⚠️  Warning: Only basic character data could be extracted from DOM');
        console.log('💡 For complete data, use the ddb-proxy method with authentication');
      }
      
      console.log(`📊 Character: ${characterData.name || 'Unknown'}`);
      console.log(`🎭 Race: ${characterData.race || 'Unknown'}`);
      console.log(`⚔️ Classes: ${Array.isArray(characterData.classes) ? characterData.classes.join(', ') : 'Unknown'}`);
      
      return characterData;
    } else {
      throw new Error('No character data found on page');
    }
    
  } catch (error) {
    console.log(`❌ Error extracting character data: ${error.message}`);
    throw error;
  }
}

/**
 * Save character data to tests directory
 */
async function saveCharacterData(characterData, outputFilename) {
  const testsDir = path.join(__dirname, '..', 'tests');
  const outputPath = path.join(testsDir, outputFilename);
  
  try {
    // Ensure tests directory exists
    if (!fs.existsSync(testsDir)) {
      fs.mkdirSync(testsDir, { recursive: true });
    }
    
    // Add metadata about the extraction method
    const dataWithMetadata = {
      ...characterData,
      _extraction: {
        method: 'browser_automation',
        timestamp: new Date().toISOString(),
        characterId: CHARACTER_ID,
        sourceUrl: CHARACTER_URL,
        note: characterData._incomplete ? 'Partial data extracted from DOM' : 'Complete data extracted'
      }
    };
    
    // Save the character data as JSON
    fs.writeFileSync(outputPath, JSON.stringify(dataWithMetadata, null, 2));
    console.log(`💾 Successfully saved character data to: ${outputPath}`);
    
    // Show file size and summary
    const stats = fs.statSync(outputPath);
    console.log(`📏 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    return outputPath;
  } catch (error) {
    console.log(`❌ Error saving character data: ${error.message}`);
    throw error;
  }
}

/**
 * Main browser automation function
 */
async function main() {
  let browser;
  
  try {
    console.log('\n🚀 Starting browser automation...');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      defaultViewport: { width: 1200, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Set user agent to appear more like a regular browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log(`📖 Navigating to character page: ${CHARACTER_URL}`);
    
    // Navigate to the character page
    await page.goto(CHARACTER_URL, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Check if we need to log in
    const loginRequired = await page.$('.login-form') !== null;
    
    if (loginRequired) {
      console.log('\n🔐 Character requires authentication');
      console.log('💡 This character may be private or require a D&D Beyond account');
      console.log('💡 Options:');
      console.log('  1. Use the ddb-proxy method with authentication');
      console.log('  2. Make sure the character is publicly accessible');
      console.log('  3. Log in manually and run this script again');
      
      await browser.close();
      return;
    }
    
    // Check if character is accessible
    const characterNotFound = await page.$('.ct-error-page') !== null;
    
    if (characterNotFound) {
      console.log('\n❌ Character not found or not accessible');
      console.log('💡 Make sure the character ID is correct and the character is publicly accessible');
      
      await browser.close();
      return;
    }
    
    // Extract character data
    const characterData = await extractCharacterData(page);
    
    // Save the data
    const savedPath = await saveCharacterData(characterData, OUTPUT_FILE);
    
    // Success summary
    console.log('\n🎉 Browser automation completed!');
    console.log(`📁 Character data saved to: ${savedPath}`);
    console.log(`📊 Character: ${characterData.name}`);
    console.log(`🆔 D&D Beyond ID: ${CHARACTER_ID}`);
    
    if (characterData._incomplete) {
      console.log('\n⚠️  Important Notes:');
      console.log('• Only basic character data could be extracted');
      console.log('• For complete character data (spells, items, etc.), use ddb-proxy method');
      console.log('• This data is suitable for basic testing but may not include all details');
    }
    
    console.log('\n📝 Next Steps:');
    console.log('1. Review the extracted character data');
    console.log('2. If incomplete, try the ddb-proxy method for full data');
    console.log('3. Use this data for testing the CharacterParser');
    console.log('4. Run validation tests with the imported data');
    
  } catch (error) {
    console.error('\n💥 Browser automation error:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the character URL is accessible');
    console.log('2. Check if the character requires authentication');
    console.log('3. Verify network connectivity');
    console.log('4. Try the ddb-proxy method as an alternative');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { extractCharacterData, saveCharacterData };
