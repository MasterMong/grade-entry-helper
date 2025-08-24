/**
 * Legacy Bridge
 * Provides compatibility with the original content-script.js functionality
 * This ensures existing functionality remains accessible during transition
 */

// Expose legacy functions to global scope for backward compatibility
export function createLegacyBridge(extensionCore) {
  // Wait for extension to be initialized
  extensionCore.initialize().then(() => {
    const controller = extensionCore.controller;
    
    if (controller && controller.pageType === 'grade-entry') {
      // Expose legacy function names
      window.fillGradesFromClipboard = controller.fillFromClipboard.bind(controller);
      window.clearGradeColumns = controller.clearAllValues.bind(controller);
      window.showDetectedColumns = controller.showDetectedColumns.bind(controller);
      
      console.log('Legacy bridge: Exposed compatibility functions');
      console.log('Available functions:');
      console.log('- fillGradesFromClipboard()');
      console.log('- clearGradeColumns()'); 
      console.log('- showDetectedColumns()');
    }
  }).catch(error => {
    console.error('Legacy bridge: Failed to initialize:', error);
  });
}