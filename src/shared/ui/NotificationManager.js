/**
 * Notification Manager
 * Handles all user notifications with consistent styling and behavior
 */

import { CONFIG } from '../constants/Config.js';

export class NotificationManager {
  constructor() {
    this.activeNotifications = new Map();
    this.notificationId = 0;
  }
  
  /**
   * Show a notification to the user
   * @param {string} message - Notification message
   * @param {string} type - Notification type ('info', 'success', 'error', 'warning')
   * @param {number} duration - Duration in ms (0 for persistent)
   * @returns {string} Notification ID
   */
  show(message, type = 'info', duration = CONFIG.ui.notifications.duration) {
    const id = `notification-${++this.notificationId}`;
    
    // Remove existing notification if any
    this.clearAll();
    
    const notification = this.createNotification(id, message, type);
    document.body.appendChild(notification);
    
    this.activeNotifications.set(id, {
      element: notification,
      type,
      message,
      timestamp: Date.now()
    });
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => this.hide(id), duration);
    }
    
    return id;
  }
  
  /**
   * Create notification DOM element
   * @param {string} id - Notification ID
   * @param {string} message - Message text
   * @param {string} type - Notification type
   * @returns {HTMLElement} Notification element
   * @private
   */
  createNotification(id, message, type) {
    const notification = document.createElement('div');
    notification.id = id;
    notification.textContent = message;
    
    const backgroundColor = this.getBackgroundColor(type);
    
    notification.style.cssText = `
      position: fixed;
      bottom: ${CONFIG.ui.notifications.position.bottom};
      left: ${CONFIG.ui.notifications.position.left};
      z-index: ${CONFIG.ui.notifications.zIndex};
      padding: 12px 16px;
      background: ${backgroundColor};
      color: white;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: ${CONFIG.ui.notifications.maxWidth};
      word-wrap: break-word;
      animation: slideIn 0.3s ease-out;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Add animations if not already added
    this.ensureAnimationsExist();
    
    return notification;
  }
  
  /**
   * Get background color for notification type
   * @param {string} type - Notification type
   * @returns {string} CSS color value
   * @private
   */
  getBackgroundColor(type) {
    const colors = {
      success: '#4CAF50',
      error: '#f44336',
      warning: '#ff9800',
      info: '#2196F3'
    };
    
    return colors[type] || colors.info;
  }
  
  /**
   * Hide a specific notification
   * @param {string} id - Notification ID
   */
  hide(id) {
    const notificationData = this.activeNotifications.get(id);
    if (!notificationData) {return;}
    
    const { element } = notificationData;
    
    // Animate out
    element.style.animation = 'slideOut 0.3s ease-in';
    
    setTimeout(() => {
      if (element && element.parentNode) {
        element.remove();
      }
      this.activeNotifications.delete(id);
    }, 300);
  }
  
  /**
   * Clear all active notifications
   */
  clearAll() {
    for (const [id] of this.activeNotifications) {
      this.hide(id);
    }
  }
  
  /**
   * Show success notification
   * @param {string} message - Success message
   * @param {number} duration - Duration in ms
   * @returns {string} Notification ID
   */
  success(message, duration) {
    return this.show(message, 'success', duration);
  }
  
  /**
   * Show error notification
   * @param {string} message - Error message
   * @param {number} duration - Duration in ms
   * @returns {string} Notification ID
   */
  error(message, duration) {
    return this.show(message, 'error', duration);
  }
  
  /**
   * Show warning notification
   * @param {string} message - Warning message
   * @param {number} duration - Duration in ms
   * @returns {string} Notification ID
   */
  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }
  
  /**
   * Show info notification
   * @param {string} message - Info message
   * @param {number} duration - Duration in ms
   * @returns {string} Notification ID
   */
  info(message, duration) {
    return this.show(message, 'info', duration);
  }
  
  /**
   * Ensure CSS animations exist in the document
   * @private
   */
  ensureAnimationsExist() {
    const animationId = 'sgs-notification-animations';
    
    if (document.getElementById(animationId)) {
      return; // Already exists
    }
    
    const style = document.createElement('style');
    style.id = animationId;
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(-100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(-100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Get count of active notifications
   * @returns {number} Number of active notifications
   */
  getActiveCount() {
    return this.activeNotifications.size;
  }
  
  /**
   * Get all active notifications
   * @returns {Array} Array of notification data
   */
  getActive() {
    return Array.from(this.activeNotifications.entries()).map(([id, data]) => ({
      id,
      ...data
    }));
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    this.clearAll();
    
    // Remove animation styles
    const animationStyle = document.getElementById('sgs-notification-animations');
    if (animationStyle) {
      animationStyle.remove();
    }
  }
}