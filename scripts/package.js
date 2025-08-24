#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('📦 Packaging Grade Entry Helper for Chrome Web Store...');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
    console.error('❌ Build not found. Run "npm run build" first.');
    process.exit(1);
}

// Read manifest for version info
const manifestPath = path.join(distDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version;
const name = manifest.name.toLowerCase().replace(/\s+/g, '-');

// Create package filename
const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const zipName = `${name}-v${version}-${timestamp}.zip`;
const zipPath = path.join(rootDir, zipName);

// Remove existing zip if it exists
if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
    console.log(`🗑️  Removed existing ${zipName}`);
}

try {
    // Create ZIP file from dist directory
    // Change to dist directory so zip contains files at root level
    process.chdir(distDir);
    
    // Use system zip command (cross-platform)
    execSync(`zip -r "../${zipName}" .`, { stdio: 'pipe' });
    
    // Return to root directory
    process.chdir(rootDir);
    
    // Get file size
    const stats = fs.statSync(zipPath);
    const fileSizeInKB = (stats.size / 1024).toFixed(1);
    
    console.log(`✅ Package created: ${zipName}`);
    console.log(`📊 Package size: ${fileSizeInKB} KB`);
    console.log(`📍 Location: ${zipPath}`);
    console.log('');
    console.log('🚀 Ready for Chrome Web Store upload!');
    console.log('📋 Next steps:');
    console.log('   1. Go to https://chrome.google.com/webstore/devconsole');
    console.log('   2. Click "New Item" and upload this ZIP file');
    console.log('   3. Complete store listing with screenshots and description');
    
} catch (error) {
    console.error('❌ Failed to create package:', error.message);
    
    // Fallback: suggest manual zip creation
    console.log('');
    console.log('📝 Manual packaging instructions:');
    console.log('   1. Navigate to the dist/ folder');
    console.log('   2. Select all files and folders inside dist/');
    console.log('   3. Create a ZIP archive');
    console.log('   4. Upload the ZIP to Chrome Web Store');
    
    process.exit(1);
}