/**
 * SGS Page Detection System
 * Identifies the current SGS page type and validates page readiness
 */

import { SGS_PATTERNS, SGS_SELECTORS } from '../shared/constants/SGSSelectors.js';
import { CONFIG } from '../shared/constants/Config.js';

export class SGSPageDetector {
  /**
   * Detect the current SGS page type based on URL and DOM elements
   * @returns {string} Page type ('grade-entry', 'student-list', 'reports', 'settings', 'unknown')
   */
  static detectPageType() {
    const url = window.location.href;
    
    // Check each known page pattern
    for (const [pageType, pattern] of Object.entries(SGS_PATTERNS)) {
      if (pattern.urlPattern && pattern.urlPattern.test(url)) {
        // Validate page has required DOM elements
        if (this.validatePageElements(pageType)) {
          return pageType;
        }
      }
    }
    
    return 'unknown';
  }
  
  /**
   * Validate that the page has required DOM elements for the detected page type
   * @param {string} pageType - The detected page type
   * @returns {boolean} True if page has required elements
   */
  static validatePageElements(pageType) {
    const selectors = SGS_SELECTORS[pageType];
    if (!selectors) return false;
    
    switch (pageType) {
      case 'grade-entry':
        // Check for grade table and form elements
        return !!(
          document.querySelector(selectors.gradeTable) &&
          document.querySelector(selectors.form)
        );
      
      case 'student-list':
        // Check for student table (when implemented)
        return !!document.querySelector(selectors.studentTable || 'body');
      
      case 'reports':
        // Check for report container (when implemented)
        return !!document.querySelector(selectors.reportContainer || 'body');
      
      case 'settings':
        // Check for settings form (when implemented)
        return !!document.querySelector(selectors.settingsForm || 'body');
      
      default:
        return false;
    }
  }
  
  /**
   * Check if the current page is supported by the extension
   * @returns {boolean} True if page is supported
   */
  static isPageSupported() {
    const pageType = this.detectPageType();
    return pageType !== 'unknown' && CONFIG.features[pageType];
  }
  
  /**
   * Get supported features for the current page
   * @returns {Object|null} Feature configuration or null if unsupported
   */
  static getPageFeatures() {
    const pageType = this.detectPageType();
    return CONFIG.features[pageType] || null;
  }
  
  /**
   * Check if page is on the correct SGS domain
   * @returns {boolean} True if on SGS domain
   */
  static isOnSGSDomain() {
    return window.location.href.includes(CONFIG.sgs.baseUrl);
  }
  
  /**
   * Wait for page to be ready before extension initialization
   * @param {number} timeout - Maximum wait time in ms
   * @returns {Promise<boolean>} True if page is ready
   */
  static waitForPageReady(timeout = 10000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkReady = () => {
        // Check if document is loaded
        if (document.readyState !== 'complete') {
          if (Date.now() - startTime < timeout) {
            setTimeout(checkReady, 100);
          } else {
            resolve(false);
          }
          return;
        }
        
        // Check if page type is detectable
        const pageType = this.detectPageType();
        if (pageType === 'unknown') {
          if (Date.now() - startTime < timeout) {
            setTimeout(checkReady, 100);
          } else {
            resolve(false);
          }
          return;
        }
        
        resolve(true);
      };
      
      checkReady();
    });
  }
  
  /**
   * Get page-specific initialization requirements
   * @param {string} pageType - The page type
   * @returns {Object} Initialization requirements
   */
  static getInitializationRequirements(pageType) {
    const requirements = {
      'grade-entry': {
        waitForElements: [
          SGS_SELECTORS['grade-entry'].gradeTable,
          SGS_SELECTORS['grade-entry'].form
        ],
        waitForScripts: ['__doPostBack'], // ASP.NET postback function
        dependsOnUserAction: ['subjectDropdown', 'sectionDropdown'] // Requires user to select dropdowns
      },
      
      'student-list': {
        waitForElements: [SGS_SELECTORS['student-list'].studentTable || 'body'],
        waitForScripts: [],
        dependsOnUserAction: []
      },
      
      'reports': {
        waitForElements: [SGS_SELECTORS['reports'].reportContainer || 'body'],
        waitForScripts: [],
        dependsOnUserAction: []
      },
      
      'settings': {
        waitForElements: [SGS_SELECTORS['settings'].settingsForm || 'body'],
        waitForScripts: [],
        dependsOnUserAction: []
      }
    };
    
    return requirements[pageType] || {
      waitForElements: [],
      waitForScripts: [],
      dependsOnUserAction: []
    };
  }
  
  /**
   * Debug information about the current page
   * @returns {Object} Debug information
   */
  static getDebugInfo() {
    return {
      url: window.location.href,
      pageType: this.detectPageType(),
      isSupported: this.isPageSupported(),
      isOnSGSDomain: this.isOnSGSDomain(),
      documentReady: document.readyState,
      features: this.getPageFeatures(),
      timestamp: new Date().toISOString()
    };
  }
}