#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const packagesDir = path.join(rootDir, 'packages');

console.log('📦 Packaging SGS Bot for Chrome and Firefox...');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
    console.error('❌ Build not found. Run "npm run build" first.');
    process.exit(1);
}

// Ensure packages directory exists
if (!fs.existsSync(packagesDir)) {
    fs.mkdirSync(packagesDir, { recursive: true });
    console.log('📁 Created packages directory');
}

// Read manifest for version info
const manifestPath = path.join(distDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version;
const name = manifest.name.toLowerCase().replace(/\s+/g, '-');

// Create package filenames
const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const chromeZipName = `${name}-chrome-v${version}-${timestamp}.zip`;
const firefoxZipName = `${name}-firefox-v${version}-${timestamp}.zip`;
const chromeZipPath = path.join(packagesDir, chromeZipName);
const firefoxZipPath = path.join(packagesDir, firefoxZipName);

function createPackage(browser, zipPath, zipName) {
    // Remove existing zip if it exists
    if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
        console.log(`🗑️  Removed existing ${zipName}`);
    }

    try {
        // Create browser-specific build directory
        const buildDir = path.join(rootDir, `dist-${browser.toLowerCase()}`);
        
        // Copy dist directory to browser-specific directory
        if (fs.existsSync(buildDir)) {
            execSync(`rm -rf "${buildDir}"`, { stdio: 'pipe' });
        }
        execSync(`cp -r "${distDir}" "${buildDir}"`, { stdio: 'pipe' });
        
        // Create browser-specific manifest
        createBrowserSpecificManifest(browser, buildDir);
        
        // Create ZIP file from browser-specific directory
        // Change to build directory so zip contains files at root level
        process.chdir(buildDir);
        
        // Use system zip command (cross-platform)
        const relativePath = path.relative(buildDir, zipPath);
        execSync(`zip -r "${relativePath}" .`, { stdio: 'pipe' });
        
        // Clean up browser-specific directory
        process.chdir(rootDir);
        execSync(`rm -rf "${buildDir}"`, { stdio: 'pipe' });
        
        // Get file size
        const stats = fs.statSync(zipPath);
        const fileSizeInKB = (stats.size / 1024).toFixed(1);
        
        console.log(`✅ ${browser} package created: ${zipName}`);
        console.log(`📊 Package size: ${fileSizeInKB} KB`);
        console.log(`📍 Location: ${zipPath}`);
        
        return true;
    } catch (error) {
        console.error(`❌ Failed to create ${browser} package:`, error.message);
        return false;
    }
}

function createBrowserSpecificManifest(browser, buildDir) {
    const manifestPath = path.join(buildDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    if (browser === 'Firefox') {
        // Convert to Manifest V2 for Firefox compatibility
        manifest.manifest_version = 2;
        
        // Convert background service_worker to scripts
        if (manifest.background && manifest.background.service_worker) {
            manifest.background = {
                scripts: [manifest.background.service_worker],
                persistent: false
            };
        }
        
        // Convert action to browser_action (V2 syntax)
        if (manifest.action) {
            manifest.browser_action = manifest.action;
            delete manifest.action;
        }
        
        // Move host_permissions to permissions (V2 syntax)
        if (manifest.host_permissions) {
            manifest.permissions = [...(manifest.permissions || []), ...manifest.host_permissions];
            delete manifest.host_permissions;
        }
        
        // Add extension ID for Firefox
        manifest.browser_specific_settings = {
            gecko: {
                id: "sgs-bot@mongkon.ch",
                strict_min_version: "78.0"
            }
        };
        
        // Add web_accessible_resources if needed (V2 format)
        if (manifest.web_accessible_resources) {
            manifest.web_accessible_resources = manifest.web_accessible_resources.flatMap(resource => 
                resource.resources || []
            );
        }
    }
    
    // Write the modified manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`📝 Created ${browser}-specific manifest (v${manifest.manifest_version})`);
}

// Create packages for both browsers
console.log('🔄 Creating Chrome package...');
const chromeSuccess = createPackage('Chrome', chromeZipPath, chromeZipName);

console.log('');
console.log('🔄 Creating Firefox package...');
const firefoxSuccess = createPackage('Firefox', firefoxZipPath, firefoxZipName);

console.log('');
if (chromeSuccess && firefoxSuccess) {
    console.log('🎉 All packages created successfully!');
    console.log('');
    console.log('🚀 Ready for store uploads!');
    console.log('📋 Next steps:');
    console.log('   📱 Chrome Web Store:');
    console.log('      1. Go to https://chrome.google.com/webstore/devconsole');
    console.log(`      2. Upload: ${chromeZipName}`);
    console.log('   🦊 Firefox Add-ons:');
    console.log('      1. Go to https://addons.mozilla.org/developers/');
    console.log(`      2. Upload: ${firefoxZipName}`);
} else {
    console.log('⚠️  Some packages failed to create. Check the errors above.');
    
    // Fallback: suggest manual zip creation
    console.log('');
    console.log('📝 Manual packaging instructions:');
    console.log('   1. Navigate to the dist/ folder');
    console.log('   2. Select all files and folders inside dist/');
    console.log('   3. Create a ZIP archive');
    console.log('   4. Upload the ZIP to the respective store');
    
    process.exit(1);
}