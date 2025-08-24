document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('openSgs').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://sgs.bopp-obec.info/sgs/TblTranscripts/Edit-TblTranscripts-Table.aspx' });
  });
});