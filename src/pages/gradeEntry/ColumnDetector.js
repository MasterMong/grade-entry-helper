/**
 * Column Detector
 * Dynamically detects enabled grade columns from the SGS page
 */

import { SGS_SELECTORS, SGS_PATTERNS } from '../../shared/constants/SGSSelectors.js';
import { MESSAGES } from '../../shared/constants/Messages.js';

export class ColumnDetector {
  constructor() {
    this.enabledColumns = {};
    this.lastDetectionTime = 0;
    this.cacheTimeout = 30000; // 30 seconds cache
  }
  
  /**
   * Detect all enabled columns from the page
   * @param {boolean} forceRefresh - Force refresh of cached data
   * @returns {Object} Detected columns with metadata
   */
  detectEnabledColumns(forceRefresh = false) {
    const now = Date.now();
    
    // Return cached results if still valid
    if (!forceRefresh && (now - this.lastDetectionTime) < this.cacheTimeout) {
      return this.enabledColumns;
    }
    
    const columns = {};
    
    // Method 1: Scan all enabled input fields directly from the first student row
    const firstStudentRow = document.querySelector(SGS_SELECTORS['grade-entry'].studentRowPattern);
    if (firstStudentRow) {
      const inputs = firstStudentRow.querySelectorAll('input[type="text"]');
      
      for (const input of inputs) {
        if (!input.disabled && !input.readOnly) {
          const columnData = this.extractColumnFromInput(input);
          if (columnData) {
            columns[columnData.name] = columnData;
          }
        }
      }
    }
    
    // Cache results
    this.enabledColumns = columns;
    this.lastDetectionTime = now;
    
    console.log('Column Detector: Detected columns:', columns);
    console.log('Column Detector: Number of columns detected:', Object.keys(columns).length);
    
    return columns;
  }
  
  /**
   * Extract column information from an input field
   * @param {HTMLInputElement} input - Input field element
   * @returns {Object|null} Column data or null if invalid
   * @private
   */
  extractColumnFromInput(input) {
    const inputId = input.id;
    const match = inputId.match(SGS_PATTERNS['grade-entry'].inputIdPattern);
    
    if (!match) {return null;}
    
    const columnName = match[1];
    
    // Skip calculated fields that shouldn't be manually edited
    if (SGS_PATTERNS['grade-entry'].skipFields.includes(columnName)) {
      return null;
    }
    
    // Get weight from onchange attribute if available
    let weight = 100; // default fallback
    const onchangeAttr = input.getAttribute('onchange');
    if (onchangeAttr) {
      const extractedWeight = this.extractWeightFromOnchange(onchangeAttr);
      if (extractedWeight) {
        weight = extractedWeight;
      }
    }
    
    // Get display name by finding the corresponding header
    let displayName = columnName;
    const headerCell = this.findHeaderForColumn(columnName);
    if (headerCell) {
      const linkText = headerCell.querySelector('a')?.textContent?.trim();
      if (linkText) {
        displayName = linkText;
      }
      
      // Try to get weight from header cell content if not found in onchange
      if (weight === 100) {
        const headerWeight = this.extractWeightFromHeader(headerCell);
        if (headerWeight) {
          weight = headerWeight;
        }
      }
    }
    
    return {
      name: columnName,
      displayName: displayName,
      weight: weight,
      enabled: true,
      inputId: inputId,
      element: input
    };
  }
  
  /**
   * Extract weight from onchange attribute
   * @param {string} onchangeAttr - The onchange attribute value
   * @returns {number|null} Extracted weight or null
   * @private
   */
  extractWeightFromOnchange(onchangeAttr) {
    // Look for weight in CheckValue function call
    const weightMatch = onchangeAttr.match(/'(\d+)'/g);
    if (weightMatch && weightMatch.length >= 3) {
      // Third quoted parameter is usually the weight
      const weight = parseInt(weightMatch[2].replace(/'/g, ''));
      return isNaN(weight) ? null : weight;
    }
    return null;
  }
  
  /**
   * Extract weight from header cell content
   * @param {Element} headerCell - Header cell element
   * @returns {number|null} Extracted weight or null
   * @private
   */
  extractWeightFromHeader(headerCell) {
    const weightMatch = headerCell.textContent.match(/(\d+)\s*$/);
    if (weightMatch) {
      const weight = parseInt(weightMatch[1]);
      return isNaN(weight) ? null : weight;
    }
    return null;
  }
  
  /**
   * Find header cell for a given column name
   * @param {string} columnName - Column name to find header for
   * @returns {Element|null} Header cell element or null
   * @private
   */
  findHeaderForColumn(columnName) {
    const headerCells = document.querySelectorAll(SGS_SELECTORS['grade-entry'].headerCells);
    
    for (const cell of headerCells) {
      // Check if cell contains a link or text that matches column patterns
      const links = cell.querySelectorAll('a');
      
      // Try to match by link href containing column name
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        if (href.includes(columnName)) {
          return cell;
        }
      }
      
      // Try to match checkbox ID to column name
      const checkbox = cell.querySelector('input[type="checkbox"]');
      if (checkbox) {
        const matchedName = this.extractColumnNameFromCheckbox(checkbox.id);
        if (matchedName === columnName) {
          return cell;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Extract column name from checkbox ID using predefined mappings
   * @param {string} checkboxId - Checkbox element ID
   * @returns {string|null} Column name or null
   * @private
   */
  extractColumnNameFromCheckbox(checkboxId) {
    const mapping = SGS_PATTERNS['grade-entry'].checkboxColumnMap;
    
    // Check direct mappings first
    for (const [checkId, columnName] of Object.entries(mapping)) {
      if (checkboxId.includes(checkId)) {
        return columnName;
      }
    }
    
    // For any other pattern, try to extract the actual name
    const match = checkboxId.match(/Check(\w+)$/);
    if (match) {
      return match[1];
    }
    
    return null;
  }
  
  /**
   * Get enabled column count
   * @returns {number} Number of enabled columns
   */
  getColumnCount() {
    return Object.keys(this.enabledColumns).length;
  }
  
  /**
   * Get column by name
   * @param {string} columnName - Column name
   * @returns {Object|null} Column data or null
   */
  getColumn(columnName) {
    return this.enabledColumns[columnName] || null;
  }
  
  /**
   * Get all enabled column names in order
   * @returns {Array<string>} Array of column names
   */
  getColumnNames() {
    return Object.keys(this.enabledColumns);
  }
  
  /**
   * Get column display information for UI
   * @returns {Array<Object>} Array of column display data
   */
  getColumnDisplayInfo() {
    return Object.entries(this.enabledColumns).map(([key, value], index) => ({
      index: index + 1,
      name: key,
      displayName: value.displayName,
      weight: value.weight
    }));
  }
  
  /**
   * Validate if page has the required dropdowns selected
   * @returns {Object} Validation result
   */
  validatePrerequisites() {
    const subjectDropdown = document.getElementById(
      SGS_SELECTORS['grade-entry'].subjectDropdown.replace('#', '')
    );
    const sectionDropdown = document.getElementById(
      SGS_SELECTORS['grade-entry'].sectionDropdown.replace('#', '')
    );
    
    if (!subjectDropdown || !sectionDropdown) {
      return {
        valid: false,
        message: MESSAGES.errors.pageNotFound
      };
    }
    
    const subjectSelected = subjectDropdown.value && subjectDropdown.value !== '--ANY--';
    const sectionSelected = sectionDropdown.value && sectionDropdown.value !== '--ANY--';
    
    if (subjectSelected && sectionSelected) {
      return { valid: true };
    }
    
    // Return appropriate error message
    if (!subjectSelected && !sectionSelected) {
      return {
        valid: false,
        message: MESSAGES.errors.dropdownNotSelected.both
      };
    } else if (!subjectSelected) {
      return {
        valid: false,
        message: MESSAGES.errors.dropdownNotSelected.subject
      };
    } else {
      return {
        valid: false,
        message: MESSAGES.errors.dropdownNotSelected.section
      };
    }
  }
  
  /**
   * Get all currently unchecked (disabled) column checkboxes in the header
   * @returns {Array<{checkbox: HTMLInputElement, columnName: string}>}
   */
  getUncheckedAvailableCheckboxes() {
    const result = [];
    const headerCells = document.querySelectorAll(SGS_SELECTORS['grade-entry'].headerCells);

    for (const cell of headerCells) {
      const checkbox = cell.querySelector('input[type="checkbox"]');
      if (checkbox && !checkbox.checked) {
        const columnName = this.extractColumnNameFromCheckbox(checkbox.id);
        if (columnName && !SGS_PATTERNS['grade-entry'].skipFields.includes(columnName)) {
          result.push({ checkbox, columnName });
        }
      }
    }

    return result;
  }

  /**
   * Clear cached column detection data
   */
  clearCache() {
    this.enabledColumns = {};
    this.lastDetectionTime = 0;
  }
  
  /**
   * Get debug information about detected columns
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      enabledColumns: this.enabledColumns,
      columnCount: this.getColumnCount(),
      lastDetectionTime: new Date(this.lastDetectionTime).toISOString(),
      cacheAge: Date.now() - this.lastDetectionTime,
      prerequisites: this.validatePrerequisites()
    };
  }
}