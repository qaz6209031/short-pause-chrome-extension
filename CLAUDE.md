# Pause — Chrome Extension

A mindful friction layer for TikTok, Instagram Reels, and YouTube Shorts. Built with Manifest V3, vanilla JS, and zero dependencies.

## Project structure

```
manifest.json      # MV3 manifest — permissions, content scripts, service worker
background.js      # Service worker — badge update only
content.js         # Injected into TikTok/Instagram/YouTube — full overlay logic
popup.js           # Extension popup — stats rendering, toggle
popup.html         # Popup markup
popup.css          # Popup styles
assets/            # Extension icons
docs/              # Misc docs
```

## Architecture

- **content.js** runs at `document_start` on all three platforms. It patches `history.pushState` and listens for `popstate` / `yt-navigate-finish` to handle SPA navigation. The overlay is rendered inside a **Shadow DOM** element (`#__pause__`) for full CSS isolation.
- **background.js** is a minimal service worker that only manages the toolbar badge (green, shows daily resist count).
- **Storage**: `chrome.storage.local` with key `pauseStats` (daily keyed object) and `pauseEnabled` (boolean toggle). Cooldown state lives in `sessionStorage` (per-tab, not persisted).
- **No build step** — plain JS files loaded directly by Chrome.

## Key constants

- `COOLDOWN_MS` = 10 minutes (content.js) — won't re-show overlay on the same site within a session after dismissal
- `COUNTDOWN_SECS` = 5 — seconds before "Let me in" button becomes active
- `DAILY_GOAL` = 5 resists (popup.js)

## Stats data model

```js
pauseStats = {
  "2024-01-15": {
    visits: 3,      // times user clicked "Let me in"
    resists: 2,     // times user clicked "Go back"
    reasons: {},    // legacy field, kept for compatibility
    platforms: {    // block counts per platform
      tiktok: 1,
      instagram: 1,
      youtube: 0,
    }
  }
}
```

## Platform triggers

| Key         | Hostname match    | Path condition         |
|-------------|-------------------|------------------------|
| `tiktok`    | `tiktok.com`      | any path               |
| `instagram` | `instagram.com`   | starts with `/reel`    |
| `youtube`   | `youtube.com`     | starts with `/shorts/` |

## Development

Load the extension unpacked in Chrome:
1. `chrome://extensions` → enable Developer mode
2. "Load unpacked" → select this folder
3. After editing JS/CSS, click the refresh icon on the extension card

No npm, no bundler, no build step needed.
