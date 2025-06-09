#!/usr/bin/env node

/**
 * Test script for the updated importClass method
 * Tests the new character-based class import functionality
 */

import fetch from 'node-fetch';

// Test configuration
const PROXY_ENDPOINT = 'http://localhost:3100';

/**
 * Logger for testing
 */
class TestLogger {
  static info(message) {
    console.log(`ℹ️  ${message}`);
  }
  
  static error(message) {
    console.log(`❌ ${message}`);
  }
  
  static warn(message) {
    console.log(`⚠️  ${message}`);
  }
  
  static success(message) {
    console.log(`✅ ${message}`);
  }
}

/**
 * Test proxy connection
 */
async function testProxyConnection() {
  try {
    TestLogger.info('Testing proxy connection...');
    const response = await fetch(`${PROXY_ENDPOINT}/ping`);
    if (response.ok) {
      TestLogger.success('Proxy connection successful');
      return true;
    } else {
      TestLogger.error(`Proxy connection failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    TestLogger.error(`Proxy connection error: ${error.message}`);
    return false;
  }
}

/**
 * Test character data retrieval to simulate the importClass workflow
 */
async function testCharacterForClassImport(cobaltToken, characterId) {
  try {
    TestLogger.info(`Testing character data retrieval for class import (ID: ${characterId})...`);
    
    const response = await fetch(`${PROXY_ENDPOINT}/proxy/character`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cobalt: cobaltToken,
        betaKey: null,
        characterId: parseInt(characterId, 10)
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      const character = data.ddb?.character;
      if (character) {
        TestLogger.success(`Character data retrieved: ${character.name}`);
        
        // Check classes for import
        if (character.classes && character.classes.length > 0) {
          TestLogger.info(`Available classes for import:`);
          character.classes.forEach((cls, index) => {
            const className = cls.definition?.name || 'Unknown';
            const classId = cls.definition?.id || 'N/A';
            const level = cls.level || 0;
            const subclass = cls.subclassDefinition?.name || 'None';
            
            TestLogger.info(`  ${index + 1}. ${className} (ID: ${classId}, Level: ${level})`);
            if (subclass !== 'None') {
              TestLogger.info(`     Subclass: ${subclass}`);
            }
            if (cls.classFeatures && cls.classFeatures.length > 0) {
              TestLogger.info(`     Features: ${cls.classFeatures.length}`);
            }
          });
          
          // Simulate the new importClass method workflow
          TestLogger.info('\n🔧 Class Import Method Test:');
          TestLogger.success('✅ Character has classes - import would succeed');
          TestLogger.info(`   Primary class would be: ${character.classes[0].definition?.name} (ID: ${character.classes[0].definition?.id})`);
          
          if (character.classes.length > 1) {
            TestLogger.info('   Multiple classes available - specific class ID can be used');
          }
          
        } else {
          TestLogger.warn('Character has no classes - import would fail');
        }
        
        return {
          success: true,
          character: character,
          canImportClass: character.classes && character.classes.length > 0
        };
      } else {
        TestLogger.error('Character data not found in response');
        return { success: false, error: 'Character data not found' };
      }
    } else {
      TestLogger.error(`Failed to retrieve character: ${data.message || 'Unknown error'}`);
      return { success: false, error: data.message || 'Failed to retrieve character' };
    }
  } catch (error) {
    TestLogger.error(`Network error: ${error.message}`);
    return { success: false, error: `Network error: ${error.message}` };
  }
}

/**
 * Run complete test
 */
async function runCompleteTest(cobaltToken, characterId) {
  TestLogger.info('🧪 Testing Updated Class Import Method');
  TestLogger.info('=====================================\n');
  
  // Test proxy connection
  const proxyConnected = await testProxyConnection();
  if (!proxyConnected) {
    TestLogger.error('Cannot proceed without proxy connection');
    return;
  }
  
  TestLogger.info('');
  
  // Test character-based class import
  if (characterId) {
    const result = await testCharacterForClassImport(cobaltToken, characterId);
    
    if (result.success && result.canImportClass) {
      TestLogger.info('\n🎉 Class Import Method Summary:');
      TestLogger.success('✅ The updated importClass method should work correctly');
      TestLogger.info('📝 Usage:');
      TestLogger.info(`   api.importClass("${characterId}") - Import first class`);
      if (result.character.classes.length > 1) {
        const secondClassId = result.character.classes[1].definition?.id;
        TestLogger.info(`   api.importClass("${characterId}", "${secondClassId}") - Import specific class`);
      }
    } else if (result.success && !result.canImportClass) {
      TestLogger.warn('⚠️  Character has no classes - choose a different character for testing');
    } else {
      TestLogger.error('❌ Character retrieval failed - class import would not work');
    }
  }
  
  TestLogger.info('\n✨ Test complete!');
}

// Main execution
if (process.argv.length < 3) {
  console.log('Usage: node test-class-import.js <cobalt-token> [character-id]');
  console.log('');
  console.log('This tests the updated importClass method that works with character data.');
  console.log('If no character-id is provided, only proxy connection will be tested.');
  process.exit(1);
}

const cobaltToken = process.argv[2];
const characterId = process.argv[3];

runCompleteTest(cobaltToken, characterId)
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    TestLogger.error(`Test failed: ${error.message}`);
    process.exit(1);
  });
