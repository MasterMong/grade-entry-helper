/**
 * Grade Entry UI Component
 * Manages the user interface for grade entry functionality
 */

import { CONFIG } from '../../shared/constants/Config.js';
import { MESSAGES } from '../../shared/constants/Messages.js';
import { DOMUtils } from '../../shared/utils/DOMUtils.js';
import { SGS_PATTERNS } from '../../shared/constants/SGSSelectors.js';

export class GradeEntryUI {
  constructor(actions, notificationManager) {
    this.actions = actions;
    this.notificationManager = notificationManager;
    this.panel = null;
    this.miniPanel = null;
    this.isMinimized = false;
    this.statusDiv = null;
    this.progressDiv = null;
    this.observers = [];
  }

  /**
   * Initialize the UI components
   */
  async initialize() {
    await this.createControlPanel();
    this.setupStatusMonitoring();
    this.makeDraggable();
  }

  /**
   * Make the control panel draggable
   * @private
   */
  makeDraggable() {
    const panel = this.panel;
    const header = this.panel.querySelector('.sgs-control-panel-header');
    if (!header) return;

    let isDragging = false;
    let offsetX, offsetY;

    const onMouseDown = (e) => {
      isDragging = true;
      
      const rect = panel.getBoundingClientRect();
      panel.style.right = 'auto';
      panel.style.left = `${rect.left}px`;

      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      
      header.style.cursor = 'move';
      document.body.style.userSelect = 'none';
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      
      let newX = e.clientX - offsetX;
      let newY = e.clientY - offsetY;

      const maxX = window.innerWidth - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      panel.style.left = `${newX}px`;
      panel.style.top = `${newY}px`;
    };
    
    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      header.style.cursor = 'grab';
      document.body.style.userSelect = '';
    };

    header.addEventListener('mousedown', onMouseDown);
    header.style.cursor = 'grab';
  }

  /**
   * Create the main control panel
   * @private
   */
  async createControlPanel() {
    // Check if panel already exists
    if (document.getElementById('sgs-grade-helper-panel')) {
      return;
    }
    
    // Create main panel container
    this.panel = DOMUtils.createElement('div', {
      id: 'sgs-grade-helper-panel',
      className: 'sgs-control-panel',
      style: `
        position: fixed;
        top: ${CONFIG.ui.controlPanel.position.top};
        right: ${CONFIG.ui.controlPanel.position.right};
        z-index: ${CONFIG.ui.controlPanel.zIndex};
        background: white;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: ${CONFIG.ui.controlPanel.minWidth};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `
    });
    
    // Add header
    const header = DOMUtils.createElement('div', {
      className: 'sgs-control-panel-header',
      textContent: MESSAGES.ui.labels.extensionTitle,
      style: `
        font-size: 14px;
        font-weight: bold;
        color: #333;
        text-align: center;
        margin-bottom: 4px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e0e0e0;
      `
    });
    
    // Create minimize button
    const minimizeButton = this.createMinimizeButton();

    // Create navigation section
    const navSection = this.createNavigationSection();

    // Create action buttons
    const actionButtons = this.createActionButtons();

    // Create row count control
    const rowControl = this.createRowCountControl();

    // Create progress indicator
    this.progressDiv = this.createProgressIndicator();

    // Create status indicator
    this.statusDiv = this.createStatusIndicator();

    // Create dev credit
    const devCredit = DOMUtils.createElement('a', {
        textContent: MESSAGES.ui.labels.devCredit,
        attributes: {
            href: 'https://mongkon.ch',
            target: '_blank',
            rel: 'noopener noreferrer'
        },
        style: `
            font-size: 10px;
            color: #999;
            text-align: center;
            margin-top: 2px;
            text-decoration: none;
        `
    });
    devCredit.addEventListener('mouseenter', () => {
        devCredit.style.textDecoration = 'underline';
    });
    devCredit.addEventListener('mouseleave', () => {
        devCredit.style.textDecoration = 'none';
    });

    // Assemble panel
    this.panel.appendChild(minimizeButton);
    this.panel.appendChild(header);
    if (navSection) this.panel.appendChild(navSection);

    actionButtons.forEach(button => this.panel.appendChild(button));
    this.panel.appendChild(rowControl);
    this.panel.appendChild(this.progressDiv);
    this.panel.appendChild(this.statusDiv);
    this.panel.appendChild(devCredit);
    
    // Add to document
    document.body.appendChild(this.panel);
    
    console.log('Grade Entry UI: Control panel created');
  }
  
  /**
   * Create page navigation section
   * @returns {HTMLElement|null} Navigation section or null
   * @private
   */
  createNavigationSection() {
    const pages = SGS_PATTERNS['grade-entry-nav']?.pages;
    if (!pages) return null;

    const currentPath = window.location.pathname;

    const container = DOMUtils.createElement('div', {
      style: `
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e0e0e0;
      `
    });

    const label = DOMUtils.createElement('span', {
      textContent: MESSAGES.ui.navigation.label,
      style: `font-size: 11px; color: #888;`
    });

    const btnRow = DOMUtils.createElement('div', {
      style: `display: flex; gap: 4px;`
    });

    for (const page of pages) {
      const isActive = currentPath.includes(page.url.split('/').pop().split('?')[0]);
      const btn = DOMUtils.createElement('button', {
        textContent: MESSAGES.ui.navigation.pages[page.key],
        style: `
          flex: 1;
          padding: 5px 4px;
          font-size: 11px;
          border: 1px solid ${isActive ? '#1976D2' : '#ccc'};
          border-radius: 4px;
          cursor: ${isActive ? 'default' : 'pointer'};
          background: ${isActive ? '#1976D2' : '#f5f5f5'};
          color: ${isActive ? 'white' : '#333'};
          font-weight: ${isActive ? '600' : '400'};
          transition: all 0.15s;
        `
      });

      if (!isActive) {
        btn.addEventListener('click', () => {
          window.location.href = page.url;
        });
        btn.addEventListener('mouseenter', () => {
          btn.style.background = '#e3f2fd';
          btn.style.borderColor = '#1976D2';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.background = '#f5f5f5';
          btn.style.borderColor = '#ccc';
        });
      }

      btnRow.appendChild(btn);
    }

    container.appendChild(label);
    container.appendChild(btnRow);
    return container;
  }

  /**
   * Create progress indicator element (hidden by default)
   * @returns {HTMLElement}
   * @private
   */
  createProgressIndicator() {
    return DOMUtils.createElement('div', {
      style: `
        display: none;
        font-size: 11px;
        color: #1976D2;
        text-align: center;
        padding: 4px 0;
        font-weight: 500;
      `
    });
  }

  /**
   * Update progress display
   * @param {number} done - Rows processed
   * @param {number} total - Total rows
   */
  updateProgress(done, total) {
    if (!this.progressDiv) return;
    this.progressDiv.style.display = 'block';
    this.progressDiv.textContent = MESSAGES.info.fillProgress(done, total);
  }

  /**
   * Hide progress indicator
   */
  hideProgress() {
    if (!this.progressDiv) return;
    this.progressDiv.style.display = 'none';
    this.progressDiv.textContent = '';
  }

  /**
   * Create minimize button
   * @returns {HTMLElement} Minimize button element
   * @private
   */
  createMinimizeButton() {
    return DOMUtils.createElement('button', {
      textContent: MESSAGES.ui.buttons.minimize,
      style: `
        position: absolute;
        top: -8px;
        right: -8px;
        width: 24px;
        height: 24px;
        background: #666;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        line-height: 1;
        transition: all 0.2s ease;
      `,
      eventListeners: {
        click: () => this.minimize(),
        mouseenter: (e) => {
          e.target.style.background = '#555';
        },
        mouseleave: (e) => {
          e.target.style.background = '#666';
        }
      }
    });
  }
  
  /**
   * Create action buttons based on provided actions
   * @returns {Array<HTMLElement>} Array of button elements
   * @private
   */
  createActionButtons() {
    const buttonConfigs = [
      {
        id: 'fill-clipboard',
        text: MESSAGES.ui.buttons.fillFromClipboard,
        className: 'primary',
        style: `
          padding: 10px 14px;
          background: linear-gradient(135deg, #4CAF50, #45a049);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
        `,
        hoverStyle: {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 8px rgba(76, 175, 80, 0.4)'
        }
      },
      {
        id: 'clear-all',
        text: MESSAGES.ui.buttons.clearAllValues,
        className: 'danger',
        style: `
          padding: 8px 12px;
          background: linear-gradient(135deg, #ff5722, #e64a19);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(255, 87, 34, 0.3);
        `,
        hoverStyle: {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 8px rgba(255, 87, 34, 0.4)'
        }
      },
      {
        id: 'show-columns',
        text: MESSAGES.ui.buttons.showDetectedColumns,
        className: 'secondary',
        style: `
          padding: 8px 12px;
          background: linear-gradient(135deg, #2196F3, #1976D2);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
        `,
        hoverStyle: {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 8px rgba(33, 150, 243, 0.4)'
        }
      },
      {
        id: 'how-to-use',
        text: MESSAGES.ui.buttons.howToUse,
        className: 'info',
        style: `
          padding: 8px 12px;
          background: linear-gradient(135deg, #00bcd4, #0097a7);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 188, 212, 0.3);
        `,
        hoverStyle: {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 8px rgba(0, 188, 212, 0.4)'
        }
      }
    ];
    
    return buttonConfigs.map(config => {
      const action = this.actions.find(a => a.id === config.id);
      
      const button = DOMUtils.createElement('button', {
        id: `sgs-${config.id}-btn`,
        textContent: config.text,
        className: `sgs-control-panel-button ${config.className}`,
        style: config.style,
        eventListeners: {
          click: () => {
            if (action) {
              action.handler();
            } else if (config.id === 'how-to-use') {
              this.showDetailedInfo(MESSAGES.ui.buttons.howToUse, MESSAGES.info.howToUseContent);
            }
          },
          mouseenter: (e) => {
            Object.assign(e.target.style, config.hoverStyle);
          },
          mouseleave: (e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = config.style.match(/box-shadow: ([^;]+)/)[1];
          }
        }
      });

      if (!action && config.id !== 'how-to-use') {
          return null;
      }

      return button;

    }).filter(Boolean);
  }
  
  /**
   * Create row count control
   * @returns {HTMLElement} Row control container
   * @private
   */
  createRowCountControl() {
    const container = DOMUtils.createElement('div', {
      style: `
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #e0e0e0;
      `
    });
    
    const label = DOMUtils.createElement('span', {
      textContent: MESSAGES.ui.labels.rows,
      style: `
        font-size: 12px;
        color: #333;
        white-space: nowrap;
      `
    });
    
    const input = DOMUtils.createElement('input', {
      attributes: {
        type: 'number',
        min: CONFIG.validation.rowCount.min,
        max: CONFIG.validation.rowCount.max,
        value: CONFIG.validation.rowCount.default
      },
      style: `
        width: 60px;
        padding: 4px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 12px;
      `
    });
    
    const setButton = DOMUtils.createElement('button', {
      textContent: MESSAGES.ui.buttons.setRows,
      style: `
        padding: 4px 8px;
        background: linear-gradient(135deg, #9c27b0, #7b1fa2);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(156, 39, 176, 0.3);
      `,
      eventListeners: {
        click: () => this.handleSetRowCount(input.value),
        mouseenter: (e) => {
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.boxShadow = '0 4px 8px rgba(156, 39, 176, 0.4)';
        },
        mouseleave: (e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 2px 4px rgba(156, 39, 176, 0.3)';
        }
      }
    });
    
    container.appendChild(label);
    container.appendChild(input);
    container.appendChild(setButton);
    
    return container;
  }
  
  /**
   * Create status indicator
   * @returns {HTMLElement} Status indicator element
   * @private
   */
  createStatusIndicator() {
    return DOMUtils.createElement('div', {
      id: 'sgs-grade-helper-status',
      style: `
        font-size: 11px;
        color: #666;
        text-align: center;
        margin-top: 4px;
        padding-top: 8px;
        border-top: 1px solid #e0e0e0;
      `
    });
  }
  
  /**
   * Handle set row count action
   * @param {string} value - Input value
   * @private
   */
  async handleSetRowCount(value) {
    const rowCount = parseInt(value);
    if (isNaN(rowCount) || rowCount < CONFIG.validation.rowCount.min || rowCount > CONFIG.validation.rowCount.max) {
      this.notificationManager.error(`Please enter a valid number between ${CONFIG.validation.rowCount.min} and ${CONFIG.validation.rowCount.max}`);
      return;
    }
    
    const setRowsAction = this.actions.find(a => a.id === 'set-rows');
    if (setRowsAction) {
      await setRowsAction.handler(rowCount);
    }
  }
  
  /**
   * Minimize the control panel
   */
  minimize() {
    if (this.panel) {
      this.panel.remove();
    }
    
    this.createMiniPanel();
    this.isMinimized = true;
  }
  
  /**
   * Create minimized panel
   * @private
   */
  createMiniPanel() {
    this.miniPanel = DOMUtils.createElement('div', {
      id: 'sgs-grade-helper-mini-panel',
      className: 'sgs-mini-panel',
      textContent: 'G',
      attributes: {
        title: MESSAGES.ui.tooltips.miniPanel
      },
      style: `
        position: fixed;
        top: ${CONFIG.ui.controlPanel.position.top};
        right: ${CONFIG.ui.controlPanel.position.right};
        z-index: ${CONFIG.ui.controlPanel.zIndex};
        background: #4CAF50;
        color: white;
        border-radius: 50%;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 20px;
        font-weight: bold;
        transition: all 0.2s ease;
      `,
      eventListeners: {
        click: () => this.restore(),
        mouseenter: (e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
        },
        mouseleave: (e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }
      }
    });
    
    document.body.appendChild(this.miniPanel);
  }
  
  /**
   * Restore the control panel from minimized state
   */
  async restore() {
    if (this.miniPanel) {
      this.miniPanel.remove();
      this.miniPanel = null;
    }
    
    await this.createControlPanel();
    this.isMinimized = false;
  }
  
  /**
   * Update status display
   * @param {string} message - Status message
   * @param {string} type - Status type ('success', 'error', 'info')
   */
  updateStatus(message, type = 'info') {
    if (!this.statusDiv) {return;}
    
    this.statusDiv.textContent = message;
    
    const colors = {
      success: '#4CAF50',
      error: '#f44336',
      info: '#666',
      warning: '#ff9800'
    };
    
    this.statusDiv.style.color = colors[type] || colors.info;
  }
  
  /**
   * Setup status monitoring for automatic updates
   * @private
   */
  setupStatusMonitoring() {
    // Update status periodically
    const updateInterval = setInterval(() => {
      if (!document.getElementById('sgs-grade-helper-panel')) {
        clearInterval(updateInterval);
        return;
      }
      
      // Trigger status update via custom event
      const event = new CustomEvent('sgs-status-update');
      document.dispatchEvent(event);
    }, CONFIG.performance.statusUpdateInterval);
    
    // Listen for page changes
    const observer = DOMUtils.observeMutations(document.body, 
      DOMUtils.debounce(() => {
        if (document.getElementById('sgs-grade-helper-panel')) {
          const event = new CustomEvent('sgs-status-update');
          document.dispatchEvent(event);
        }
      }, CONFIG.performance.domMutationDebounce),
      { childList: true, subtree: true }
    );
    
    this.observers.push(observer);
  }
  
  /**
   * Show detailed information popup
   * @param {string} title - Popup title
   * @param {string} content - Popup content
   */
  showDetailedInfo(title, content) {
    // Remove existing popup
    const existing = document.getElementById('sgs-detailed-info-popup');
    if (existing) {
      existing.remove();
    }
    
    // Create backdrop
    const backdrop = DOMUtils.createElement('div', {
      style: `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: ${CONFIG.ui.detailedInfo.zIndex - 1};
        background: rgba(0,0,0,0.6);
        animation: fadeIn 0.3s ease-out;
      `
    });
    
    // Create popup
    const popup = DOMUtils.createElement('div', {
      id: 'sgs-detailed-info-popup',
      style: `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: ${CONFIG.ui.detailedInfo.zIndex};
        padding: 24px;
        background: white;
        color: #333;
        border-radius: 12px;
        font-size: 14px;
        box-shadow: 0 12px 24px rgba(0,0,0,0.2);
        max-width: ${CONFIG.ui.detailedInfo.maxWidth};
        max-height: ${CONFIG.ui.detailedInfo.maxHeight};
        overflow-y: auto;
        white-space: pre-line;
        border: 2px solid #2196F3;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: popupSlideIn 0.3s ease-out;
      `
    });
    
    // Create title
    const titleElement = DOMUtils.createElement('h3', {
      textContent: title,
      style: `
        margin: 0 0 16px 0;
        color: #2196F3;
        font-size: 16px;
        font-weight: 600;
        padding-right: 40px;
      `
    });
    
    // Create close button
    const closeButton = DOMUtils.createElement('button', {
      textContent: MESSAGES.ui.buttons.close,
      style: `
        position: absolute;
        top: 8px;
        right: 12px;
        background: #f44336;
        color: white;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        font-size: 20px;
        font-weight: bold;
        line-height: 1;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      `,
      eventListeners: {
        click: () => this.closeDetailedInfo(),
        mouseenter: (e) => {
          e.target.style.background = '#d32f2f';
          e.target.style.transform = 'scale(1.1)';
        },
        mouseleave: (e) => {
          e.target.style.background = '#f44336';
          e.target.style.transform = 'scale(1)';
        }
      }
    });
    
    // Create content
    const contentElement = DOMUtils.createElement('div', {
      textContent: content,
      style: `
        margin-right: 20px;
        line-height: 1.5;
        color: #555;
      `
    });
    
    // Add animations
    this.addPopupAnimations();
    
    // Assemble popup
    popup.appendChild(titleElement);
    popup.appendChild(closeButton);
    popup.appendChild(contentElement);
    
    // Add to document
    document.body.appendChild(backdrop);
    document.body.appendChild(popup);
    
    // Setup close handlers
    backdrop.addEventListener('click', () => this.closeDetailedInfo());
    
    // Auto-close after delay
    setTimeout(() => {
      if (document.getElementById('sgs-detailed-info-popup')) {
        this.closeDetailedInfo();
      }
    }, CONFIG.ui.detailedInfo.autoCloseDelay);
  }
  
  /**
   * Close detailed info popup
   * @private
   */
  closeDetailedInfo() {
    const popup = document.getElementById('sgs-detailed-info-popup');
    const backdrop = popup?.previousSibling;
    
    if (popup) {
      popup.style.animation = 'popupSlideOut 0.3s ease-in';
      if (backdrop) {
        backdrop.style.opacity = '0';
      }
      
      setTimeout(() => {
        if (popup?.parentNode) {popup.remove();}
        if (backdrop?.parentNode) {backdrop.remove();}
      }, 300);
    }
  }
  
  /**
   * Add popup animations to document
   * @private
   */
  addPopupAnimations() {
    const animationId = 'sgs-popup-animations';
    
    if (document.getElementById(animationId)) {return;}
    
    DOMUtils.addStyles(`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes popupSlideIn {
        from { 
          transform: translate(-50%, -50%) scale(0.9);
          opacity: 0;
        }
        to { 
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
      }
      @keyframes popupSlideOut {
        from { 
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
        to { 
          transform: translate(-50%, -50%) scale(0.9);
          opacity: 0;
        }
      }
    `, animationId);
  }
  
  /**
   * Clean up UI resources
   */
  destroy() {
    // Remove panels
    if (this.panel) {this.panel.remove();}
    if (this.miniPanel) {this.miniPanel.remove();}
    
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    // Close any open popups
    this.closeDetailedInfo();
    
    // Remove animations
    const animations = document.getElementById('sgs-popup-animations');
    if (animations) {animations.remove();}
  }
}
