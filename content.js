(function () {
  'use strict';

  // ── Site definitions ────────────────────────────────────────────────────
  const SITES = {
    tiktok: {
      name: 'TikTok',
      emoji: '🎵',
      shouldActivate: () => location.hostname.includes('tiktok.com'),
    },
    instagram: {
      name: 'Instagram Reels',
      emoji: '📸',
      shouldActivate: () =>
        location.hostname.includes('instagram.com') &&
        location.pathname.startsWith('/reel'),
    },
    youtube: {
      name: 'YouTube Shorts',
      emoji: '▶️',
      shouldActivate: () =>
        location.hostname.includes('youtube.com') &&
        location.pathname.startsWith('/shorts'),
    },
  };

  // ── Constants ────────────────────────────────────────────────────────────
  const COOLDOWN_MS = 10 * 60 * 1000; // 10 min after dismissing
  const COUNTDOWN_SECS = 5;

  // ── State ────────────────────────────────────────────────────────────────
  let overlayActive = false;
  let overlayHost = null;

  // ── Helpers ──────────────────────────────────────────────────────────────
  function getSite() {
    for (const [key, site] of Object.entries(SITES)) {
      if (site.shouldActivate()) return { key, ...site };
    }
    return null;
  }

  function today() {
    return new Date().toISOString().split('T')[0];
  }

  function isInCooldown(siteKey) {
    const val = sessionStorage.getItem(`pause_cd_${siteKey}`);
    return val && Date.now() - parseInt(val) < COOLDOWN_MS;
  }

  function setCooldown(siteKey) {
    sessionStorage.setItem(`pause_cd_${siteKey}`, Date.now());
  }

  // ── Storage ──────────────────────────────────────────────────────────────
  function getStats() {
    return new Promise(resolve =>
      chrome.storage.local.get('pauseStats', d => resolve(d.pauseStats || {}))
    );
  }

  function recordEvent(type) {
    getStats().then(stats => {
      const d = today();
      if (!stats[d]) stats[d] = { visits: 0, resists: 0 };
      stats[d][type]++;
      chrome.storage.local.set({ pauseStats: stats });
    });
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
        if (i === 0) continue; // today not started yet
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

  // ── Overlay styles (injected into Shadow DOM) ────────────────────────────
  const CSS = `
    :host {
      all: initial;
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif;
    }

    .backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.88);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .card {
      position: relative;
      background: #111;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      padding: 36px;
      width: min(420px, calc(100vw - 40px));
      color: #fff;
      box-shadow: 0 32px 64px rgba(0,0,0,0.6);
      animation: appear 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes appear {
      from { transform: translateY(16px) scale(0.97); opacity: 0; }
      to   { transform: translateY(0) scale(1); opacity: 1; }
    }

    .wordmark {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.25);
      margin-bottom: 28px;
    }

    .site-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;
    }

    .site-emoji { font-size: 30px; line-height: 1; }

    .site-name {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .subtitle {
      font-size: 14px;
      color: rgba(255,255,255,0.45);
      margin: 0 0 28px;
      line-height: 1.5;
    }

    .section-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.3);
      margin-bottom: 10px;
    }

    .reasons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 28px;
    }

    .reason {
      padding: 8px 14px;
      border-radius: 100px;
      border: 1px solid rgba(255,255,255,0.12);
      background: transparent;
      color: rgba(255,255,255,0.6);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s;
      outline: none;
    }

    .reason:hover { background: rgba(255,255,255,0.07); color: #fff; }
    .reason.on    { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.3); color: #fff; }

    .stats-row {
      display: flex;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 14px;
      margin-bottom: 24px;
      overflow: hidden;
    }

    .stat { flex: 1; text-align: center; padding: 14px 8px; }

    .stat + .stat { border-left: 1px solid rgba(255,255,255,0.07); }

    .stat-n {
      display: block;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .stat-n.green { color: #4ade80; }

    .stat-l {
      display: block;
      font-size: 11px;
      color: rgba(255,255,255,0.35);
      margin-top: 3px;
    }

    .actions { display: flex; gap: 10px; }

    .btn {
      flex: 1;
      padding: 14px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      outline: none;
    }

    .btn-back {
      border: 1px solid rgba(255,255,255,0.12);
      background: transparent;
      color: rgba(255,255,255,0.6);
    }

    .btn-back:hover {
      background: rgba(255,255,255,0.06);
      color: #fff;
    }

    .btn-proceed {
      flex: 2;
      border: none;
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.3);
      cursor: not-allowed;
    }

    .btn-proceed.ready {
      background: #fff;
      color: #000;
      cursor: pointer;
      font-weight: 600;
    }

    .btn-proceed.ready:hover { background: #e5e5e5; }
  `;

  // ── Build overlay HTML ───────────────────────────────────────────────────
  function buildHTML(site, stats) {
    const d = today();
    const ds = stats[d] || { visits: 0, resists: 0 };
    const streak = calcStreak(stats);

    return `
      <style>${CSS}</style>
      <div class="backdrop"></div>
      <div class="card">
        <div class="wordmark">Pause ⏸</div>

        <div class="site-row">
          <span class="site-emoji">${site.emoji}</span>
          <span class="site-name">${site.name}</span>
        </div>
        <p class="subtitle">Is this really what you want to do right now?</p>

        <div class="section-label">What's pulling you here?</div>
        <div class="reasons">
          <button class="reason" data-r="bored">😑 Bored</button>
          <button class="reason" data-r="stressed">😤 Stressed</button>
          <button class="reason" data-r="procrastinating">⏳ Procrastinating</button>
          <button class="reason" data-r="break">☕ Taking a break</button>
        </div>

        <div class="stats-row">
          <div class="stat">
            <span class="stat-n" id="pv">${ds.visits}</span>
            <span class="stat-l">visits today</span>
          </div>
          <div class="stat">
            <span class="stat-n green" id="pr">${ds.resists}</span>
            <span class="stat-l">resists 💪</span>
          </div>
          <div class="stat">
            <span class="stat-n" id="ps">${streak}</span>
            <span class="stat-l">day streak 🔥</span>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-back" id="pb">← Go back</button>
          <button class="btn btn-proceed" id="pp" disabled>
            <span id="pc">${COUNTDOWN_SECS}</span>s — Let me in
          </button>
        </div>
      </div>
    `;
  }

  // ── Show overlay ─────────────────────────────────────────────────────────
  async function showOverlay(site) {
    if (overlayActive) return;
    overlayActive = true;

    const stats = await getStats();

    overlayHost = document.createElement('div');
    overlayHost.id = '__pause__';
    const shadow = overlayHost.attachShadow({ mode: 'open' });
    shadow.innerHTML = buildHTML(site, stats);

    (document.documentElement || document.body).appendChild(overlayHost);

    // Reason toggle
    shadow.querySelectorAll('.reason').forEach(btn => {
      btn.addEventListener('click', () => {
        shadow.querySelectorAll('.reason').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
      });
    });

    // Countdown
    let secs = COUNTDOWN_SECS;
    const pcEl = shadow.getElementById('pc');
    const ppEl = shadow.getElementById('pp');

    const timer = setInterval(() => {
      secs--;
      if (secs <= 0) {
        clearInterval(timer);
        ppEl.innerHTML = 'Let me in';
        ppEl.classList.add('ready');
        ppEl.disabled = false;
      } else {
        pcEl.textContent = secs;
      }
    }, 1000);

    // Let me in
    ppEl.addEventListener('click', () => {
      clearInterval(timer);
      recordEvent('visits');
      setCooldown(site.key);
      removeOverlay();
    });

    // Go back
    shadow.getElementById('pb').addEventListener('click', () => {
      clearInterval(timer);
      recordEvent('resists');
      removeOverlay();
      if (history.length > 1) history.back();
      else window.close();
    });
  }

  function removeOverlay() {
    overlayHost?.remove();
    overlayHost = null;
    overlayActive = false;
  }

  // ── SPA navigation detection ─────────────────────────────────────────────
  function patchHistory() {
    const orig = history.pushState.bind(history);
    history.pushState = function (...args) {
      orig(...args);
      setTimeout(checkAndShow, 150);
    };
    window.addEventListener('popstate', () => setTimeout(checkAndShow, 150));
    // YouTube fires this on SPA navigation
    window.addEventListener('yt-navigate-finish', () => setTimeout(checkAndShow, 150));
  }

  function checkAndShow() {
    chrome.storage.local.get('pauseEnabled', data => {
      if (data.pauseEnabled === false) return;
      const site = getSite();
      if (site && !overlayActive && !isInCooldown(site.key)) {
        showOverlay(site);
      } else if (!site) {
        removeOverlay();
      }
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  function init() {
    patchHistory();
    checkAndShow();
  }

  if (document.documentElement) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
