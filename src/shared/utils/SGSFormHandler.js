/**
 * SGS Form Handler
 * Handles ASP.NET postback and form submission for SGS system
 */

import { SGS_SELECTORS } from '../constants/SGSSelectors.js';
import { CONFIG } from '../constants/Config.js';

export class SGSFormHandler {
  constructor() {
    this.pageScriptInjected = false;
  }
  
  /**
   * Initialize form handler and inject page script for postback support
   */
  initialize() {
    if (!this.pageScriptInjected) {
      this.injectPageScript();
      this.pageScriptInjected = true;
    }
  }
  
  /**
   * Inject script into page context to handle postMessage events for __doPostBack
   * @private
   */
  injectPageScript() {
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        window.addEventListener('message', function(event) {
          if (event.source !== window || !event.data.type) return;
          
          if (event.data.type === 'EXECUTE_DOPOSTBACK') {
            if (typeof __doPostBack === 'function') {
              __doPostBack(event.data.eventTarget, event.data.eventArgument);
            } else {
              console.warn('__doPostBack function not found in page context');
            }
          }
        });
      })();
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }
  
  /**
   * Execute ASP.NET postback with multiple fallback methods
   * @param {string} eventTarget - Event target for postback
   * @param {string} eventArgument - Event argument for postback
   * @returns {Promise<boolean>} Success status
   */
  async executePostback(eventTarget, eventArgument = '') {
    // Method 1: Use Chrome extension API if available (bypasses CSP)
    try {
      if (chrome?.runtime?.sendMessage) {
        const response = await this.executeViaExtensionAPI(eventTarget, eventArgument);
        if (response.success) {
          return true;
        }
      }
    } catch (error) {
      console.log('Extension API method failed, trying fallbacks:', error);
    }
    
    // Method 2: Try direct __doPostBack if available in content script context
    if (typeof window.__doPostBack === 'function') {
      try {
        window.__doPostBack(eventTarget, eventArgument);
        return true;
      } catch (error) {
        console.log('Direct __doPostBack failed:', error);
      }
    }
    
    // Method 3: Use postMessage to execute in page context
    try {
      window.postMessage({
        type: 'EXECUTE_DOPOSTBACK',
        eventTarget: eventTarget,
        eventArgument: eventArgument
      }, '*');
      return true;
    } catch (error) {
      console.log('PostMessage method failed:', error);
    }
    
    // Method 4: Form submission fallback
    return this.executeViaFormSubmission(eventTarget, eventArgument);
  }
  
  /**
   * Execute postback via Chrome extension API
   * @param {string} eventTarget - Event target
   * @param {string} eventArgument - Event argument
   * @returns {Promise<Object>} Response from background script
   * @private
   */
  executeViaExtensionAPI(eventTarget, eventArgument) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'EXECUTE_POSTBACK',
        eventTarget,
        eventArgument
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response || { success: false });
        }
      });
    });
  }
  
  /**
   * Execute postback via form submission
   * @param {string} eventTarget - Event target
   * @param {string} eventArgument - Event argument
   * @returns {boolean} Success status
   * @private
   */
  executeViaFormSubmission(eventTarget, eventArgument) {
    try {
      const form = document.querySelector(SGS_SELECTORS['grade-entry'].form);
      if (!form) {
        throw new Error('Form not found');
      }
      
      // Get or create hidden inputs for postback
      let eventTargetInput = form.querySelector(`input[name="${CONFIG.sgs.aspnet.postbackEventTarget}"]`);
      let eventArgumentInput = form.querySelector(`input[name="${CONFIG.sgs.aspnet.postbackEventArgument}"]`);
      
      if (!eventTargetInput) {
        eventTargetInput = document.createElement('input');
        eventTargetInput.type = 'hidden';
        eventTargetInput.name = CONFIG.sgs.aspnet.postbackEventTarget;
        form.appendChild(eventTargetInput);
      }
      
      if (!eventArgumentInput) {
        eventArgumentInput = document.createElement('input');
        eventArgumentInput.type = 'hidden';
        eventArgumentInput.name = CONFIG.sgs.aspnet.postbackEventArgument;
        form.appendChild(eventArgumentInput);
      }
      
      // Set values and submit
      eventTargetInput.value = eventTarget;
      eventArgumentInput.value = eventArgument;
      
      form.submit();
      return true;
      
    } catch (error) {
      console.error('Form submission failed:', error);
      return false;
    }
  }
  
  /**
   * Set page size and trigger postback
   * @param {number} pageSize - Number of rows to display
   * @returns {Promise<boolean>} Success status
   */
  async setPageSize(pageSize) {
    const selectors = SGS_SELECTORS['grade-entry'];
    
    // Find and set page size input
    const pageSizeInput = document.querySelector(selectors.pageSize);
    if (!pageSizeInput) {
      throw new Error('Page size input not found');
    }
    
    pageSizeInput.value = pageSize;
    
    // Trigger postback for page size button
    const pageSizeButton = document.getElementById(selectors.pageSizeButton.replace('#', ''));
    if (!pageSizeButton) {
      throw new Error('Page size button not found');
    }
    
    // Extract postback parameters from button
    const href = pageSizeButton.getAttribute('href');
    if (href && href.includes('__doPostBack')) {
      const match = href.match(/javascript:__doPostBack\('([^']+)','([^']*)'\)/);
      if (match) {
        return this.executePostback(match[1], match[2]);
      }
    }
    
    // Fallback: try button click
    try {
      pageSizeButton.click();
      return true;
    } catch (error) {
      console.error('Button click failed:', error);
      return false;
    }
  }
  
  /**
   * Trigger field validation event (for grade inputs)
   * @param {HTMLInputElement} field - Input field
   * @param {string} value - Field value
   */
  triggerFieldValidation(field, value) {
    if (!field) {return;}
    
    // Set the value
    field.value = value;
    
    try {
      // Method 1: Try calling onchange handler if it exists
      if (field.onchange) {
        const fakeEvent = {
          target: field,
          srcElement: field,
          type: 'change',
          bubbles: true,
          cancelable: true,
          preventDefault: () => {},
          stopPropagation: () => {}
        };
        
        field.onchange.call(field, fakeEvent);
        return;
      }
      
      // Method 2: Try to call CheckValue function directly
      if (window.CheckValue && typeof window.CheckValue === 'function') {
        const onchangeAttr = field.getAttribute('onchange');
        if (onchangeAttr && onchangeAttr.includes('CheckValue')) {
          // Parse CheckValue parameters from onchange attribute
          const match = onchangeAttr.match(/CheckValue\(document\.all\('([^']+)'\),'([^']+)','([^']+)','([^']+)','([^']+)','([^']+)'\)/);
          if (match) {
            const [, fieldId, type, maxScore, studentId, totalField, gradeField] = match;
            window.CheckValue(field, type, maxScore, studentId, totalField, gradeField);
            return;
          }
        }
      }
      
      // Method 3: Dispatch change event
      const changeEvent = new Event('change', {
        bubbles: true,
        cancelable: true
      });
      field.dispatchEvent(changeEvent);
      
    } catch (error) {
      console.warn(`Could not trigger validation for field ${field.id}:`, error);
    }
  }
  
  /**
   * Check if required dropdowns are selected
   * @returns {Object} Validation result with status and message
   */
  checkRequiredDropdowns() {
    const selectors = SGS_SELECTORS['grade-entry'];
    
    const subjectDropdown = document.getElementById(selectors.subjectDropdown.replace('#', ''));
    const sectionDropdown = document.getElementById(selectors.sectionDropdown.replace('#', ''));
    
    if (!subjectDropdown || !sectionDropdown) {
      return {
        valid: false,
        message: 'Required dropdowns not found on page'
      };
    }
    
    const subjectSelected = subjectDropdown.value && subjectDropdown.value !== '--ANY--';
    const sectionSelected = sectionDropdown.value && sectionDropdown.value !== '--ANY--';
    
    if (subjectSelected && sectionSelected) {
      return { valid: true };
    }
    
    // Return appropriate error message in Thai
    if (!subjectSelected && !sectionSelected) {
      return {
        valid: false,
        message: 'กรุณาเลือก "รายวิชา" และ "กลุ่ม" ก่อนใช้งานปลั๊กอิน'
      };
    } else if (!subjectSelected) {
      return {
        valid: false,
        message: 'กรุณาเลือก "รายวิชา" ก่อนใช้งานปลั๊กอิน'
      };
    } else {
      return {
        valid: false,
        message: 'กรุณาเลือก "กลุ่ม" ก่อนใช้งานปลั๊กอิน'
      };
    }
  }
  
  /**
   * Get form's current state (ViewState, EventValidation, etc.)
   * @returns {Object} Form state data
   */
  getFormState() {
    const form = document.querySelector(SGS_SELECTORS['grade-entry'].form);
    if (!form) {return {};}
    
    const state = {};
    
    // Get ASP.NET view state
    const viewState = form.querySelector(`input[name="${CONFIG.sgs.aspnet.viewState}"]`);
    if (viewState) {
      state.viewState = viewState.value;
    }
    
    // Get event validation
    const eventValidation = form.querySelector(`input[name="${CONFIG.sgs.aspnet.eventValidation}"]`);
    if (eventValidation) {
      state.eventValidation = eventValidation.value;
    }
    
    return state;
  }
}