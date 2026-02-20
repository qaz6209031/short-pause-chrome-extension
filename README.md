# ⏸ Pause — Short Video Chrome Extension

Break the autopilot. A mindful pause before TikTok, Instagram Reels, and YouTube Shorts.

## What it does

Every time you open a short video feed, Pause stops you for 5 seconds and asks one question: *is this really what you want to do right now?*

No hard blocks. No shame. Just friction — right at the moment of autopilot.

![Pause overlay screenshot placeholder](https://placehold.co/800x500/111111/ffffff?text=Pause+Overlay)

## Features

- **Pause screen** — intercepts TikTok, Instagram Reels, and YouTube Shorts before the feed loads
- **Why are you here?** — pick a reason (bored, stressed, procrastinating, taking a break) to build self-awareness
- **5-second countdown** — a small delay to break the reflex
- **Resist tracking** — logs every time you chose to go back
- **Streak** — consecutive days you stayed mindful
- **10-minute cooldown** — won't interrupt again on the same site after you dismiss
- **On/off toggle** — disable without uninstalling
- **100% local** — no account, no server, no data leaves your device

## Supported platforms

| Platform | Trigger |
|---|---|
| TikTok | All pages |
| Instagram | `/reel` and `/reels/` only |
| YouTube | `/shorts/` only |

## Install (Developer Mode)

1. Clone or download this repo
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** → select this folder
5. Done — visit TikTok, Reels, or Shorts to see it in action

## Popup

Click the extension icon to see:
- Today's visits and resists
- Your current streak
- A 7-day bar chart
- On/off toggle

## Tech

- Chrome Extension Manifest V3
- Vanilla JS, no dependencies
- Shadow DOM for style isolation (zero conflicts with site CSS)
- `chrome.storage.local` for persistent stats

## Privacy

All data is stored locally in your browser using `chrome.storage.local`. Nothing is sent to any server.

## License

MIT
