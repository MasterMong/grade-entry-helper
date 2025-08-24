/**
 * DOM Utilities
 * Common DOM manipulation and query utilities
 */

export class DOMUtils {
  /**
   * Wait for elements to appear in the DOM
   * @param {Array<string>} selectors - CSS selectors to wait for
   * @param {number} timeout - Maximum wait time in ms
   * @returns {Promise<Array<Element>>} Promise resolving to found elements
   */
  static async waitForElements(selectors, timeout = 5000) {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkElements = () => {
        const elements = selectors.map(selector => document.querySelector(selector));
        const allFound = elements.every(el => el !== null);
        
        if (allFound) {
          resolve(elements);
        } else if (Date.now() - startTime < timeout) {
          setTimeout(checkElements, 100);
        } else {
          const missing = selectors.filter((selector, index) => !elements[index]);
          reject(new Error(`Timeout waiting for elements: ${missing.join(', ')}`));
        }
      };
      
      checkElements();
    });
  }
  
  /**
   * Find all elements matching a pattern with retry logic
   * @param {string} baseSelector - Base CSS selector
   * @param {RegExp} pattern - Pattern to match against element attributes
   * @param {string} attribute - Attribute to check pattern against
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<Array<Element>>} Found elements
   */
  static async findElementsWithPattern(baseSelector, pattern, attribute = 'id', maxRetries = 3) {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      const elements = Array.from(document.querySelectorAll(baseSelector))
        .filter(el => pattern.test(el.getAttribute(attribute) || ''));
      
      if (elements.length > 0) {
        return elements;
      }
      
      attempts++;
      if (attempts < maxRetries) {
        await this.delay(500); // Wait 500ms between attempts
      }
    }
    
    return [];
  }
  
  /**
   * Create element with attributes and styles
   * @param {string} tagName - HTML tag name
   * @param {Object} options - Element options
   * @returns {HTMLElement} Created element
   */
  static createElement(tagName, options = {}) {
    const element = document.createElement(tagName);
    
    if (options.id) element.id = options.id;
    if (options.className) element.className = options.className;
    if (options.textContent) element.textContent = options.textContent;
    if (options.innerHTML) element.innerHTML = options.innerHTML;
    
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    
    if (options.style) {
      if (typeof options.style === 'string') {
        element.style.cssText = options.style;
      } else {
        Object.assign(element.style, options.style);
      }
    }
    
    if (options.eventListeners) {
      Object.entries(options.eventListeners).forEach(([event, handler]) => {
        element.addEventListener(event, handler);
      });
    }
    
    return element;
  }
  
  /**
   * Remove all child elements from a parent
   * @param {Element} parent - Parent element
   */
  static clearChildren(parent) {
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
  }
  
  /**
   * Check if element is visible in viewport
   * @param {Element} element - Element to check
   * @returns {boolean} True if element is visible
   */
  static isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  
  /**
   * Scroll element into view smoothly
   * @param {Element} element - Element to scroll to
   * @param {Object} options - Scroll options
   */
  static scrollIntoView(element, options = {}) {
    const defaultOptions = {
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    };
    
    element.scrollIntoView({ ...defaultOptions, ...options });
  }
  
  /**
   * Get text content from element, handling various scenarios
   * @param {Element} element - Element to get text from
   * @returns {string} Cleaned text content
   */
  static getCleanText(element) {
    if (!element) return '';
    
    return element.textContent
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .trim();
  }
  
  /**
   * Find closest parent element matching selector
   * @param {Element} element - Starting element
   * @param {string} selector - CSS selector to match
   * @returns {Element|null} Matching parent element
   */
  static findClosest(element, selector) {
    if (!element || !element.closest) {
      // Fallback for older browsers
      let current = element;
      while (current && current !== document) {
        if (current.matches && current.matches(selector)) {
          return current;
        }
        current = current.parentElement;
      }
      return null;
    }
    
    return element.closest(selector);
  }
  
  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in ms
   * @returns {Function} Debounced function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Throttle function calls
   * @param {Function} func - Function to throttle
   * @param {number} limit - Limit in ms
   * @returns {Function} Throttled function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  /**
   * Simple delay utility
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Add CSS styles to the document
   * @param {string} css - CSS string
   * @param {string} id - Style element ID
   */
  static addStyles(css, id) {
    // Remove existing style with same ID
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }
    
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }
  
  /**
   * Observe DOM mutations
   * @param {Element} target - Element to observe
   * @param {Function} callback - Callback function
   * @param {Object} options - MutationObserver options
   * @returns {MutationObserver} Observer instance
   */
  static observeMutations(target, callback, options = {}) {
    const defaultOptions = {
      childList: true,
      subtree: true
    };
    
    const observer = new MutationObserver(callback);
    observer.observe(target, { ...defaultOptions, ...options });
    
    return observer;
  }
  
  /**
   * Get element's computed style property
   * @param {Element} element - Element to check
   * @param {string} property - CSS property name
   * @returns {string} Property value
   */
  static getComputedStyle(element, property) {
    return window.getComputedStyle(element).getPropertyValue(property);
  }
  
  /**
   * Check if element has class
   * @param {Element} element - Element to check
   * @param {string} className - Class name
   * @returns {boolean} True if element has class
   */
  static hasClass(element, className) {
    return element.classList.contains(className);
  }
  
  /**
   * Add class to element if not present
   * @param {Element} element - Element to modify
   * @param {string} className - Class name to add
   */
  static addClass(element, className) {
    element.classList.add(className);
  }
  
  /**
   * Remove class from element
   * @param {Element} element - Element to modify
   * @param {string} className - Class name to remove
   */
  static removeClass(element, className) {
    element.classList.remove(className);
  }
  
  /**
   * Toggle class on element
   * @param {Element} element - Element to modify
   * @param {string} className - Class name to toggle
   */
  static toggleClass(element, className) {
    element.classList.toggle(className);
  }
}