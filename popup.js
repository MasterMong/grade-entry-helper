document.addEventListener('DOMContentLoaded', function() {
  const openSgsButton = document.getElementById('openSgs');
  const showDevInfoButton = document.getElementById('showDevInfo');

  // --- Check active tab and enable/disable buttons ---
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const onSgsPage = tabs[0] && tabs[0].url && tabs[0].url.startsWith('https://sgs.bopp-obec.info/');
  });

  // --- Event Listeners ---

  // Button to open the main SGS grade entry page
  openSgsButton.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://sgs.bopp-obec.info/sgs/TblTranscripts/Edit-TblTranscripts-Table.aspx' });
  });

  // Button to show the Developer Info popup
  showDevInfoButton.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://mongkon.ch/tools/sgs' });
  });
});