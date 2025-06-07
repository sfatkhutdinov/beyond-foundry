#!/usr/bin/env node

/**
 * Beyond Foundry - FoundryVTT Setup Helper
 * Helps prepare the module for FoundryVTT testing
 */

import fs from 'fs';
import path from 'path';

console.log('🎭 Beyond Foundry - FoundryVTT Setup Helper');
console.log('='.repeat(50));

const projectRoot = process.cwd();

/**
 * Check if all required files exist
 */
function checkRequiredFiles() {
  console.log('\n📋 Checking required files...');
  
  const requiredFiles = [
    'module.json',
    'beyond-foundry.js',
    'beyond-foundry.css',
    'lang/en.json'
  ];
  
  let allPresent = true;
  
  for (const file of requiredFiles) {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      const size = fs.statSync(filePath).size;
      console.log(`✅ ${file} (${(size / 1024).toFixed(1)}KB)`);
    } else {
      console.log(`❌ Missing: ${file}`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

/**
 * Validate module.json
 */
function validateModuleJson() {
  console.log('\n🔍 Validating module.json...');
  
  try {
    const moduleJsonPath = path.join(projectRoot, 'module.json');
    const moduleData = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));
    
    // Check required fields
    const requiredFields = ['id', 'title', 'description', 'version', 'compatibility', 'esmodules'];
    const missingFields = requiredFields.filter(field => !moduleData.hasOwnProperty(field));
    
    if (missingFields.length > 0) {
      console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    console.log(`✅ Module ID: ${moduleData.id}`);
    console.log(`✅ Version: ${moduleData.version}`);
    console.log(`✅ FoundryVTT: ${moduleData.compatibility.minimum}-${moduleData.compatibility.maximum}`);
    console.log(`✅ System: ${moduleData.relationships?.systems?.[0]?.id || 'None specified'}`);
    console.log(`✅ Entry point: ${moduleData.esmodules?.[0] || 'None'}`);
    
    return true;
  } catch (error) {
    console.log(`❌ module.json validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Check build output
 */
function checkBuildOutput() {
  console.log('\n🔨 Checking build output...');
  
  const buildFile = path.join(projectRoot, 'beyond-foundry.js');
  
  if (!fs.existsSync(buildFile)) {
    console.log('❌ beyond-foundry.js not found - run "npm run build"');
    return false;
  }
  
  const content = fs.readFileSync(buildFile, 'utf8');
  const size = fs.statSync(buildFile).size;
  
  console.log(`✅ Bundle size: ${(size / 1024).toFixed(1)}KB`);
  
  // Check for key exports
  const requiredExports = ['BeyondFoundryAPI', 'CharacterParser', 'CharacterImportDialog'];
  const missingExports = requiredExports.filter(exp => !content.includes(exp));
  
  if (missingExports.length > 0) {
    console.log(`⚠️  Possibly missing exports: ${missingExports.join(', ')}`);
  } else {
    console.log('✅ All key exports found in bundle');
  }
  
  return true;
}

/**
 * Generate FoundryVTT installation instructions
 */
function generateInstallInstructions() {
  console.log('\n📋 FoundryVTT Installation Instructions:');
  console.log('='.repeat(40));
  
  const currentPath = projectRoot;
  
  console.log(`
1. Locate your FoundryVTT data directory:
   - Windows: %LOCALAPPDATA%\\FoundryVTT\\Data\\modules\\
   - macOS: ~/Library/Application Support/FoundryVTT/Data/modules/
   - Linux: ~/.local/share/FoundryVTT/Data/modules/

2. Create module directory (choose one method):

   Method A - Symlink (Development):
   ln -s "${currentPath}" "/path/to/foundrydata/Data/modules/beyond-foundry"
   
   Method B - Copy files:
   cp -r "${currentPath}" "/path/to/foundrydata/Data/modules/beyond-foundry"

3. Start FoundryVTT and enable the module:
   - Go to "Add-on Modules"
   - Find "Beyond Foundry" 
   - Click "Enable"
   - Save and restart

4. Test in console:
   game.modules.get("beyond-foundry").api.runDiagnostic()
`);
}

/**
 * Create development package
 */
function createDevPackage() {
  console.log('\n📦 Creating development package...');
  
  const packageDir = path.join(projectRoot, 'foundry-dev-package');
  
  // Create package directory
  if (!fs.existsSync(packageDir)) {
    fs.mkdirSync(packageDir);
  }
  
  // Files to include in package
  const filesToCopy = [
    'module.json',
    'beyond-foundry.js',
    'beyond-foundry.js.map',
    'beyond-foundry.css',
    'lang/en.json'
  ];
  
  for (const file of filesToCopy) {
    const srcPath = path.join(projectRoot, file);
    const destPath = path.join(packageDir, file);
    
    if (fs.existsSync(srcPath)) {
      // Create directory if needed
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied: ${file}`);
    } else {
      console.log(`⚠️  Skipped missing: ${file}`);
    }
  }
  
  console.log(`\n✅ Development package created in: ${packageDir}`);
  console.log('   You can copy this entire directory to your FoundryVTT modules folder');
}

/**
 * Main execution
 */
async function main() {
  let allGood = true;
  
  // Run all checks
  allGood &= checkRequiredFiles();
  allGood &= validateModuleJson();
  allGood &= checkBuildOutput();
  
  if (allGood) {
    console.log('\n🎉 Module is ready for FoundryVTT testing!');
    createDevPackage();
    generateInstallInstructions();
  } else {
    console.log('\n❌ Issues found - please fix before testing in FoundryVTT');
    console.log('\n💡 Common fixes:');
    console.log('   - Run "npm run build" to generate beyond-foundry.js');
    console.log('   - Check that all required files exist');
    console.log('   - Validate module.json syntax');
  }
}

main().catch(console.error);
