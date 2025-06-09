#!/usr/bin/env node

/**
 * Class Data Puller for Beyond Foundry
 * 
 * This script pulls class data from D&D Beyond using the proxy on localhost:4000
 * and tests the class import functionality.
 * 
 * Usage: node pull-class-data.js [classId]
 * Default classId is 2190876 (Bard)
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Configuration
const PROXY_ENDPOINT = process.env.PROXY_ENDPOINT || 'http://localhost:4000';
const DEFAULT_CLASS_ID = '2190876'; // Bard class from the URL
const DEFAULT_CLASS_URL = 'https://www.dndbeyond.com/classes/2190876-bard';

/**
 * Mock settings for standalone testing
 */
function getMockModuleSettings() {
  return {
    proxyUrl: PROXY_ENDPOINT,
    cobaltToken: process.env.COBALT_TOKEN || '',
    debugMode: true
  };
}

/**
 * Mock Logger for testing
 */
class Logger {
  static info(message) { console.log(`[INFO] ${message}`); }
  static warn(message) { console.log(`[WARN] ${message}`); }
  static error(message) { console.error(`[ERROR] ${message}`); }
  static debug(message) { console.log(`[DEBUG] ${message}`); }
}

/**
 * Standalone Class Data Puller
 */
class ClassDataPuller {
  constructor(proxyEndpoint = PROXY_ENDPOINT) {
    this.proxyEndpoint = proxyEndpoint;
  }

  /**
   * Extract class ID from D&D Beyond URL
   * @param {string} url - The D&D Beyond class URL
   * @returns {string} The class ID
   */
  extractClassIdFromUrl(url) {
    const match = url.match(/\/classes\/(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Test proxy connectivity
   */
  async testConnection() {
    Logger.info('🔄 Testing proxy connection...');
    try {
      const response = await fetch(`${this.proxyEndpoint}/ping`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        Logger.info('✅ Proxy connection successful');
        return true;
      } else {
        Logger.warn(`⚠️ Proxy responded with status: ${response.status}`);
        return false;
      }
    } catch (error) {
      Logger.error(`❌ Proxy connection failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Pull class data from D&D Beyond via proxy
   * @param {string} classId - The class ID to fetch
   * @param {string} cobaltToken - Authentication token (optional for testing)
   * @returns {Object} The class data
   */
  async pullClassData(classId, cobaltToken = '') {
    Logger.info(`🎭 Pulling class data for ID: ${classId}`);
    
    try {
      const requestBody = {
        cobalt: cobaltToken,
        classId: parseInt(classId)
      };

      Logger.debug(`Request body: ${JSON.stringify(requestBody, null, 2)}`);
      
      const response = await fetch(`${this.proxyEndpoint}/proxy/class`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        timeout: 10000
      });

      const responseText = await response.text();
      Logger.debug(`Response status: ${response.status}`);
      Logger.debug(`Response text: ${responseText}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      
      if (!data.success) {
        throw new Error(`API Error: ${data.message || 'Unknown error'}`);
      }

      if (!data.ddb?.class) {
        throw new Error('No class data returned from API');
      }

      Logger.info(`✅ Successfully pulled class data: ${data.ddb.class.name || 'Unknown Class'}`);
      return data;

    } catch (error) {
      Logger.error(`❌ Failed to pull class data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save data to JSON file
   * @param {Object} data - The data to save
   * @param {string} filename - The filename (without extension)
   */
  async saveToFile(data, filename) {
    const outputPath = path.join(process.cwd(), `${filename}.json`);
    
    try {
      await fs.promises.writeFile(outputPath, JSON.stringify(data, null, 2));
      Logger.info(`💾 Data saved to: ${outputPath}`);
      return outputPath;
    } catch (error) {
      Logger.error(`❌ Failed to save file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze and display class data structure
   * @param {Object} classData - The raw class data from D&D Beyond
   */
  analyzeClassData(classData) {
    Logger.info('\n📊 CLASS DATA ANALYSIS');
    Logger.info('=' .repeat(50));
    
    if (classData.ddb?.class) {
      const cls = classData.ddb.class;
      
      Logger.info(`📛 Name: ${cls.name || 'N/A'}`);
      Logger.info(`🆔 ID: ${cls.id || 'N/A'}`);
      Logger.info(`📖 Description: ${cls.description ? cls.description.substring(0, 100) + '...' : 'N/A'}`);
      Logger.info(`⚡ Hit Die: d${cls.hitDie || 'N/A'}`);
      Logger.info(`🏹 Primary Ability: ${cls.primaryAbility?.join(', ') || 'N/A'}`);
      Logger.info(`💾 Saving Throw Proficiencies: ${cls.savingThrowProficiencies?.map(p => p.name).join(', ') || 'N/A'}`);
      
      if (cls.classFeatures && cls.classFeatures.length > 0) {
        Logger.info(`🎯 Class Features: ${cls.classFeatures.length} features`);
        Logger.info(`   First few: ${cls.classFeatures.slice(0, 3).map(f => f.name).join(', ')}`);
      }
      
      if (cls.spellRules) {
        Logger.info(`🔮 Spellcasting: Yes`);
        Logger.info(`   Spell Ability: ${cls.spellRules.spellcastingAbility || 'N/A'}`);
        Logger.info(`   Ritual Casting: ${cls.spellRules.ritualCasting ? 'Yes' : 'No'}`);
      } else {
        Logger.info(`🔮 Spellcasting: No`);
      }
      
      if (cls.subclasses && cls.subclasses.length > 0) {
        Logger.info(`🎭 Subclasses: ${cls.subclasses.length}`);
        Logger.info(`   Names: ${cls.subclasses.map(s => s.name).join(', ')}`);
      }
    }
    
    Logger.info('\n🔧 RAW DATA STRUCTURE:');
    Logger.info(`Top-level keys: ${Object.keys(classData).join(', ')}`);
    if (classData.ddb) {
      Logger.info(`DDB keys: ${Object.keys(classData.ddb).join(', ')}`);
    }
    if (classData.ddb?.class) {
      Logger.info(`Class keys: ${Object.keys(classData.ddb.class).join(', ')}`);
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const classId = args[0] || DEFAULT_CLASS_ID;
  const cobaltToken = process.env.COBALT_TOKEN || '';
  
  Logger.info('🎭 Beyond Foundry Class Data Puller');
  Logger.info('=' .repeat(50));
  Logger.info(`🎯 Target: ${DEFAULT_CLASS_URL}`);
  Logger.info(`🆔 Class ID: ${classId}`);
  Logger.info(`🔑 Auth Token: ${cobaltToken ? 'Provided' : 'Not provided (testing without auth)'}`);
  Logger.info(`🌐 Proxy: ${PROXY_ENDPOINT}`);
  Logger.info('');

  const puller = new ClassDataPuller();
  
  try {
    // Test connection first
    const connectionOk = await puller.testConnection();
    if (!connectionOk) {
      Logger.warn('⚠️ Proxy connection issues detected, but continuing...');
    }
    
    // Pull class data
    const classData = await puller.pullClassData(classId, cobaltToken);
    
    // Analyze the data
    puller.analyzeClassData(classData);
    
    // Save to file
    const filename = `pulled-${classData.ddb?.class?.name?.toLowerCase().replace(/\s+/g, '-') || 'class'}-${classId}`;
    await puller.saveToFile(classData, filename);
    
    Logger.info('\n✅ SUCCESS: Class data pulled and analyzed');
    Logger.info('📄 Check the generated JSON file for complete data structure');
    
  } catch (error) {
    Logger.error('\n❌ FAILED: Could not pull class data');
    Logger.error(`Error: ${error.message}`);
    
    // Additional troubleshooting info
    Logger.info('\n🔧 TROUBLESHOOTING:');
    Logger.info('1. Check if the proxy is running:');
    Logger.info('   docker ps | grep proxy');
    Logger.info('2. Test proxy manually:');
    Logger.info(`   curl -v ${PROXY_ENDPOINT}/ping`);
    Logger.info('3. Check if you need authentication:');
    Logger.info('   COBALT_TOKEN=your_token node pull-class-data.js');
    Logger.info('4. Try a different proxy endpoint:');
    Logger.info('   PROXY_ENDPOINT=http://localhost:3100 node pull-class-data.js');
    
    process.exit(1);
  }
}

// Export for potential module usage
export { ClassDataPuller, Logger };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
