/**
 * Clipboard Handler
 * Handles clipboard data reading, parsing, and validation for grade entry
 */

import { MESSAGES } from '../../shared/constants/Messages.js';
import { CONFIG } from '../../shared/constants/Config.js';

export class ClipboardHandler {
  constructor() {
    this.lastClipboardData = null;
    this.lastParseTime = 0;
  }
  
  /**
   * Read and parse clipboard data
   * @returns {Promise<Array<Array<string>>>} Parsed clipboard data as 2D array
   */
  async readAndParseClipboard() {
    // Check if clipboard API is available
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      throw new Error(MESSAGES.errors.clipboardApiUnavailable);
    }
    
    console.log('Clipboard Handler: Reading clipboard data...');
    const clipboardText = await navigator.clipboard.readText();
    
    if (!clipboardText.trim()) {
      throw new Error(MESSAGES.errors.clipboardEmpty);
    }
    
    // Check size limit
    if (clipboardText.length > CONFIG.performance.maxClipboardSize) {
      throw new Error('Clipboard data too large. Please copy smaller datasets.');
    }
    
    const parsedData = this.parseClipboardData(clipboardText);
    
    console.log('Clipboard Handler: Parsed data:', parsedData);
    
    // Cache the result
    this.lastClipboardData = parsedData;
    this.lastParseTime = Date.now();
    
    return parsedData;
  }
  
  /**
   * Parse clipboard data from tab-separated values (Google Sheets format)
   * @param {string} text - Raw clipboard text
   * @returns {Array<Array<string>>} Parsed 2D array
   * @private
   */
  parseClipboardData(text) {
    const lines = text.trim().split('\n');
    const data = [];
    
    for (const line of lines) {
      if (line.trim()) {
        // Split by tabs (Google Sheets format)
        const values = line.split('\t');
        data.push(values);
      }
    }
    
    if (data.length === 0) {
      throw new Error(MESSAGES.errors.noDataFound);
    }
    
    return data;
  }
  
  /**
   * Detect if clipboard data has headers
   * @param {Array<Array<string>>} data - Parsed clipboard data
   * @param {Array<string>} columnNames - Expected column names
   * @returns {Object} Header detection result
   */
  detectHeaders(data, columnNames) {
    if (!data || data.length === 0) {
      return { hasHeaders: false, dataStartRow: 0 };
    }
    
    const firstRow = data[0];
    const hasHeaders = firstRow.some(cell => {
      // Check if cell matches any column names or display names
      return columnNames.includes(cell) || 
             columnNames.some(name => cell.toLowerCase().includes(name.toLowerCase()));
    });
    
    return {
      hasHeaders,
      dataStartRow: hasHeaders ? 1 : 0,
      headerRow: hasHeaders ? firstRow : null
    };
  }
  
  /**
   * Validate clipboard data structure against expected columns
   * @param {Array<Array<string>>} data - Parsed clipboard data
   * @param {Object} enabledColumns - Column configuration
   * @returns {Object} Validation result
   */
  validateDataStructure(data, enabledColumns) {
    const columnNames = Object.keys(enabledColumns);
    const expectedColumnCount = columnNames.length;
    
    if (data.length === 0) {
      return {
        valid: false,
        error: MESSAGES.errors.noDataFound
      };
    }
    
    // Detect headers
    const headerInfo = this.detectHeaders(data, columnNames);
    const dataStartRow = headerInfo.dataStartRow;
    
    // Check if we have data rows after headers
    if (dataStartRow >= data.length) {
      return {
        valid: false,
        error: 'No data rows found after headers'
      };
    }
    
    // Validate column count
    const firstDataRow = data[dataStartRow];
    if (firstDataRow.length !== expectedColumnCount) {
      const columnDisplayNames = Object.values(enabledColumns).map(col => col.displayName);
      return {
        valid: false,
        error: MESSAGES.errors.columnMismatch(
          firstDataRow.length,
          expectedColumnCount,
          columnDisplayNames.join(', ')
        )
      };
    }
    
    // Validate data types and ranges
    const validationErrors = [];
    for (let i = dataStartRow; i < data.length; i++) {
      const row = data[i];
      for (let j = 0; j < row.length; j++) {
        const value = row[j];
        const columnName = columnNames[j];
        const column = enabledColumns[columnName];
        
        if (value !== '' && value !== null && value !== undefined) {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            validationErrors.push(`Row ${i - dataStartRow + 1}, Column ${j + 1}: "${value}" is not a valid number`);
          } else if (numValue < CONFIG.validation.gradeScore.min || numValue > column.weight) {
            validationErrors.push(`Row ${i - dataStartRow + 1}, Column ${j + 1}: ${numValue} is outside valid range (0-${column.weight})`);
          }
        }
      }
    }
    
    // Return validation errors if any
    if (validationErrors.length > 0) {
      return {
        valid: false,
        error: `Data validation errors:\n${validationErrors.slice(0, 5).join('\n')}${validationErrors.length > 5 ? '\n...' : ''}`
      };
    }
    
    return {
      valid: true,
      headerInfo,
      dataRows: data.length - dataStartRow,
      message: headerInfo.hasHeaders ? 'Headers detected, starting from row 2' : 'No headers detected, processing all rows'
    };
  }
  
  /**
   * Process clipboard data for grade entry
   * @param {Object} enabledColumns - Column configuration
   * @returns {Promise<Object>} Processed data ready for grade entry
   */
  async processForGradeEntry(enabledColumns) {
    const rawData = await this.readAndParseClipboard();
    const validation = this.validateDataStructure(rawData, enabledColumns);
    
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    const { headerInfo } = validation;
    const dataStartRow = headerInfo.dataStartRow;
    const columnNames = Object.keys(enabledColumns);
    
    // Extract data rows
    const dataRows = rawData.slice(dataStartRow);
    
    // Process each row into structured format
    const processedRows = dataRows.map((row, index) => {
      const processedRow = {
        rowIndex: index,
        values: {},
        originalData: row
      };
      
      // Map each column value
      for (let j = 0; j < Math.min(row.length, columnNames.length); j++) {
        const columnName = columnNames[j];
        const rawValue = row[j];
        
        // Process the value
        let processedValue = null;
        if (rawValue !== '' && rawValue !== null && rawValue !== undefined) {
          const numValue = parseFloat(rawValue);
          if (!isNaN(numValue)) {
            processedValue = numValue.toFixed(CONFIG.validation.gradeScore.precision);
          }
        }
        
        processedRows.values[columnName] = processedValue;
      }
      
      return processedRow;
    });
    
    return {
      columnNames,
      enabledColumns,
      rows: processedRows,
      totalRows: processedRows.length,
      hasHeaders: headerInfo.hasHeaders,
      headerRow: headerInfo.headerRow,
      metadata: {
        processedAt: new Date().toISOString(),
        originalRowCount: rawData.length,
        dataRowCount: processedRows.length,
        columnCount: columnNames.length
      }
    };
  }
  
  /**
   * Get sample data format for user guidance
   * @param {Object} enabledColumns - Column configuration
   * @returns {string} Sample data format
   */
  getSampleDataFormat(enabledColumns) {
    const columnInfo = Object.entries(enabledColumns).map(([key, value], index) => {
      return `${index + 1}. ${value.displayName} (Max: ${value.weight} points)`;
    });
    
    let sampleText = MESSAGES.info.detectedColumns;
    sampleText += columnInfo.join('\n');
    sampleText += MESSAGES.info.clipboardDataFormat;
    
    return sampleText;
  }
  
  /**
   * Get cached clipboard data if available
   * @returns {Array<Array<string>>|null} Cached data or null
   */
  getCachedData() {
    const cacheAge = Date.now() - this.lastParseTime;
    if (cacheAge < 60000) { // 1 minute cache
      return this.lastClipboardData;
    }
    return null;
  }
  
  /**
   * Clear cached data
   */
  clearCache() {
    this.lastClipboardData = null;
    this.lastParseTime = 0;
  }
  
  /**
   * Get statistics about the last processed data
   * @returns {Object} Data statistics
   */
  getDataStatistics() {
    if (!this.lastClipboardData) {
      return null;
    }
    
    const data = this.lastClipboardData;
    const stats = {
      totalRows: data.length,
      totalCells: data.reduce((sum, row) => sum + row.length, 0),
      columnCounts: {},
      emptyValues: 0,
      numericValues: 0,
      nonNumericValues: 0
    };
    
    // Count column widths
    data.forEach(row => {
      const colCount = row.length;
      stats.columnCounts[colCount] = (stats.columnCounts[colCount] || 0) + 1;
    });
    
    // Analyze cell values
    data.forEach(row => {
      row.forEach(cell => {
        if (cell === '' || cell === null || cell === undefined) {
          stats.emptyValues++;
        } else if (!isNaN(parseFloat(cell))) {
          stats.numericValues++;
        } else {
          stats.nonNumericValues++;
        }
      });
    });
    
    return stats;
  }
}