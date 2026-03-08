/**
 * Field Updater
 * Handles updating and clearing grade input fields with validation
 */

import { SGS_SELECTORS } from '../../shared/constants/SGSSelectors.js';
import { CONFIG } from '../../shared/constants/Config.js';
import { MESSAGES } from '../../shared/constants/Messages.js';

export class FieldUpdater {
  constructor(sgsFormHandler) {
    this.sgsFormHandler = sgsFormHandler;
  }
  
  /**
   * Update grades based on processed clipboard data
   * @param {Object} processedData - Processed data from ClipboardHandler
   * @returns {Promise<Object>} Update result with statistics
   */
  async updateGrades(processedData, onProgress = null) {
    const { columnNames, enabledColumns, rows } = processedData;

    // Find all student input fields
    const students = this.findStudentInputFields(enabledColumns);

    if (students.length === 0) {
      throw new Error(MESSAGES.errors.noStudentRows);
    }

    console.log(`Field Updater: Found ${students.length} student rows with enabled fields`);

    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];
    const totalRows = Math.min(students.length, rows.length);

    // Process each student row
    for (let i = 0; i < totalRows; i++) {
      const student = students[i];
      const rowData = rows[i];

      if (onProgress) {
        onProgress(i + 1, totalRows);
      }

      console.log(`Processing student row ${i + 1}:`, rowData.originalData);
      
      // Update each column for this student
      for (const columnName of columnNames) {
        const field = student.fields[columnName];
        const value = rowData.values[columnName];
        const column = enabledColumns[columnName];
        
        if (field && value !== null && value !== undefined && value !== '') {
          try {
            const success = this.updateField(field, value, columnName, column.weight);
            if (success) {
              updatedCount++;
            }
          } catch (error) {
            errorCount++;
            errors.push({
              row: i + 1,
              column: columnName,
              value: value,
              error: error.message
            });
            
            // Log error but continue processing
            console.warn(`Failed to update field ${columnName} for student ${i + 1}:`, error);
          }
        }
      }
    }
    
    console.log(`Field Updater: Successfully updated ${updatedCount} fields, ${errorCount} errors`);
    
    if (errors.length > 0 && errors.length < updatedCount / 2) {
      // Show warning if there are some errors but mostly successful
      console.warn('Some fields failed to update:', errors.slice(0, 5));
    } else if (errors.length >= updatedCount / 2) {
      // Too many errors - might be a systematic issue
      throw new Error(`Too many update failures (${errorCount}/${updatedCount + errorCount}). Please check your data format.`);
    }
    
    return {
      updatedCount,
      errorCount,
      errors: errors.slice(0, 10), // Return first 10 errors for debugging
      studentsProcessed: Math.min(students.length, rows.length),
      totalStudents: students.length
    };
  }
  
  /**
   * Clear all grade values in enabled columns
   * @param {Object} enabledColumns - Column configuration
   * @returns {Promise<Object>} Clear result with statistics
   */
  async clearAllGrades(enabledColumns) {
    // Find all student input fields
    const students = this.findStudentInputFields(enabledColumns);
    
    if (students.length === 0) {
      throw new Error(MESSAGES.errors.noStudentRows);
    }
    
    console.log(`Field Updater: Clearing grades for ${students.length} students`);
    
    let clearedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Clear grades for each student
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      
      for (const columnName of Object.keys(enabledColumns)) {
        const field = student.fields[columnName];
        
        if (field) {
          try {
            // Clear the value
            field.value = '';
            
            // Trigger validation event
            this.sgsFormHandler.triggerFieldValidation(field, '');
            clearedCount++;
            
          } catch (error) {
            errorCount++;
            errors.push({
              row: i + 1,
              column: columnName,
              error: error.message
            });
            
            console.warn(`Failed to clear field ${columnName} for student ${i + 1}:`, error);
          }
        }
      }
    }
    
    console.log(`Field Updater: Successfully cleared ${clearedCount} fields, ${errorCount} errors`);
    
    return {
      clearedCount,
      errorCount,
      errors: errors.slice(0, 10),
      studentsProcessed: students.length
    };
  }
  
  /**
   * Update a single field with validation
   * @param {HTMLInputElement} field - Input field element
   * @param {string} value - Value to set
   * @param {string} columnName - Column name for logging
   * @param {number} weight - Maximum allowed value
   * @returns {boolean} True if update successful
   * @private
   */
  updateField(field, value, columnName, weight) {
    if (!field) {
      throw new Error(`Field not found for column ${columnName}`);
    }
    
    // Validate numeric input
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      throw new Error(`Invalid value "${value}" for ${columnName}. Must be a number.`);
    }
    
    if (numValue < CONFIG.validation.gradeScore.min || numValue > weight) {
      throw new Error(`Value ${numValue} for ${columnName} is outside valid range (${CONFIG.validation.gradeScore.min}-${weight}).`);
    }
    
    // Set the value with proper precision
    const formattedValue = numValue.toFixed(CONFIG.validation.gradeScore.precision);
    field.value = formattedValue;
    
    // Trigger validation event
    try {
      this.sgsFormHandler.triggerFieldValidation(field, formattedValue);
    } catch (validationError) {
      // Log validation error but don't fail the update
      console.warn(`Validation event failed for ${columnName}:`, validationError);
    }
    
    console.log(`Updated ${columnName}: ${formattedValue}`);
    return true;
  }
  
  /**
   * Find all student input fields organized by row
   * @param {Object} enabledColumns - Column configuration
   * @returns {Array<Object>} Array of student field data
   * @private
   */
  findStudentInputFields(enabledColumns) {
    const students = [];
    let rowIndex = 0;
    
    while (rowIndex < CONFIG.performance.maxStudentRows) {
      const studentFields = {};
      let foundAnyField = false;
      
      // Try to find fields for this student row
      for (const columnName of Object.keys(enabledColumns)) {
        const fieldId = `ctl00_PageContent_TblTranscriptsTableControlRepeater_ctl${rowIndex.toString().padStart(2, '0')}_${columnName}`;
        const field = document.getElementById(fieldId);
        
        if (field && !field.disabled && !field.readOnly) {
          studentFields[columnName] = field;
          foundAnyField = true;
        }
      }
      
      if (!foundAnyField) {
        break; // No more student rows
      }
      
      students.push({
        rowIndex: rowIndex,
        fields: studentFields
      });
      
      rowIndex++;
    }
    
    return students;
  }
  
  /**
   * Validate that student fields exist for the given columns
   * @param {Object} enabledColumns - Column configuration
   * @returns {Object} Validation result
   */
  validateStudentFields(enabledColumns) {
    const students = this.findStudentInputFields(enabledColumns);
    
    if (students.length === 0) {
      return {
        valid: false,
        message: MESSAGES.errors.noStudentRows,
        studentCount: 0
      };
    }
    
    // Check if all students have fields for all columns
    const columnNames = Object.keys(enabledColumns);
    const incompleteStudents = students.filter(student => {
      const fieldCount = Object.keys(student.fields).length;
      return fieldCount < columnNames.length;
    });
    
    return {
      valid: true,
      studentCount: students.length,
      completeStudents: students.length - incompleteStudents.length,
      incompleteStudents: incompleteStudents.length,
      columnCount: columnNames.length
    };
  }
  
  /**
   * Get field statistics for debugging
   * @param {Object} enabledColumns - Column configuration
   * @returns {Object} Field statistics
   */
  getFieldStatistics(enabledColumns) {
    const students = this.findStudentInputFields(enabledColumns);
    const columnNames = Object.keys(enabledColumns);
    
    const stats = {
      totalStudents: students.length,
      totalColumns: columnNames.length,
      totalFields: students.length * columnNames.length,
      foundFields: 0,
      missingFields: 0,
      disabledFields: 0,
      readOnlyFields: 0,
      fieldsByColumn: {}
    };
    
    // Initialize column counters
    columnNames.forEach(col => {
      stats.fieldsByColumn[col] = {
        found: 0,
        missing: 0,
        disabled: 0,
        readOnly: 0
      };
    });
    
    // Count fields
    students.forEach(student => {
      columnNames.forEach(columnName => {
        const fieldId = `ctl00_PageContent_TblTranscriptsTableControlRepeater_ctl${student.rowIndex.toString().padStart(2, '0')}_${columnName}`;
        const field = document.getElementById(fieldId);
        
        if (field) {
          if (field.disabled) {
            stats.disabledFields++;
            stats.fieldsByColumn[columnName].disabled++;
          } else if (field.readOnly) {
            stats.readOnlyFields++;
            stats.fieldsByColumn[columnName].readOnly++;
          } else {
            stats.foundFields++;
            stats.fieldsByColumn[columnName].found++;
          }
        } else {
          stats.missingFields++;
          stats.fieldsByColumn[columnName].missing++;
        }
      });
    });
    
    return stats;
  }
  
  /**
   * Test field update capability
   * @param {Object} enabledColumns - Column configuration
   * @returns {Promise<Object>} Test result
   */
  async testFieldUpdates(enabledColumns) {
    const students = this.findStudentInputFields(enabledColumns);
    
    if (students.length === 0) {
      return {
        success: false,
        message: 'No student fields found',
        details: {}
      };
    }
    
    const testResults = {};
    let successCount = 0;
    let errorCount = 0;
    
    // Test first student only
    const firstStudent = students[0];
    
    for (const [columnName, column] of Object.entries(enabledColumns)) {
      const field = firstStudent.fields[columnName];
      
      if (field) {
        try {
          // Test with a valid value
          const testValue = Math.min(1, column.weight);
          const originalValue = field.value;
          
          // Test update
          this.updateField(field, testValue.toString(), columnName, column.weight);
          
          // Restore original value
          field.value = originalValue;
          
          testResults[columnName] = {
            success: true,
            message: 'Field update test successful'
          };
          successCount++;
          
        } catch (error) {
          testResults[columnName] = {
            success: false,
            message: error.message
          };
          errorCount++;
        }
      } else {
        testResults[columnName] = {
          success: false,
          message: 'Field not found'
        };
        errorCount++;
      }
    }
    
    return {
      success: successCount > 0,
      message: `Field update test completed: ${successCount} successful, ${errorCount} failed`,
      details: testResults,
      successCount,
      errorCount
    };
  }
}