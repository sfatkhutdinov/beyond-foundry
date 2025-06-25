#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();
import { BeyondFoundryAPI } from '../build/src/module/api/BeyondFoundryAPI.js';
import fs from 'fs-extra';
import path from 'path';
import { Logger } from '../build/src/module/utils/logger.js';
import type { FoundrySpell, ModuleSettings } from '../build/src/types/index.js'; // Added ModuleSettings

const COBALT_TOKEN = process.env.COBALT_TOKEN;
const PROXY_URL = process.env.PROXY_URL || 'http://localhost:4000';

async function testAllSpellsImport() {
  if (!COBALT_TOKEN) {
    console.error('COBALT_TOKEN is not set in .env file. Please ensure it is correctly configured.');
    Logger.error('COBALT_TOKEN is not set in .env file.');
    process.exit(1);
  }

  const testDir = path.join(process.cwd(), 'test-results', 'all-spells-import');
  await fs.ensureDir(testDir);
  const debugLogPath = path.join(testDir, 'all-spells-import-debug.log');
  const resultFilePath = path.join(testDir, 'all-spells-import-result.json');

  if (await fs.pathExists(debugLogPath)) {
    await fs.writeFile(debugLogPath, '');
  }

  const appendToDebugLog = (message: string) => {
    fs.appendFileSync(debugLogPath, message + '\n');
  };

  appendToDebugLog('Starting all spells import test...');
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
    appendToDebugLog('Attempting to import all spells...');
    // api.importAllSpells is a placeholder, adjust options as needed by actual implementation
    const allSpells: FoundrySpell[] = await api.importAllSpells({ 
      cobaltToken: COBALT_TOKEN, // Passed for API to use if needed
      proxyUrl: PROXY_URL,
      debug: true,
    });
    appendToDebugLog(`Import all spells call completed. Spells count: ${allSpells?.length ?? 0}.`);

    if (allSpells && allSpells.length > 0) {
      // Optionally, save a summary or a sample of spells if the full list is too large
      const summary = {
        count: allSpells.length,
        // sample: allSpells.slice(0, 10), // Example: save first 10 spells
      };
      await fs.writeJson(resultFilePath, summary, { spaces: 2 });
      // For full data, consider saving to a different file or logging snippets
      // await fs.writeJson(path.join(testDir, 'all-spells-full-data.json'), allSpells, { spaces: 2 });
      appendToDebugLog(`All spells import summary saved to: ${resultFilePath}`);
      console.log(`All spells import successful. Summary saved to ${resultFilePath}`);
      Logger.info(`All spells import successful. ${allSpells.length} spells imported. Summary saved to ${resultFilePath}`);
    } else {
      appendToDebugLog('No spells were imported.');
      console.warn('No spells were imported.');
      Logger.warn('No spells were imported during all spells import test.');
    }

  } catch (error: any) {
    const errorMessage = `Error during all spells import: ${error.message}`;
    appendToDebugLog(errorMessage);
    if (error.stack) {
      appendToDebugLog(`Stack trace: ${error.stack}`);
    }
    console.error(errorMessage, error);
    Logger.error(errorMessage, error);
    await fs.writeJson(path.join(testDir, 'all-spells-import-error.json'), {
      error: error.message,
      stack: error.stack,
      details: error,
    }, { spaces: 2 });
  } finally {
    appendToDebugLog('All spells import test finished.');
    appendToDebugLog(`Timestamp: ${new Date().toISOString()}`);
  }
}

testAllSpellsImport().catch((error) => {
  console.error('Unhandled error in testAllSpellsImport:', error);
  Logger.error('Unhandled error in testAllSpellsImport:', error);
  process.exit(1);
});
