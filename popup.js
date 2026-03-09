document.addEventListener('DOMContentLoaded', function() {
  const SGS_BASE = 'https://sgs.bopp-obec.info/sgs/TblTranscripts/';

  const pages = {
    openFull: SGS_BASE + 'Edit-TblTranscripts-Table.aspx',
    openPre:  SGS_BASE + 'Edit-TblTranscripts1-Table.aspx',
    openPost: SGS_BASE + 'Edit-TblTranscripts2-Table.aspx'
  };

  // Highlight the button matching the currently active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0]?.url || '';
    for (const [id, url] of Object.entries(pages)) {
      const btn = document.getElementById(id);
      if (btn && currentUrl.includes(url.split('/').pop())) {
        btn.style.background = '#e3f2fd';
        btn.style.color = '#1976D2';
        btn.style.fontWeight = '600';
      }
    }
  });

  // Navigation buttons — reuse current tab if already on SGS, else open new tab
  for (const [id, url] of Object.entries(pages)) {
    document.getElementById(id)?.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentUrl = tabs[0]?.url || '';
        if (currentUrl.includes('sgs.bopp-obec.info')) {
          chrome.tabs.update(tabs[0].id, { url });
        } else {
          chrome.tabs.create({ url });
        }
        window.close();
      });
    });
  }

  // About button
  document.getElementById('showDevInfo')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://mongkon.ch/tools/sgs' });
    window.close();
  });

  // Report problem button
  document.getElementById('reportProblem')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://github.com/MasterMong/sgs-bot-grade/issues' });
    window.close();
  });
});
