#!/usr/bin/env node

/**
 * Clean Script - Remove build artifacts and temporary files
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const dirsToClean = [
  'dist',
  'node_modules/.cache',
  'coverage'
];

const filesToClean = [
  'build-info.json',
  '.DS_Store',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*'
];

async function cleanDirectory(dirPath) {
  try {
    await fs.rmdir(path.resolve(rootDir, dirPath), { recursive: true });
    console.log(`🗑️  Removed ${dirPath}`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`⚠️  Could not remove ${dirPath}:`, error.message);
    }
  }
}

async function cleanFile(filePath) {
  try {
    await fs.unlink(path.resolve(rootDir, filePath));
    console.log(`🗑️  Removed ${filePath}`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`⚠️  Could not remove ${filePath}:`, error.message);
    }
  }
}

async function clean() {
  console.log('🧹 Cleaning build artifacts...');
  
  // Clean directories
  for (const dir of dirsToClean) {
    await cleanDirectory(dir);
  }
  
  // Clean files
  for (const file of filesToClean) {
    await cleanFile(file);
  }
  
  console.log('✨ Clean completed');
}

clean().catch(error => {
  console.error('💥 Clean failed:', error);
  process.exit(1);
});