// Update badge with today's resist count
function updateBadge(stats) {
  if (!stats) return;
  const today = new Date().toISOString().split('T')[0];
  const d = stats[today];
  const resists = d?.resists || 0;
  chrome.action.setBadgeText({ text: resists > 0 ? String(resists) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#4ade80' });
}

chrome.storage.local.get('pauseStats', d => updateBadge(d.pauseStats));

chrome.storage.onChanged.addListener(changes => {
  if (changes.pauseStats) updateBadge(changes.pauseStats.newValue);
});
