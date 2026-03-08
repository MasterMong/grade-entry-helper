/**
 * Extension Core Coordinator
 * Main coordinator for the multi-page SGS extension system
 */

import { SGSPageDetector } from './SGSPageDetector.js';
import { CONFIG } from '../shared/constants/Config.js';
import { MESSAGES } from '../shared/constants/Messages.js';

export class ExtensionCore {
  constructor() {
    this.pageType = 'unknown';
    this.controller = null;
    this.sharedServices = new Map();
    this.isInitialized = false;
    this.initializationPromise = null;
    
    // Bind methods
    this.reportError = this.reportError.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
  }
  
  /**
   * Initialize the extension core system
   * @returns {Promise<boolean>} True if initialization successful
   */
  async initialize() {
    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }
  
  /**
   * Perform the actual initialization
   * @private
   */
  async _performInitialization() {
    try {
      this.log('Starting extension initialization');
      
      // Check if we're on a supported SGS page
      if (!SGSPageDetector.isOnSGSDomain()) {
        this.log('Not on SGS domain, skipping initialization');
        return false;
      }
      
      // Wait for page to be ready
      const pageReady = await SGSPageDetector.waitForPageReady();
      if (!pageReady) {
        throw new Error('Page failed to become ready within timeout');
      }
      
      // Detect page type
      this.pageType = SGSPageDetector.detectPageType();
      this.log(`Detected page type: ${this.pageType}`);
      
      if (this.pageType === 'unknown') {
        this.log('Unknown page type, extension not activated');
        return false;
      }
      
      if (!SGSPageDetector.isPageSupported()) {
        this.log(`Page type '${this.pageType}' not supported`);
        return false;
      }
      
      // Load shared services
      await this.loadSharedServices();
      
      // Load page-specific controller
      await this.loadPageController();
      
      // Set up page change monitoring for SPA-like behavior
      this.setupPageChangeMonitoring();
      
      this.isInitialized = true;
      this.log('Extension initialization completed successfully');
      
      return true;
      
    } catch (error) {
      this.reportError('Extension initialization failed', error);
      return false;
    }
  }
  
  /**
   * Load shared services used across all pages
   * @private
   */
  async loadSharedServices() {
    try {
      this.log('Loading shared services');
      
      // Load NotificationManager
      const { NotificationManager } = await import('../shared/ui/NotificationManager.js');
      this.registerSharedService('NotificationManager', new NotificationManager());
      
      // Load StyleManager
      const { StyleManager } = await import('../shared/ui/StyleManager.js');
      this.registerSharedService('StyleManager', new StyleManager());
      
      // Load DOMUtils
      const { DOMUtils } = await import('../shared/utils/DOMUtils.js');
      this.registerSharedService('DOMUtils', new DOMUtils());
      
      // Load SGSFormHandler
      const { SGSFormHandler } = await import('../shared/utils/SGSFormHandler.js');
      this.registerSharedService('SGSFormHandler', new SGSFormHandler());
      
      this.log(`Loaded ${this.sharedServices.size} shared services`);
      
    } catch (error) {
      throw new Error(`Failed to load shared services: ${error.message}`);
    }
  }
  
  /**
   * Load the appropriate page controller based on detected page type
   * @private
   */
  async loadPageController() {
    try {
      this.log(`Loading page controller for: ${this.pageType}`);
      
      const controllerMap = {
        'grade-entry': () => import('../pages/gradeEntry/GradeEntryController.js')
        // Future controllers will be added here:
        // 'student-list': () => import('../pages/studentList/StudentListController.js'),
        // 'reports': () => import('../pages/reports/ReportController.js'),
        // 'settings': () => import('../pages/settings/SettingsController.js')
      };
      
      const loaderFunction = controllerMap[this.pageType];
      if (!loaderFunction) {
        throw new Error(`Controller for page type '${this.pageType}' not implemented yet`);
      }
      
      const controllerModule = await loaderFunction();
      const ControllerClass = Object.values(controllerModule)[0]; // Get the default export
      
      this.controller = new ControllerClass(this, this.pageType);
      await this.controller.initialize();
      
      this.log(`Page controller loaded and initialized: ${this.pageType}`);
      
    } catch (error) {
      throw new Error(`Failed to load page controller: ${error.message}`);
    }
  }
  
  /**
   * Register a shared service
   * @param {string} name - Service name
   * @param {Object} service - Service instance
   */
  registerSharedService(name, service) {
    this.sharedServices.set(name, service);
    this.log(`Shared service '${name}' registered`);
  }
  
  /**
   * Get a shared service
   * @param {string} name - Service name
   * @returns {Object|null} Service instance or null if not found
   */
  getSharedService(name) {
    return this.sharedServices.get(name) || null;
  }
  
  /**
   * Set up monitoring for page changes (for SPA-like behavior)
   * @private
   */
  setupPageChangeMonitoring() {
    // Monitor URL changes
    let currentUrl = window.location.href;
    
    const checkUrlChange = () => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.handlePageChange();
      }
    };
    
    // Monitor using multiple methods for robustness
    setInterval(checkUrlChange, 1000);
    
    // Listen for popstate events
    window.addEventListener('popstate', this.handlePageChange);
    
    // Monitor DOM changes that might indicate page transitions
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        // Check if major page structure changed
        const significantChange = mutations.some(mutation => 
          mutation.type === 'childList' && 
          mutation.addedNodes.length > 0 &&
          Array.from(mutation.addedNodes).some(node => 
            node.nodeType === Node.ELEMENT_NODE && 
            (node.tagName === 'FORM' || node.tagName === 'TABLE')
          )
        );
        
        if (significantChange) {
          setTimeout(() => this.handlePageChange(), 500);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
  
  /**
   * Handle page changes (like navigation within SGS system)
   * @private
   */
  async handlePageChange() {
    try {
      const newPageType = SGSPageDetector.detectPageType();
      
      if (newPageType !== this.pageType && newPageType !== 'unknown') {
        this.log(`Page change detected: ${this.pageType} -> ${newPageType}`);
        
        // Cleanup current controller
        if (this.controller) {
          await this.controller.destroy();
        }
        
        // Initialize for new page
        this.pageType = newPageType;
        this.isInitialized = false;
        this.initializationPromise = null;
        
        // Re-initialize
        await this.initialize();
      }
    } catch (error) {
      this.reportError('Error handling page change', error);
    }
  }
  
  /**
   * Report errors to centralized error handling
   * @param {string} context - Context where error occurred
   * @param {Error} error - The error object
   * @param {string} source - Source of the error (optional)
   * @param {boolean} skipNotification - Skip showing notification (when caller already handles it)
   */
  reportError(context, error, source = 'core', skipNotification = false) {
    const errorInfo = {
      context,
      message: error?.message || 'Unknown error',
      source,
      pageType: this.pageType,
      timestamp: new Date().toISOString(),
      stack: error?.stack
    };

    // Log the error
    console.error(`[EXTENSION ERROR] ${context}:`, error);

    // Show user-friendly notification (only if not already handled by caller)
    if (!skipNotification) {
      const notificationManager = this.getSharedService('NotificationManager');
      if (notificationManager) {
        const userMessage = this.getUserFriendlyErrorMessage(error);
        notificationManager.show(userMessage, 'error', 8000);
      }
    }
    
    // Store error for debugging (could be sent to analytics in future)
    if (!window.sgsExtensionErrors) {
      window.sgsExtensionErrors = [];
    }
    window.sgsExtensionErrors.push(errorInfo);
  }
  
  /**
   * Convert technical errors to user-friendly messages
   * @param {Error} error - The error object
   * @returns {string} User-friendly error message
   * @private
   */
  getUserFriendlyErrorMessage(error) {
    const message = error?.message || '';
    
    if (message.includes('clipboard')) {
      return MESSAGES.errors.clipboardApiUnavailable;
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection.';
    }
    if (message.includes('timeout')) {
      return 'The operation took too long. Please try again.';
    }
    
    // Default generic message
    return 'An unexpected error occurred. Please try again.';
  }
  
  /**
   * Get extension status and debug information
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      pageType: this.pageType,
      hasController: !!this.controller,
      sharedServicesCount: this.sharedServices.size,
      pageSupported: SGSPageDetector.isPageSupported(),
      features: SGSPageDetector.getPageFeatures(),
      performance: this.controller?.getPerformanceMetrics?.(),
      errors: window.sgsExtensionErrors?.length || 0,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Logging utility with core context
   * @param {string} message - Log message
   * @param {string} level - Log level
   */
  log(message, level = 'info') {
    if (!CONFIG.debug.enabled) {return;}
    
    const prefix = '[CORE]';
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
   * Clean up extension resources
   */
  async destroy() {
    try {
      this.log('Destroying extension core');
      
      if (this.controller) {
        await this.controller.destroy();
      }
      
      // Cleanup shared services
      for (const [name, service] of this.sharedServices) {
        if (service && typeof service.destroy === 'function') {
          await service.destroy();
        }
      }
      
      this.sharedServices.clear();
      this.isInitialized = false;
      
    } catch (error) {
      console.error('Error during extension cleanup:', error);
    }
  }
}

// Export singleton instance
export const extensionCore = new ExtensionCore();