// Background script to handle extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  // Navigate to the SGS grade entry page
  const sgsUrl = 'https://sgs.bopp-obec.info/sgs/TblTranscripts/Edit-TblTranscripts-Table.aspx';
  
  // Check if we're already on the SGS domain
  if (tab.url && tab.url.includes('sgs.bopp-obec.info')) {
    // If already on SGS, just navigate to the grade entry page
    chrome.tabs.update(tab.id, { url: sgsUrl });
  } else {
    // If on different domain, create new tab
    chrome.tabs.create({ url: sgsUrl });
  }
});

// Handle messages from content script to execute code in page context
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXECUTE_IN_PAGE') {
    // Use chrome.scripting API to execute code in page context (bypasses CSP)
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      world: 'MAIN', // Execute in page context, not isolated content script context
      func: (rowCount) => {
        try {
          // Find the page size input and set its value
          const pageSizeInput = document.querySelector('input[name="ctl00$PageContent$TblTranscriptsPagination$_PageSize"]');
          if (pageSizeInput) {
            pageSizeInput.value = rowCount;
          }
          
          // Try to call __doPostBack directly (this works in page context)
          if (typeof __doPostBack === 'function') {
            __doPostBack('ctl00$PageContent$TblTranscriptsPagination$_PageSizeButton', '');
            return { success: true, message: `Set display to ${rowCount} rows per page` };
          } else {
            // If __doPostBack doesn't exist, simulate clicking the button
            const pageSizeButton = document.getElementById('ctl00_PageContent_TblTranscriptsPagination__PageSizeButton');
            if (pageSizeButton) {
              pageSizeButton.click();
              return { success: true, message: `Set display to ${rowCount} rows per page` };
            } else {
              return { success: false, error: 'Page size button not found' };
            }
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      args: [message.rowCount]
    }).then((results) => {
      const result = results[0].result;
      sendResponse(result);
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    
    // Return true to indicate we'll send response asynchronously
    return true;
  }
});