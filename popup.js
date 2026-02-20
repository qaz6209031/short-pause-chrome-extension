function today() {
  return new Date().toISOString().split('T')[0];
}

function calcStreak(stats) {
  const dates = Object.keys(stats).sort();
  if (!dates.length) return 0;
  const firstDay = dates[0];
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (!stats[key]) {
      if (key < firstDay) break;
      if (i === 0) continue;
      break;
    }
    const day = stats[key];
    if (day.resists > 0 || day.visits === 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}


const DAILY_GOAL = 5;

function renderProgress(resists) {
  const pct = Math.min(100, Math.round((resists / DAILY_GOAL) * 100));
  // Defer to next frame so CSS transition fires
  requestAnimationFrame(() => {
    document.getElementById('progress-bar').style.width = pct + '%';
  });
  document.getElementById('progress-text').textContent =
    resists === 0 ? '0 resists today' : `${resists} resist${resists !== 1 ? 's' : ''} today`;
  document.getElementById('progress-goal').textContent =
    resists >= DAILY_GOAL ? '🎉 goal reached!' : `goal: ${DAILY_GOAL}`;
}

function render(stats) {
  const d = today();
  const ds = stats[d] || { visits: 0, resists: 0 };

  document.getElementById('visits').textContent = ds.visits;
  document.getElementById('resists').textContent = ds.resists;
  document.getElementById('streak').textContent = calcStreak(stats);

  // Total resists all time
  const total = Object.values(stats).reduce((sum, day) => sum + (day.resists || 0), 0);
  document.getElementById('total').textContent = total;

  renderProgress(ds.resists);
}

// ── Init ─────────────────────────────────────────────────────────────────
chrome.storage.local.get(['pauseStats', 'pauseEnabled'], data => {
  const stats = data.pauseStats || {};
  const enabled = data.pauseEnabled !== false; // default on

  document.getElementById('enabled').checked = enabled;
  render(stats);
});

// Toggle on/off
document.getElementById('enabled').addEventListener('change', e => {
  chrome.storage.local.set({ pauseEnabled: e.target.checked });
});

// Reflect live storage changes (e.g. if overlay fires while popup is open)
chrome.storage.onChanged.addListener(changes => {
  if (changes.pauseStats) render(changes.pauseStats.newValue || {});
});
