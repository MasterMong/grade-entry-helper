/**
 * SGS System DOM Selectors - Centralized selector management for all SGS pages
 */

export const SGS_SELECTORS = {
  'grade-entry': {
    // Dropdown filters
    subjectDropdown: '#ctl00_PageContent_ClassSubjectIDFilter',
    sectionDropdown: '#ctl00_PageContent_ClassSectionNoFilter',
    
    // Grade input fields
    gradeInputs: 'input[id*="TblTranscriptsTableControlRepeater"]',
    studentRowPattern: 'tr:has(input[id*="TblTranscriptsTableControlRepeater_ctl00_"])',
    
    // Pagination controls
    pageSize: 'input[name="ctl00$PageContent$TblTranscriptsPagination$_PageSize"]',
    pageSizeButton: '#ctl00_PageContent_TblTranscriptsPagination__PageSizeButton',
    
    // Table structure
    gradeTable: 'table[cellpadding="0"][cellspacing="0"]',
    headerCells: 'th.thc',
    
    // Form elements
    form: 'form',
    eventTarget: 'input[name="__EVENTTARGET"]',
    eventArgument: 'input[name="__EVENTARGUMENT"]'
  },
  
  'student-list': {
    // Future: Student list page selectors
    studentTable: '.student-table',
    addButton: '#btnAddStudent',
    searchInput: '#txtStudentSearch'
  },
  
  'reports': {
    // Future: Reports page selectors
    reportContainer: '.report-container',
    exportButtons: '.export-btn'
  },
  
  'settings': {
    // Future: Settings page selectors
    settingsForm: '.settings-form'
  }
};

export const SGS_PATTERNS = {
  'grade-entry': {
    // URL patterns
    urlPattern: /Edit-TblTranscripts-Table\.aspx/,
    
    // Input field ID patterns
    inputIdPattern: /_ctl\d+_(\w+)$/,
    
    // Column name mappings from checkbox IDs
    checkboxColumnMap: {
      'Check1': 'S1', 'Check2': 'S2', 'Check3': 'S3', 'Check4': 'S4', 'Check5': 'S5',
      'Check6': 'S6', 'Check7': 'S7', 'Check8': 'S8', 'Check9': 'S9', 'Check10': 'S10',
      'Check11': 'S11', 'Check12': 'S12', 'Check13': 'S13', 'Check14': 'S14', 'Check15': 'S15',
      'CheckM': 'Midterm', 'CheckF': 'Final', 'CheckRG': 'ReGr', 'CheckRpG': 'RepeatGr', 'CheckR': 'Remark'
    },
    
    // Fields to skip during processing
    skipFields: ['TotalPercent', 'Gr']
  },
  
  'student-list': {
    urlPattern: /TblStudents\.aspx/
  },
  
  'reports': {
    urlPattern: /Reports\.aspx/
  },
  
  'settings': {
    urlPattern: /Settings\.aspx/
  }
};