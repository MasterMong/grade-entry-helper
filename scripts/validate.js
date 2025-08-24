#!/usr/bin/env node

/**
 * Validation Script - Validate extension structure and manifest
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function validateManifest() {
  console.log('📋 Validating manifest.json...');
  
  try {
    const manifestPath = path.join(rootDir, 'manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    // Required fields
    const requiredFields = ['manifest_version', 'name', 'version', 'description'];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate manifest version
    if (manifest.manifest_version !== 3) {
      throw new Error('Only Manifest V3 is supported');
    }
    
    // Validate permissions
    if (!manifest.permissions || !Array.isArray(manifest.permissions)) {
      throw new Error('Permissions must be an array');
    }
    
    // Check content scripts
    if (manifest.content_scripts) {
      for (const script of manifest.content_scripts) {
        if (!script.matches || !Array.isArray(script.matches)) {
          throw new Error('Content script must have matches array');
        }
        if (!script.js || !Array.isArray(script.js)) {
          throw new Error('Content script must have js array');
        }
        
        // Validate script files exist
        for (const jsFile of script.js) {
          try {
            await fs.access(path.join(rootDir, jsFile));
          } catch (error) {
            throw new Error(`Content script file not found: ${jsFile}`);
          }
        }
      }
    }
    
    console.log('✅ Manifest validation passed');
    
  } catch (error) {
    console.error('❌ Manifest validation failed:', error.message);
    throw error;
  }
}

async function validateSrcStructure() {
  console.log('📁 Validating source structure...');
  
  const requiredDirs = [
    'src',
    'src/core',
    'src/shared',
    'src/pages',
    'src/content-scripts'
  ];
  
  for (const dir of requiredDirs) {
    try {
      await fs.access(path.join(rootDir, dir));
      console.log(`✅ Found ${dir}`);
    } catch (error) {
      throw new Error(`Required directory missing: ${dir}`);
    }
  }
  
  // Check core files
  const coreFiles = [
    'src/core/ExtensionCore.js',
    'src/core/SGSPageDetector.js',
    'src/core/BasePageController.js'
  ];
  
  for (const file of coreFiles) {
    try {
      await fs.access(path.join(rootDir, file));
      console.log(`✅ Found ${file}`);
    } catch (error) {
      throw new Error(`Required core file missing: ${file}`);
    }
  }
  
  console.log('✅ Source structure validation passed');
}

async function validateImports() {
  console.log('🔗 Validating ES6 imports...');
  
  const filesToCheck = [
    'src/core/ExtensionCore.js',
    'src/content-scripts/grade-entry.js',
    'src/pages/gradeEntry/GradeEntryController.js'
  ];
  
  for (const file of filesToCheck) {
    try {
      const filePath = path.join(rootDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      // Check for basic import syntax
      const importRegex = /import\s+.*\s+from\s+['"](.+)['"];?/g;
      const imports = [...content.matchAll(importRegex)];
      
      for (const [, importPath] of imports) {
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          // Relative import - check if file exists
          const resolvedPath = path.resolve(path.dirname(filePath), importPath);
          
          // Try with .js extension if not present
          const finalPath = resolvedPath.endsWith('.js') ? resolvedPath : `${resolvedPath}.js`;
          
          try {
            await fs.access(finalPath);
          } catch (error) {
            console.warn(`⚠️  Import path may not exist: ${importPath} in ${file}`);
          }
        }
      }
      
      console.log(`✅ Validated imports in ${file}`);
      
    } catch (error) {
      throw new Error(`Failed to validate imports in ${file}: ${error.message}`);
    }
  }
  
  console.log('✅ Import validation passed');
}

async function validateConfig() {
  console.log('⚙️  Validating configuration files...');
  
  // Check if package.json exists and is valid
  try {
    const packagePath = path.join(rootDir, 'package.json');
    const packageContent = await fs.readFile(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    if (!packageJson.name || !packageJson.version) {
      throw new Error('package.json missing name or version');
    }
    
    console.log(`✅ package.json valid (${packageJson.name} v${packageJson.version})`);
  } catch (error) {
    throw new Error(`package.json validation failed: ${error.message}`);
  }
}

async function validate() {
  try {
    console.log('🔍 Starting validation...\n');
    
    await validateManifest();
    await validateSrcStructure();
    await validateImports();
    await validateConfig();
    
    console.log('\n🎉 All validation checks passed!');
    
  } catch (error) {
    console.error('\n💥 Validation failed:', error.message);
    process.exit(1);
  }
}

validate();