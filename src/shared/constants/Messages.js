/**
 * User-facing messages and text constants
 */

export const MESSAGES = {
  errors: {
    clipboardEmpty: 'Clipboard is empty',
    clipboardApiUnavailable: 'Clipboard API not available. Make sure you\'re on HTTPS.',
    noEnabledColumns: 'No enabled grade columns found on this page',
    noStudentRows: 'No enabled grade input fields found',
    noDataFound: 'No data found in clipboard',
    invalidValue: (value, column, weight) => `Invalid value ${value} for ${column}. Must be between 0 and ${weight}.`,
    columnMismatch: (dataColumns, enabledColumns, columnNames) => 
      `Data has ${dataColumns} columns but found ${enabledColumns} enabled grade columns.\n\nEnabled columns: ${columnNames}\n\nPlease ensure your clipboard data matches the enabled columns.`,
    dropdownNotSelected: {
      both: 'กรุณาเลือก "รายวิชา" และ "กลุ่ม" ก่อนใช้งานปลั๊กอิน',
      subject: 'กรุณาเลือก "รายวิชา" ก่อนใช้งานปลั๊กอิน',
      section: 'กรุณาเลือก "กลุ่ม" ก่อนใช้งานปลั๊กอิน'
    },
    pageNotFound: 'Required page elements not found',
    extensionInitFailed: 'Extension failed to initialize'
  },
  
  success: {
    gradesUpdated: (count, columns) => `Successfully updated ${count} grade fields!\n\nColumns processed: ${columns}`,
    gradesCleared: (count, columns) => `Successfully cleared ${count} grade fields!\n\nColumns cleared: ${columns}`,
    rowCountSet: (count) => `Successfully set display to ${count} rows per page`,
    extensionReady: (count) => `Grade Entry Helper ready! Detected ${count} enabled columns.`
  },
  
  info: {
    extensionLoaded: 'Grade Entry Helper loaded. Please select a subject and group to detect grade columns.',
    headersDetected: 'Headers detected, starting from row 2',
    noColumnsDetected: 'No enabled grade columns detected on this page. Please make sure you have selected a subject and group, and that the page has fully loaded.',
    detectedColumns: 'Detected Enabled Columns:\n\n',
    clipboardDataFormat: '\n\nYour clipboard data should have columns in this exact order.'
  },
  
  confirmations: {
    clearAll: (columns) => `Are you sure you want to clear all values in these columns?\n\n${columns}\n\nThis action cannot be undone.`
  },
  
  ui: {
    buttons: {
      fillFromClipboard: 'Fill from Clipboard',
      clearAllValues: 'Clear All Values',
      showDetectedColumns: 'Show Detected Columns',
      setRows: 'Set',
      minimize: '−',
      close: '×'
    },
    
    labels: {
      extensionTitle: 'Grade Entry Helper',
      rows: 'Rows:',
      columnsDetected: (count) => `${count} columns detected`,
      statusMessages: {
        selectFirst: 'Please select subject and group first'
      }
    },
    
    tooltips: {
      miniPanel: 'Grade Entry Helper - Click to expand'
    }
  }
};