#!/usr/bin/env node

/**
 * Convert SVG logo to PNG icons for browser extension
 * This script converts the logo.svg file to multiple PNG sizes
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Icon sizes needed for browser extensions
const iconSizes = [16, 32, 48, 128];

async function convertSvgToPng() {
  try {
    console.log('🎨 Converting SVG logo to PNG icons...');
    
    // Check if logo.svg exists
    const svgPath = path.join(rootDir, 'logo.svg');
    try {
      await fs.access(svgPath);
    } catch (error) {
      throw new Error(`SVG file not found: ${svgPath}`);
    }

    // Create icons directory if it doesn't exist
    const iconsDir = path.join(distDir, 'icons');
    await fs.mkdir(iconsDir, { recursive: true });

    // Convert SVG to PNG for each size
    for (const size of iconSizes) {
      const pngPath = path.join(iconsDir, `icon-${size}.png`);
      
      await sharp(svgPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        })
        .png({
          compressionLevel: 9,
          adaptiveFiltering: true
        })
        .toFile(pngPath);
      
      console.log(`✅ Created ${size}x${size} icon: icons/icon-${size}.png`);
    }

    console.log('🎉 Icon conversion completed successfully');
    
  } catch (error) {
    console.error('💥 Icon conversion failed:', error);
    throw error;
  }
}

export default convertSvgToPng;

// Run the conversion if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  convertSvgToPng().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}