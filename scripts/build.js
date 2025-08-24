#!/usr/bin/env node

/**
 * Build Script for Grade Entry Helper Extension
 * Bundles ES6 modules for browser extension compatibility
 */

import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Build configuration
const isDev = process.argv.includes('--dev');
const isWatch = process.argv.includes('--watch');

console.log(`🔨 Building Grade Entry Helper Extension (${isDev ? 'development' : 'production'})`);

const buildConfig = {
  contentScripts: [
    {
      input: 'src/content-scripts/grade-entry.js',
      output: 'dist/content-scripts/grade-entry.js'
    }
  ],
  backgroundScript: {
    input: 'background.js',
    output: 'dist/background.js'
  },
  popup: {
    input: 'popup.js',
    output: 'dist/popup.js'
  },
  assets: [
    'popup.html',
    'manifest.json',
    'logo.svg'
  ]
};

/**
 * Create Rollup configuration
 */
function createRollupConfig(input, output) {
  return {
    input: path.resolve(rootDir, input),
    output: {
      file: path.resolve(rootDir, output),
      format: 'es',
      sourcemap: isDev,
      banner: `/* Grade Entry Helper v2.0.0 - Built ${new Date().toISOString()} */`,
      inlineDynamicImports: true // Inline all dynamic imports into single file
    },
    external: [], // Don't externalize any dependencies for content scripts
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: false
      }),
      !isDev && terser({
        compress: {
          drop_console: !isDev,
          drop_debugger: true
        },
        mangle: {
          properties: false
        }
      })
    ].filter(Boolean)
  };
}

/**
 * Clean dist directory
 */
async function cleanDist() {
  try {
    await fs.rm(distDir, { recursive: true, force: true });
    console.log('📁 Cleaned dist directory');
  } catch (error) {
    // Directory might not exist, that's ok
  }
  
  await fs.mkdir(distDir, { recursive: true });
  await fs.mkdir(path.join(distDir, 'content-scripts'), { recursive: true });
}

/**
 * Build content scripts using Rollup
 */
async function buildContentScripts() {
  console.log('📦 Building content scripts...');
  
  for (const script of buildConfig.contentScripts) {
    const config = createRollupConfig(script.input, script.output);
    
    try {
      const bundle = await rollup(config);
      await bundle.write(config.output);
      await bundle.close();
      
      console.log(`✅ Built ${script.output}`);
    } catch (error) {
      console.error(`❌ Failed to build ${script.input}:`, error);
      throw error;
    }
  }
}

/**
 * Build simple scripts (background, popup) - no bundling needed
 */
async function buildSimpleScripts() {
  console.log('📦 Building simple scripts...');
  
  const scripts = [
    buildConfig.backgroundScript,
    buildConfig.popup
  ];
  
  for (const script of scripts) {
    try {
      const inputPath = path.resolve(rootDir, script.input);
      const outputPath = path.resolve(rootDir, script.output);
      
      const content = await fs.readFile(inputPath, 'utf8');
      await fs.writeFile(outputPath, content);
      
      console.log(`✅ Copied ${script.output}`);
    } catch (error) {
      console.error(`❌ Failed to copy ${script.input}:`, error);
      throw error;
    }
  }
}

/**
 * Copy static assets
 */
async function copyAssets() {
  console.log('📋 Copying assets...');
  
  for (const asset of buildConfig.assets) {
    try {
      const inputPath = path.resolve(rootDir, asset);
      const outputPath = path.resolve(distDir, asset);
      
      const content = await fs.readFile(inputPath, 'utf8');
      await fs.writeFile(outputPath, content);
      
      console.log(`✅ Copied ${asset}`);
    } catch (error) {
      console.error(`❌ Failed to copy ${asset}:`, error);
      throw error;
    }
  }
}

/**
 * Update manifest.json for production
 */
async function updateManifest() {
  const manifestPath = path.join(distDir, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  
  // Update content script paths
  manifest.content_scripts = manifest.content_scripts.map(script => ({
    ...script,
    js: script.js.map(file => {
      if (file.startsWith('src/')) {
        return file.replace('src/', '');
      }
      return file;
    })
  }));
  
  // Update web_accessible_resources paths\n  if (manifest.web_accessible_resources) {\n    manifest.web_accessible_resources = manifest.web_accessible_resources.map(resource => ({\n      ...resource,\n      resources: resource.resources.map(file => {\n        if (file.startsWith('src/')) {\n          return file.replace('src/', '');\n        }\n        return file;\n      })\n    }));\n  }\n  \n  // Update icon paths\n  if (manifest.action && manifest.action.default_icon) {\n    Object.keys(manifest.action.default_icon).forEach(size => {\n      const iconPath = manifest.action.default_icon[size];\n      if (iconPath.startsWith('icons/')) {\n        // Icon paths are already correct\n      }\n    });\n  }\n  \n  if (manifest.icons) {\n    Object.keys(manifest.icons).forEach(size => {\n      const iconPath = manifest.icons[size];\n      if (iconPath.startsWith('icons/')) {\n        // Icon paths are already correct\n      }\n    });\n  }\n  \n  // Add version info for production\n  if (!isDev) {\n    manifest.version = '2.0.0';\n    manifest.description += ' (Production Build)';\n  }
  
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Updated manifest.json');
}

/**
 * Generate build info
 */
async function generateBuildInfo() {
  const buildInfo = {
    version: '2.0.0',
    buildTime: new Date().toISOString(),
    environment: isDev ? 'development' : 'production',
    gitCommit: process.env.GITHUB_SHA || 'unknown',
    features: {
      sourceMaps: isDev,
      minified: !isDev,
      debugMode: isDev
    }
  };
  
  await fs.writeFile(
    path.join(distDir, 'build-info.json'), 
    JSON.stringify(buildInfo, null, 2)
  );
  console.log('✅ Generated build info');
}

/**
 * Validate build output
 */
async function validateBuild() {
  console.log('🔍 Validating build...');
  
  const requiredFiles = [
    'manifest.json',
    'background.js',
    'popup.js',
    'popup.html',
    'content-scripts/grade-entry.js'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(distDir, file);
    try {
      await fs.access(filePath);
      console.log(`✅ Found ${file}`);
    } catch (error) {
      console.error(`❌ Missing ${file}`);
      throw new Error(`Build validation failed: ${file} not found`);
    }
  }
  
  // Check file sizes
  const stats = await fs.stat(path.join(distDir, 'content-scripts/grade-entry.js'));
  console.log(`📊 Content script size: ${(stats.size / 1024).toFixed(1)} KB`);
  
  if (stats.size > 500 * 1024) { // 500KB warning
    console.warn('⚠️  Content script is quite large. Consider code splitting.');
  }
}

/**
 * Watch mode implementation
 */
async function setupWatch() {
  if (!isWatch) return;
  
  console.log('👀 Setting up watch mode...');
  
  const chokidar = await import('chokidar');
  const watcher = chokidar.watch('src/**/*.js', {
    ignored: /(^|[\/\\])\../,
    persistent: true
  });
  
  watcher.on('change', async (filePath) => {
    console.log(`📝 File changed: ${filePath}`);
    try {
      await buildContentScripts();
      console.log('✅ Rebuild completed');
    } catch (error) {
      console.error('❌ Rebuild failed:', error);
    }
  });
  
  console.log('👀 Watching for changes...');
}

/**
 * Main build function
 */
async function build() {
  try {
    const startTime = Date.now();
    
    await cleanDist();
    await buildContentScripts();
    await buildSimpleScripts();
    await copyAssets();
    
    // Convert SVG logo to PNG icons
    const { default: convertSvgToPng } = await import('./convert-icons.js');
    await convertSvgToPng();
    
    await updateManifest();
    await generateBuildInfo();
    await validateBuild();
    
    const buildTime = Date.now() - startTime;
    console.log(`🎉 Build completed in ${buildTime}ms`);
    
    await setupWatch();
    
  } catch (error) {
    console.error('💥 Build failed:', error);
    process.exit(1);
  }
}

// Run build
build();