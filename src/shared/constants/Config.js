/**
 * Extension configuration and feature flags
 */

export const CONFIG = {
  // Extension metadata
  name: 'Grade Entry Helper',
  version: '2.0.0',
  
  // Feature flags per page type
  features: {
    'grade-entry': {
      clipboardImport: true,
      bulkClear: true,
      columnDetection: true,
      rowCountSetting: true,
      dataValidation: true
    },
    'student-list': {
      bulkExport: true,
      bulkImport: false, // Coming soon
      advancedSearch: false, // Coming soon
      studentManagement: true
    },
    'reports': {
      pdfExport: true,
      excelExport: true,
      emailReports: false, // Coming soon
      customReports: false // Coming soon
    },
    'settings': {
      gradeScaleCustomization: false, // Coming soon
      notificationPreferences: true,
      themeSettings: false // Coming soon
    }
  },
  
  // UI configuration
  ui: {
    controlPanel: {
      position: { top: '80px', right: '20px' },
      minWidth: '220px',
      zIndex: 9999,
      theme: 'default'
    },
    
    notifications: {
      duration: 4000, // ms
      position: { bottom: '20px', left: '20px' },
      maxWidth: '350px',
      zIndex: 10000
    },
    
    detailedInfo: {
      position: 'center', // center, top, bottom
      maxWidth: '450px',
      maxHeight: '600px',
      zIndex: 10001,
      autoCloseDelay: 15000 // ms
    }
  },
  
  // Performance settings
  performance: {
    statusUpdateInterval: 2000, // ms
    domMutationDebounce: 500, // ms
    maxClipboardSize: 1024 * 1024, // 1MB
    maxStudentRows: 1000
  },
  
  // Validation rules
  validation: {
    gradeScore: {
      min: 0,
      defaultMax: 100,
      precision: 1 // decimal places
    },
    
    rowCount: {
      min: 1,
      max: 1000,
      default: 100
    }
  },
  
  // SGS system configuration
  sgs: {
    baseUrl: 'https://sgs.bopp-obec.info',
    
    // Supported page types and their URLs
    pages: {
      'grade-entry': '/sgs/TblTranscripts/Edit-TblTranscripts-Table.aspx',
      'student-list': '/sgs/TblStudents.aspx',
      'reports': '/sgs/Reports.aspx',
      'settings': '/sgs/Settings.aspx'
    },
    
    // ASP.NET specific settings
    aspnet: {
      postbackEventTarget: '__EVENTTARGET',
      postbackEventArgument: '__EVENTARGUMENT',
      viewState: '__VIEWSTATE',
      eventValidation: '__EVENTVALIDATION'
    }
  },
  
  // Debug settings
  debug: {
    enabled: false, // Set to true for development debugging
    logLevel: 'info', // error, warn, info, debug
    showTimings: false
  }
};