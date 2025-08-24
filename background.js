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