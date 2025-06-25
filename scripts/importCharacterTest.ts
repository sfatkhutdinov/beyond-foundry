import dotenv from 'dotenv';
dotenv.config();
import { BeyondFoundryAPI } from '../build/src/module/api/BeyondFoundryAPI.js';
import { CHARACTER_ID } from '../build/scripts/config.js';
import fs from 'fs-extra'; 
import path from 'path';
import { Logger } from '../build/src/module/utils/logger.js';
import type { ModuleSettings, ImportResult } from '../build/src/types/index.js'; // Added ImportResult

const COBALT_TOKEN = process.env.COBALT_TOKEN;
const PROXY_URL = process.env.PROXY_URL || 'http://localhost:4000';

async function testCharacterImport() {
  if (!COBALT_TOKEN) {
    console.error('COBALT_TOKEN is not set in .env file. Please ensure it is correctly configured.');
    Logger.error('COBALT_TOKEN is not set in .env file.');
    process.exit(1);
  }

  const testDir = path.join(process.cwd(), 'test-results', 'character-import');
  await fs.ensureDir(testDir);
  const debugLogPath = path.join(testDir, `character-import-debug-${CHARACTER_ID}.log`);
  const resultFilePath = path.join(testDir, `character-import-result-${CHARACTER_ID}.json`);

  // Clear previous log file
  if (await fs.pathExists(debugLogPath)) {
    await fs.writeFile(debugLogPath, '');
  }

  const appendToDebugLog = (message: string) => { // Kept as is for now, will monitor parsing error
    // console.log(message); // Optionally log to console as well
    fs.appendFileSync(debugLogPath, message + '\n');
  };

  appendToDebugLog(`Starting character import test for ID: ${CHARACTER_ID}`);
  appendToDebugLog(`Timestamp: ${new Date().toISOString()}`);
  appendToDebugLog(`Proxy URL: ${process.env.PROXY_URL ?? 'http://localhost:4000'}`); // Using process.env directly
  appendToDebugLog(`Cobalt Token (first 5 chars): ${COBALT_TOKEN.substring(0, 5)}...`);

  const api = BeyondFoundryAPI.getInstance(); // Use getInstance for singleton
  
  // Define test settings
  const testApiSettings: Partial<ModuleSettings> = {
    proxyUrl: PROXY_URL,
    cobaltToken: COBALT_TOKEN,
    debugMode: true,
  };
  api.init(testApiSettings); // Initialize with test settings

  try {
    appendToDebugLog('Attempting to import character data...');
    // Pass ImportOptions to importCharacterById
    const result: ImportResult = await api.importCharacterById(CHARACTER_ID, { // Explicitly type result
      cobaltToken: COBALT_TOKEN, // This will be used by API.init and auth logic
      proxyUrl: PROXY_URL,       // This will be used by API.init
      debug: true,
      // These are part of ImportOptions but may not be used directly by API in test if no actor ops
      importItems: false, 
      importSpells: false,
      updateExisting: false,
      createCompendiumItems: false,
    });
    appendToDebugLog('Successfully processed character data import call.');
    
    // In tests, we check for parsedData if actor might not be created
    const characterDataToSave = result.parsedData || result.actor; 
    const characterName = result.parsedData?.name || result.actor?.name;

    appendToDebugLog(`Character Name (if available): ${characterName ?? 'N/A'}`);

    if (result.success && characterDataToSave) {
      await fs.writeJson(resultFilePath, characterDataToSave, { spaces: 2 });
      appendToDebugLog(`Character data saved to: ${resultFilePath}`);
      console.log(`Character import successful. Results saved to ${resultFilePath}`);
      Logger.info(`Character import successful for ID ${CHARACTER_ID}. Results saved to ${resultFilePath}`);
    } else if (result.success && !characterDataToSave) {
      const message = 'Character import call succeeded but no character data (parsed or actor) was returned.';
      appendToDebugLog(message);
      console.warn(message);
      Logger.warn(message);
       await fs.writeJson(resultFilePath, result, { spaces: 2 }); // Save the full result for inspection
    } else {
      throw new Error(`Character import failed. Errors: ${result.errors?.join(', ')} Warnings: ${result.warnings?.join(', ')}`);
    }
  } catch (error: any) {
    const errorMessage = `Error during character import: ${error.message}`;
    appendToDebugLog(errorMessage);
    if (error.stack) {
      appendToDebugLog(`Stack trace: ${error.stack}`);
    }
    console.error(errorMessage, error);
    Logger.error(errorMessage, error);
    // Save error information if needed
    await fs.writeJson(path.join(testDir, `character-import-error-${CHARACTER_ID}.json`), {
      error: error.message,
      stack: error.stack,
      details: error,
    }, { spaces: 2 });
  } finally {
    appendToDebugLog(`Character import test finished for ID: ${CHARACTER_ID}`);
    appendToDebugLog(`Timestamp: ${new Date().toISOString()}`);
  }
}

testCharacterImport().catch((error) => {
  console.error('Unhandled error in testCharacterImport:', error);
  Logger.error('Unhandled error in testCharacterImport:', error);
  process.exit(1);
});
