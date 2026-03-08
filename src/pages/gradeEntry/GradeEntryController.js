/**
 * Grade Entry Controller
 * Main controller for grade entry page functionality
 */

import { BasePageController } from '../../core/BasePageController.js';
import { ColumnDetector } from './ColumnDetector.js';
import { ClipboardHandler } from './ClipboardHandler.js';
import { GradeEntryUI } from './GradeEntryUI.js';
import { FieldUpdater } from './FieldUpdater.js';
import { SGS_SELECTORS } from '../../shared/constants/SGSSelectors.js';
import { MESSAGES } from '../../shared/constants/Messages.js';
import { CONFIG } from '../../shared/constants/Config.js';

export class GradeEntryController extends BasePageController {
  constructor(core, pageType) {
    super(core, pageType);
    
    // Initialize services
    this.columnDetector = null;
    this.clipboardHandler = null;
    this.fieldUpdater = null;
    this.ui = null;
    
    // State
    this.enabledColumns = {};
    this.isProcessing = false;
    this.fillMode = localStorage.getItem('sgsbot_fill_mode') || 'row';

    // Bind methods
    this.fillFromClipboard = this.fillFromClipboard.bind(this);
    this.clearAllValues = this.clearAllValues.bind(this);
    this.showDetectedColumns = this.showDetectedColumns.bind(this);
    this.setRowCount = this.setRowCount.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.toggleFillMode = this.toggleFillMode.bind(this);
  }
  
  /**
   * Initialize the grade entry controller
   */
  async initialize() {
    try {
      this.log('Initializing Grade Entry Controller');
      
      // Wait for required elements
      const requiredElements = [
        SGS_SELECTORS['grade-entry'].gradeTable,
        SGS_SELECTORS['grade-entry'].form
      ];
      
      const elementsReady = await this.waitForElements(requiredElements);
      if (!elementsReady) {
        throw new Error('Required page elements not found');
      }
      
      // Initialize services
      await this.initializeServices();
      
      // Create UI
      await this.initializeUI();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initial status update
      this.updateStatus();

      // Check for pending fill from auto-enable/auto-page-size reload
      await this.checkPendingFill();

      // Show initial notification (only if no pending fill)
      if (!sessionStorage.getItem('_sgs_fill_shown')) {
        this.showInitialNotification();
      }
      sessionStorage.removeItem('_sgs_fill_shown');
      
      this.isInitialized = true;
      this.log('Grade Entry Controller initialized successfully');
      
    } catch (error) {
      this.handleError('Failed to initialize Grade Entry Controller', error);
      throw error;
    }
  }
  
  /**
   * Initialize all required services
   * @private
   */
  async initializeServices() {
    // Initialize column detector
    this.columnDetector = new ColumnDetector();
    this.registerService('ColumnDetector', this.columnDetector);
    
    // Initialize clipboard handler
    this.clipboardHandler = new ClipboardHandler();
    this.registerService('ClipboardHandler', this.clipboardHandler);
    
    // Initialize field updater
    const sgFormHandler = this.core.getSharedService('SGSFormHandler');
    this.fieldUpdater = new FieldUpdater(sgFormHandler);
    this.registerService('FieldUpdater', this.fieldUpdater);
    
    // Initialize SGS form handler
    sgFormHandler.initialize();

    this.log('All services initialized');
  }
  
  /**
   * Initialize the user interface
   * @private
   */
  async initializeUI() {
    const notificationManager = this.core.getSharedService('NotificationManager');
    const styleManager = this.core.getSharedService('StyleManager');
    
    // Initialize styles
    styleManager.initialize();
    
    // Create UI with actions
    this.ui = new GradeEntryUI(this.getActions(), notificationManager, this.fillMode, this.toggleFillMode);
    await this.ui.initialize();
    
    this.log('UI initialized');
  }
  
  /**
   * Get available actions for this page
   * @returns {Array<Object>} Array of action definitions
   */
  getActions() {
    return [
      {
        id: 'fill-clipboard',
        label: MESSAGES.ui.buttons.fillFromClipboard,
        handler: this.fillFromClipboard,
        enabled: this.isFeatureEnabled('clipboardImport')
      },
      {
        id: 'clear-all',
        label: MESSAGES.ui.buttons.clearAllValues,
        handler: this.clearAllValues,
        enabled: this.isFeatureEnabled('bulkClear')
      },
      {
        id: 'show-columns',
        label: MESSAGES.ui.buttons.showDetectedColumns,
        handler: this.showDetectedColumns,
        enabled: this.isFeatureEnabled('columnDetection')
      },
      {
        id: 'set-rows',
        label: MESSAGES.ui.buttons.setRows,
        handler: this.setRowCount,
        enabled: this.isFeatureEnabled('rowCountSetting')
      }
    ].filter(action => action.enabled);
  }
  
  /**
   * Fill grades from clipboard data
   */
  async fillFromClipboard() {
    if (this.isProcessing) {
      this.showNotification('Another operation is in progress. Please wait.', 'warning');
      return;
    }

    try {
      this.isProcessing = true;
      this.log('Starting fill from clipboard operation');

      // Validate prerequisites
      const prerequisiteCheck = this.columnDetector.validatePrerequisites();
      if (!prerequisiteCheck.valid) {
        this.showNotification(prerequisiteCheck.message, 'error');
        return;
      }

      // Detect enabled columns
      this.enabledColumns = this.columnDetector.detectEnabledColumns(true);

      // Read clipboard data (mode-aware)
      let processedData;
      if (this.fillMode === 'id') {
        processedData = await this.clipboardHandler.processForGradeEntryById(this.enabledColumns);
      } else {
        processedData = await this.clipboardHandler.processForGradeEntry(this.enabledColumns);
      }
      this.log(`Clipboard has ${processedData.totalRows} rows, ${processedData.columnNames.length} columns`);

      // Auto-set page size if clipboard has more rows than visible students
      const visibleStudents = this.fieldUpdater.findStudentInputFields(this.enabledColumns).length;
      if (processedData.totalRows > visibleStudents) {
        const triggered = await this.autoSetPageSize(processedData.totalRows);
        if (triggered) return; // Wait for page reload
      }

      // Auto-enable columns if clipboard has more columns than enabled (row mode only)
      if (this.fillMode !== 'id') {
        if (Object.keys(this.enabledColumns).length === 0 ||
            processedData.columnNames.length > Object.keys(this.enabledColumns).length) {
          const triggered = await this.autoEnableColumns();
          if (triggered) return; // Wait for page reload
        }
      }

      if (Object.keys(this.enabledColumns).length === 0) {
        throw new Error(MESSAGES.errors.noEnabledColumns);
      }

      this.log(`Detected ${Object.keys(this.enabledColumns).length} enabled columns`);
      this.log(`Processing ${processedData.totalRows} rows of data`);

      // Update grades with progress indicator (mode-aware)
      const columnNames = Object.values(this.enabledColumns).map(col => col.displayName).join(', ');
      let updateResult;
      if (this.fillMode === 'id') {
        updateResult = await this.fieldUpdater.updateGradesByStudentId(processedData, (done, total) => {
          this.ui?.updateProgress(done, total);
        });
        this.ui?.hideProgress();
        if (updateResult.matchedCount === 0) {
          throw new Error(MESSAGES.errors.noStudentsMatched);
        }
        const message = MESSAGES.success.gradesUpdatedById(updateResult.updatedCount, updateResult.skippedCount, columnNames);
        this.showNotification(message, 'success');
      } else {
        updateResult = await this.fieldUpdater.updateGrades(processedData, (done, total) => {
          this.ui?.updateProgress(done, total);
        });
        this.ui?.hideProgress();
        const message = MESSAGES.success.gradesUpdated(updateResult.updatedCount, columnNames);
        this.showNotification(message, 'success');
      }

      this.log(`Successfully updated ${updateResult.updatedCount} grade fields`);

    } catch (error) {
      this.ui?.hideProgress();
      this.handleError('Error filling grades from clipboard', error);
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Toggle between row-order and student-ID-match fill modes
   */
  toggleFillMode() {
    this.fillMode = this.fillMode === 'row' ? 'id' : 'row';
    localStorage.setItem('sgsbot_fill_mode', this.fillMode);
    this.ui?.updateFillModeButton(this.fillMode);
    this.log(`Fill mode changed to: ${this.fillMode}`);
  }

  /**
   * Clear all grade values
   */
  async clearAllValues() {
    if (this.isProcessing) {
      this.showNotification('Another operation is in progress. Please wait.', 'warning');
      return;
    }
    
    try {
      this.isProcessing = true;
      this.log('Starting clear all values operation');
      
      // Validate prerequisites
      const prerequisiteCheck = this.columnDetector.validatePrerequisites();
      if (!prerequisiteCheck.valid) {
        this.showNotification(prerequisiteCheck.message, 'error');
        return;
      }
      
      // Detect enabled columns
      this.enabledColumns = this.columnDetector.detectEnabledColumns(true);
      
      if (Object.keys(this.enabledColumns).length === 0) {
        throw new Error(MESSAGES.errors.noEnabledColumns);
      }
      
      // Confirm with user
      const columnNames = Object.values(this.enabledColumns).map(col => col.displayName).join(', ');
      const confirmMessage = MESSAGES.confirmations.clearAll(columnNames);
      
      if (!confirm(confirmMessage)) {
        this.log('Clear all operation cancelled by user');
        return;
      }
      
      // Clear grades
      const clearResult = await this.fieldUpdater.clearAllGrades(this.enabledColumns);
      
      // Show success message
      const message = MESSAGES.success.gradesCleared(clearResult.clearedCount, columnNames);
      this.showNotification(message, 'success');
      
      this.log(`Successfully cleared ${clearResult.clearedCount} grade fields`);
      
    } catch (error) {
      this.handleError('Error clearing grades', error);
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Show detected columns information
   */
  async showDetectedColumns() {
    try {
      this.log('Showing detected columns information');
      
      // Validate prerequisites
      const prerequisiteCheck = this.columnDetector.validatePrerequisites();
      if (!prerequisiteCheck.valid) {
        this.showNotification(prerequisiteCheck.message, 'error');
        return;
      }
      
      // Re-detect columns to ensure we have the latest data
      const columns = this.columnDetector.detectEnabledColumns(true);
      
      if (Object.keys(columns).length === 0) {
        this.showNotification(MESSAGES.info.noColumnsDetected, 'info');
        return;
      }
      
      // Generate column information
      const columnInfo = this.clipboardHandler.getSampleDataFormat(columns);
      
      // Show detailed info popup
      this.ui.showDetailedInfo('Detected Grade Columns', columnInfo);
      
    } catch (error) {
      this.handleError('Error showing detected columns', error);
    }
  }
  
  /**
   * Set number of rows to display
   * @param {number} rowCount - Number of rows
   */
  async setRowCount(rowCount) {
    if (this.isProcessing) {
      this.showNotification('Another operation is in progress. Please wait.', 'warning');
      return;
    }
    
    try {
      this.isProcessing = true;
      this.log(`Setting row count to ${rowCount}`);
      
      const sgsFormHandler = this.core.getSharedService('SGSFormHandler');
      const success = await sgsFormHandler.setPageSize(rowCount);
      
      if (success) {
        this.showNotification(MESSAGES.success.rowCountSet(rowCount), 'success');
      } else {
        throw new Error('Failed to set row count');
      }
      
    } catch (error) {
      this.handleError('Error setting row count', error);
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Update status display
   */
  updateStatus() {
    try {
      // Check if required dropdowns are selected first
      const prerequisiteCheck = this.columnDetector.validatePrerequisites();
      if (!prerequisiteCheck.valid) {
        this.ui?.updateStatus(MESSAGES.ui.labels.statusMessages.selectFirst, 'error');
        return;
      }
      
      // Detect columns and update status
      const columns = this.columnDetector.detectEnabledColumns();
      const count = Object.keys(columns).length;
      const message = MESSAGES.ui.labels.columnsDetected(count);
      const type = count > 0 ? 'success' : 'error';
      
      this.ui?.updateStatus(message, type);
      
    } catch (error) {
      this.ui?.updateStatus('Status update failed', 'error');
      this.log('Error updating status: ' + error.message, 'warn');
    }
  }
  
  /**
   * Setup event listeners for dynamic updates
   * @private
   */
  setupEventListeners() {
    // Listen for status update requests
    document.addEventListener('sgs-status-update', this.updateStatus);
    
    // Listen for dropdown changes
    const subjectDropdown = document.getElementById(
      SGS_SELECTORS['grade-entry'].subjectDropdown.replace('#', '')
    );
    const sectionDropdown = document.getElementById(
      SGS_SELECTORS['grade-entry'].sectionDropdown.replace('#', '')
    );
    
    if (subjectDropdown) {
      subjectDropdown.addEventListener('change', () => {
        setTimeout(this.updateStatus, 1000);
        this.columnDetector.clearCache();
      });
    }
    
    if (sectionDropdown) {
      sectionDropdown.addEventListener('change', () => {
        setTimeout(this.updateStatus, 1000);
        this.columnDetector.clearCache();
      });
    }
  }
  
  /**
   * Show initial notification when controller is ready
   * @private
   */
  showInitialNotification() {
    setTimeout(() => {
      const prerequisiteCheck = this.columnDetector.validatePrerequisites();
      if (!prerequisiteCheck.valid) {
        this.showNotification(prerequisiteCheck.message, 'info');
        return;
      }
      
      // Re-detect enabled columns in case they weren't available during initial load
      this.enabledColumns = this.columnDetector.detectEnabledColumns(true);
      const columnCount = Object.keys(this.enabledColumns).length;
      
      if (columnCount > 0) {
        this.showNotification(MESSAGES.success.extensionReady(columnCount), 'success');
      } else {
        this.showNotification(MESSAGES.info.extensionLoaded, 'info');
      }
    }, 1500);
  }
  
  /**
   * Check and resume a pending fill operation after auto page-size/column reload
   * @private
   */
  async checkPendingFill() {
    if (sessionStorage.getItem('sgsbot_pending_fill') !== '1') return;
    sessionStorage.removeItem('sgsbot_pending_fill');
    sessionStorage.setItem('_sgs_fill_shown', '1');
    this.showNotification(MESSAGES.info.autoEnabledColumns, 'info', 3000);
    setTimeout(() => this.fillFromClipboard(), 1500);
  }

  /**
   * Auto-set page size if clipboard has more rows than visible students
   * @param {number} neededRows - Number of rows needed
   * @returns {Promise<boolean>} True if a reload was triggered
   * @private
   */
  async autoSetPageSize(neededRows) {
    try {
      const pageSizeInput = document.querySelector(SGS_SELECTORS['grade-entry'].pageSize);
      if (!pageSizeInput) return false;

      const currentSize = parseInt(pageSizeInput.value) || 0;
      if (currentSize >= neededRows) return false;

      const targetSize = Math.max(100, neededRows);
      this.showNotification(MESSAGES.info.autoPageSize(targetSize), 'info', 3000);
      sessionStorage.setItem('sgsbot_pending_fill', '1');

      const sgsFormHandler = this.core.getSharedService('SGSFormHandler');
      await sgsFormHandler.setPageSize(targetSize);
      return true;
    } catch (error) {
      this.log('autoSetPageSize failed: ' + error.message, 'warn');
      return false;
    }
  }

  /**
   * Auto-enable all available unchecked column checkboxes and reload
   * @returns {Promise<boolean>} True if a reload was triggered
   * @private
   */
  async autoEnableColumns() {
    try {
      const unchecked = this.columnDetector.getUncheckedAvailableCheckboxes();
      if (unchecked.length === 0) return false;

      this.showNotification(MESSAGES.info.autoEnablingColumns(unchecked.length), 'info', 3000);

      // Check all unchecked checkboxes in DOM without triggering individual postbacks
      for (const { checkbox } of unchecked) {
        checkbox.checked = true;
      }

      sessionStorage.setItem('sgsbot_pending_fill', '1');

      // Trigger a single postback to apply all checkbox changes
      const firstCheckbox = unchecked[0].checkbox;
      const targetId = firstCheckbox.id.replace(/_/g, '$');
      const sgsFormHandler = this.core.getSharedService('SGSFormHandler');
      await sgsFormHandler.executePostback(targetId, '');
      return true;
    } catch (error) {
      this.log('autoEnableColumns failed: ' + error.message, 'warn');
      return false;
    }
  }

  /**
   * Get controller performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    const baseMetrics = super.getPerformanceMetrics();
    
    return {
      ...baseMetrics,
      enabledColumnCount: Object.keys(this.enabledColumns).length,
      isProcessing: this.isProcessing,
      lastColumnDetection: this.columnDetector?.lastDetectionTime || 0,
      clipboardCacheAge: this.clipboardHandler ? 
        Date.now() - this.clipboardHandler.lastParseTime : null
    };
  }
  
  /**
   * Clean up controller resources
   */
  async destroy() {
    try {
      this.log('Destroying Grade Entry Controller');
      
      // Remove event listeners
      document.removeEventListener('sgs-status-update', this.updateStatus);
      
      // Clear caches
      if (this.columnDetector) {
        this.columnDetector.clearCache();
      }
      if (this.clipboardHandler) {
        this.clipboardHandler.clearCache();
      }
      
      // Call parent destroy
      await super.destroy();
      
    } catch (error) {
      this.log('Error during Grade Entry Controller cleanup: ' + error.message, 'error');
    }
  }
}