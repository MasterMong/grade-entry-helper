/**
 * Base Page Controller
 * Abstract base class for all SGS page controllers
 */

import { CONFIG } from '../shared/constants/Config.js';
import { MESSAGES } from '../shared/constants/Messages.js';

export class BasePageController {
  constructor(core, pageType) {
    this.core = core;
    this.pageType = pageType;
    this.features = CONFIG.features[pageType] || {};
    this.ui = null;
    this.services = new Map();
    this.isInitialized = false;
    
    // Bind methods to preserve context
    this.handleError = this.handleError.bind(this);
    this.showNotification = this.showNotification.bind(this);
  }
  
  /**
   * Initialize the page controller
   * Must be implemented by subclasses
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }
  
  /**
   * Get page-specific actions for the control panel
   * Must be implemented by subclasses
   */
  getActions() {
    throw new Error('getActions() must be implemented by subclass');
  }
  
  /**
   * Clean up resources when page controller is destroyed
   */
  async destroy() {
    try {
      // Destroy UI components
      if (this.ui && typeof this.ui.destroy === 'function') {
        await this.ui.destroy();
      }
      
      // Clean up services
      for (const [name, service] of this.services) {
        if (service && typeof service.destroy === 'function') {
          await service.destroy();
        }
      }
      
      this.services.clear();
      this.isInitialized = false;
      
      this.log('Page controller destroyed');
    } catch (error) {
      this.handleError('Error during controller cleanup', error);
    }
  }
  
  /**
   * Register a service with the controller
   * @param {string} name - Service name
   * @param {Object} service - Service instance
   */
  registerService(name, service) {
    this.services.set(name, service);
    this.log(`Service '${name}' registered`);
  }
  
  /**
   * Get a registered service
   * @param {string} name - Service name
   * @returns {Object|null} Service instance or null if not found
   */
  getService(name) {
    return this.services.get(name) || null;
  }
  
  /**
   * Check if a feature is enabled for this page
   * @param {string} featureName - Feature name
   * @returns {boolean} True if feature is enabled
   */
  isFeatureEnabled(featureName) {
    return !!(this.features[featureName]);
  }
  
  /**
   * Show notification to user
   * @param {string} message - Notification message
   * @param {string} type - Notification type ('info', 'success', 'error')
   * @param {number} duration - Duration in ms (0 for persistent)
   */
  showNotification(message, type = 'info', duration) {
    const notificationManager = this.core.getSharedService('NotificationManager');
    if (notificationManager) {
      notificationManager.show(message, type, duration);
    } else {
      // Fallback: console log if notification manager not available
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  /**
   * Handle errors consistently across all controllers
   * @param {string} context - Context where error occurred
   * @param {Error} error - The error object
   */
  handleError(context, error) {
    const errorMessage = error?.message || 'Unknown error';

    this.log(`${context}: ${errorMessage}`, 'error');
    // Show the actual error message (not a generic one) with longer duration for readability
    this.showNotification(errorMessage, 'error', 8000);

    // Report to core for logging/storage only (notification already shown above)
    if (this.core && typeof this.core.reportError === 'function') {
      this.core.reportError(context, error, this.pageType, true);
    }
  }
  
  /**
   * Logging utility with page context
   * @param {string} message - Log message
   * @param {string} level - Log level ('info', 'warn', 'error', 'debug')
   */
  log(message, level = 'info') {
    if (!CONFIG.debug.enabled) {return;}
    
    const prefix = `[${this.pageType.toUpperCase()}]`;
    const timestamp = new Date().toLocaleTimeString();
    
    switch (level) {
      case 'error':
        console.error(`${prefix} ${timestamp}: ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${timestamp}: ${message}`);
        break;
      case 'debug':
        if (CONFIG.debug.logLevel === 'debug') {
          console.debug(`${prefix} ${timestamp}: ${message}`);
        }
        break;
      default:
        console.log(`${prefix} ${timestamp}: ${message}`);
    }
  }
  
  /**
   * Wait for required DOM elements to be available
   * @param {Array<string>} selectors - Array of CSS selectors to wait for
   * @param {number} timeout - Maximum wait time in ms
   * @returns {Promise<boolean>} True if all elements found
   */
  async waitForElements(selectors, timeout = 5000) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkElements = () => {
        const foundElements = selectors.map(selector => 
          document.querySelector(selector) !== null
        );
        
        const allFound = foundElements.every(found => found);
        
        if (allFound) {
          this.log(`All required elements found: ${selectors.join(', ')}`);
          resolve(true);
        } else if (Date.now() - startTime < timeout) {
          setTimeout(checkElements, 100);
        } else {
          const missing = selectors.filter((_, index) => !foundElements[index]);
          this.log(`Timeout waiting for elements: ${missing.join(', ')}`, 'warn');
          resolve(false);
        }
      };
      
      checkElements();
    });
  }
  
  /**
   * Wait for global functions to be available (like __doPostBack)
   * @param {Array<string>} functionNames - Array of function names to wait for
   * @param {number} timeout - Maximum wait time in ms
   * @returns {Promise<boolean>} True if all functions found
   */
  async waitForFunctions(functionNames, timeout = 5000) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkFunctions = () => {
        const foundFunctions = functionNames.map(funcName => 
          typeof window[funcName] === 'function'
        );
        
        const allFound = foundFunctions.every(found => found);
        
        if (allFound) {
          this.log(`All required functions found: ${functionNames.join(', ')}`);
          resolve(true);
        } else if (Date.now() - startTime < timeout) {
          setTimeout(checkFunctions, 100);
        } else {
          const missing = functionNames.filter((_, index) => !foundFunctions[index]);
          this.log(`Timeout waiting for functions: ${missing.join(', ')}`, 'warn');
          resolve(false);
        }
      };
      
      checkFunctions();
    });
  }
  
  /**
   * Get performance timing information
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    return {
      pageType: this.pageType,
      initialized: this.isInitialized,
      servicesCount: this.services.size,
      memoryUsage: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
      } : null,
      timestamp: performance.now()
    };
  }
}