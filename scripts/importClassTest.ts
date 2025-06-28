import dotenv from 'dotenv';
dotenv.config();
import { BeyondFoundryAPI } from '../build/src/module/api/BeyondFoundryAPI.js';
import fs from 'fs-extra';
import path from 'path';
import { Logger } from '../build/src/module/utils/logger.js';
import type { FoundrySpell, ModuleSettings } from '../build/src/types/index.js'; // Added ModuleSettings
import { CLASS_CONFIG } from '../build/scripts/config.js';

const COBALT_TOKEN = process.env.COBALT_TOKEN;
const PROXY_URL = process.env.PROXY_URL || 'http://localhost:4000';
const CLASS_TO_TEST = CLASS_CONFIG.BARBARIAN; // Example: Test Barbarian

async function testClassSpellImport() {
  if (!COBALT_TOKEN) {
    console.error('COBALT_TOKEN is not set in .env file. Please ensure it is correctly configured.');
    Logger.error('COBALT_TOKEN is not set in .env file.');
    process.exit(1);
  }

  const testDir = path.join(process.cwd(), 'test-results', 'class-import');
  await fs.ensureDir(testDir);
  const debugLogPath = path.join(testDir, `class-import-debug-${CLASS_TO_TEST}.log`);
  const resultFilePath = path.join(testDir, `class-import-result-${CLASS_TO_TEST}.json`);

  if (await fs.pathExists(debugLogPath)) {
    await fs.writeFile(debugLogPath, '');
  }

  const appendToDebugLog = (message: string) => {
    fs.appendFileSync(debugLogPath, message + '\n');
  };

  appendToDebugLog(`Starting class import test for: ${CLASS_TO_TEST}`);
  appendToDebugLog(`Timestamp: ${new Date().toISOString()}`);
  appendToDebugLog(`Proxy URL: ${process.env.PROXY_URL ?? 'http://localhost:4000'}`);
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
    appendToDebugLog(`Attempting to import class features and spells for ${CLASS_TO_TEST}...`);
    
    // Step 1: Import Class Features
    appendToDebugLog(`Importing features for ${CLASS_TO_TEST}...`);
    const classFeatures = await api.importClassFeatures(CLASS_TO_TEST, {
      cobaltToken: COBALT_TOKEN, // Passed for API to use if needed
      proxyUrl: PROXY_URL,
      debug: true,
    });
    appendToDebugLog(`Import class features call completed. Features count: ${classFeatures?.length ?? 0}.`);

    // Print and log the full class object (including isLegacy)
    if (classFeatures && typeof classFeatures === 'object') {
      appendToDebugLog(`Full class object: ${JSON.stringify(classFeatures, null, 2)}`);
      if ('isLegacy' in classFeatures) {
        console.log(`isLegacy: ${classFeatures.isLegacy}`);
        appendToDebugLog(`isLegacy: ${classFeatures.isLegacy}`);
      }
    }

    // Step 2: Import Spells by Class
    appendToDebugLog(`Importing spells for ${CLASS_TO_TEST}...`);
    const spellImportResult = await api.importSpellsByClass(CLASS_TO_TEST, { // api.importSpellsByClass returns an object
        cobaltToken: COBALT_TOKEN, // Passed for API to use if needed
        proxyUrl: PROXY_URL,
        debug: true,
      },
    );
    appendToDebugLog(`Import spells by class call completed. Success: ${spellImportResult.success}. Spells count: ${spellImportResult.spells?.length ?? 0}. Errors: ${spellImportResult.errors?.join(', ')}`);

    const resultData = {
      class: CLASS_TO_TEST,
      features: classFeatures, // This is the direct result from the placeholder
      spells: spellImportResult.spells, // Access the spells array from the result
      spellImportSuccess: spellImportResult.success,
      spellImportErrors: spellImportResult.errors,
      isLegacy: classFeatures && typeof classFeatures === 'object' && 'isLegacy' in classFeatures ? classFeatures.isLegacy : undefined,
    };

    await fs.writeJson(resultFilePath, resultData, { spaces: 2 });
    appendToDebugLog(`Class features and spells data saved to: ${resultFilePath}`);
    console.log(`Class import for ${CLASS_TO_TEST} successful. Results saved to ${resultFilePath}`);
    Logger.info(`Class import for ${CLASS_TO_TEST} successful. Results saved to ${resultFilePath}`);

  } catch (error: any) {
    const errorMessage = `Error during class import for ${CLASS_TO_TEST}: ${error.message}`;
    appendToDebugLog(errorMessage);
    if (error.stack) {
      appendToDebugLog(`Stack trace: ${error.stack}`);
    }
    console.error(errorMessage, error);
    Logger.error(errorMessage, error);
    await fs.writeJson(path.join(testDir, `class-import-error-${CLASS_TO_TEST}.json`), {
      error: error.message,
      stack: error.stack,
      details: error,
    }, { spaces: 2 });
  } finally {
    appendToDebugLog(`Class import test finished for: ${CLASS_TO_TEST}`);
    appendToDebugLog(`Timestamp: ${new Date().toISOString()}`);
  }
}

testClassSpellImport().catch((error) => {
  console.error('Unhandled error in testClassSpellImport:', error);
  Logger.error('Unhandled error in testClassSpellImport:', error);
  process.exit(1);
});
