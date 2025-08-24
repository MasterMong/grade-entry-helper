/**
 * Style Manager
 * Manages CSS styles and themes for the extension
 */

export class StyleManager {
  constructor() {
    this.loadedStyles = new Set();
  }
  
  /**
   * Add CSS styles to the document
   * @param {string} css - CSS string
   * @param {string} id - Style element ID
   */
  addStyles(css, id) {
    // Remove existing style with same ID
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }
    
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
    
    this.loadedStyles.add(id);
  }
  
  /**
   * Remove styles by ID
   * @param {string} id - Style element ID
   */
  removeStyles(id) {
    const style = document.getElementById(id);
    if (style) {
      style.remove();
      this.loadedStyles.delete(id);
    }
  }
  
  /**
   * Get base control panel styles
   * @returns {string} CSS string
   */
  getControlPanelStyles() {
    return `
      .sgs-control-panel {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9999;
        background: white;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 220px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .sgs-control-panel-header {
        font-size: 14px;
        font-weight: bold;
        color: #333;
        text-align: center;
        margin-bottom: 4px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e0e0e0;
      }
      
      .sgs-control-panel-button {
        padding: 10px 14px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s ease;
        color: white;
      }
      
      .sgs-control-panel-button:hover {
        transform: translateY(-1px);
      }
      
      .sgs-control-panel-button.primary {
        background: linear-gradient(135deg, #4CAF50, #45a049);
        box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
      }
      
      .sgs-control-panel-button.primary:hover {
        box-shadow: 0 4px 8px rgba(76, 175, 80, 0.4);
      }
      
      .sgs-control-panel-button.secondary {
        background: linear-gradient(135deg, #2196F3, #1976D2);
        box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 500;
      }
      
      .sgs-control-panel-button.secondary:hover {
        box-shadow: 0 4px 8px rgba(33, 150, 243, 0.4);
      }
      
      .sgs-control-panel-button.danger {
        background: linear-gradient(135deg, #ff5722, #e64a19);
        box-shadow: 0 2px 4px rgba(255, 87, 34, 0.3);
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 500;
      }
      
      .sgs-control-panel-button.danger:hover {
        box-shadow: 0 4px 8px rgba(255, 87, 34, 0.4);
      }
      
      .sgs-mini-panel {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9999;
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
      }
      
      .sgs-mini-panel:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
      }
    `;
  }
  
  /**
   * Initialize default styles
   */
  initialize() {
    this.addStyles(this.getControlPanelStyles(), 'sgs-control-panel-styles');
  }
  
  /**
   * Clean up all managed styles
   */
  destroy() {
    for (const styleId of this.loadedStyles) {
      this.removeStyles(styleId);
    }
    this.loadedStyles.clear();
  }
}