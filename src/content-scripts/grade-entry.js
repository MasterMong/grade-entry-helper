/**
 * Grade Entry Content Script
 * Entry point for the grade entry page functionality
 */

import { extensionCore } from '../core/ExtensionCore.js';
import { createLegacyBridge } from '../legacy-bridge.js';

// Wrap in IIFE with error handling
(async () => {
  try {
    // Check basic browser compatibility
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      throw new Error('Browser environment not available');
    }
    
    // Check for required DOM APIs
    if (!document.createElement || !document.querySelector || !document.addEventListener) {
      throw new Error('Required DOM APIs not available');
    }
    
    // Initialize the extension core
    console.log('Grade Entry Helper: Starting initialization...');
    const success = await extensionCore.initialize();
    
    if (success) {
      console.log('Grade Entry Helper: Initialization completed successfully');
      
      // Create legacy bridge for backward compatibility
      createLegacyBridge(extensionCore);
      
      // Expose extension status for debugging
      if (window.location.search.includes('debug=true')) {
        window.sgsExtensionCore = extensionCore;
        console.log('Debug mode: Extension core exposed as window.sgsExtensionCore');
      }
    } else {
      console.log('Grade Entry Helper: Initialization failed or page not supported');
    }
    
  } catch (error) {
    console.error('Grade Entry Helper: Critical initialization error:', error);
    
    // Show user-friendly error message
    setTimeout(() => {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 10000;
        padding: 12px 16px;
        background: #f44336;
        color: white;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 350px;
      `;
      notification.textContent = 'Grade Entry Helper failed to load. Please refresh the page and try again.';
      document.body.appendChild(notification);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 5000);
    }, 1000);
  }
})();