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

function dayLabel(offset) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return offset === 0 ? 'Today' : ['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()];
}

function renderChart(stats) {
  const chart = document.getElementById('chart');
  chart.innerHTML = '';

  // Collect last 7 days of data (oldest → newest)
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ offset: i, key, data: stats[key] || { visits: 0, resists: 0 } });
  }

  const maxVisits = Math.max(1, ...days.map(d => d.data.visits));

  days.forEach(({ offset, data }) => {
    const col = document.createElement('div');
    col.className = 'bar-col';

    const wrap = document.createElement('div');
    wrap.className = 'bar-wrap';

    // Visits bar (grey, behind)
    if (data.visits > 0) {
      const vBar = document.createElement('div');
      vBar.className = 'bar visits';
      vBar.style.height = `${Math.round((data.visits / maxVisits) * 44)}px`;
      wrap.appendChild(vBar);
    }

    // Resists bar (green, on top)
    if (data.resists > 0) {
      const rBar = document.createElement('div');
      rBar.className = 'bar resists';
      rBar.style.height = `${Math.round((data.resists / maxVisits) * 44)}px`;
      wrap.appendChild(rBar);
    }

    // If no activity, show empty placeholder
    if (data.visits === 0 && data.resists === 0) {
      const empty = document.createElement('div');
      empty.className = 'bar visits';
      empty.style.height = '3px';
      empty.style.opacity = '0.3';
      wrap.appendChild(empty);
    }

    const label = document.createElement('div');
    label.className = 'bar-day' + (offset === 0 ? ' today' : '');
    label.textContent = dayLabel(offset).slice(0, 2);

    col.appendChild(wrap);
    col.appendChild(label);
    chart.appendChild(col);
  });
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
  renderChart(stats);
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
