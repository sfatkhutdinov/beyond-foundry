/**
 * Simple Test for Updated Spell Format
 * Re-run comprehensive test to generate updated data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testUpdatedSpells() {
  console.log('🔄 REGENERATING SPELL DATA WITH FIXES');
  console.log('='.repeat(40));
  
  // First, delete old results
  const resultsDir = path.join(__dirname, 'comprehensive-parser-results');
  if (fs.existsSync(resultsDir)) {
    fs.rmSync(resultsDir, { recursive: true, force: true });
    console.log('🗑️  Deleted old comprehensive results');
  }
  
  console.log('🚀 Running comprehensive integration test to regenerate data...\n');
}

// Run the test
testUpdatedSpells().then(() => {
  // Now run the comprehensive test
  import('./test-comprehensive-integration.js');
});
