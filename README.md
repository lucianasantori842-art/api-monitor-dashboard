# 🟢 API Monitor Dashboard

A real-time API health monitoring dashboard built with vanilla HTML, CSS, and JavaScript. No dependencies, no build step — just open and run.

## Features

- **Live health checks** — simulates polling 9 microservices every 4 seconds
- **Status indicators** — UP / SLOW / DOWN with animated dot indicators
- **Sparkline charts** — latency history per endpoint drawn on `<canvas>`
- **Uptime blocks** — last 20 checks visualized per service
- **Event log** — real-time log of status changes with timestamps
- **Summary bar** — global counts and average latency
- **Responsive** — works on mobile and desktop

## Tech Stack

- HTML5, CSS3 (custom properties, grid, animations)
- Vanilla JavaScript (no frameworks)
- Canvas API for sparklines
- Google Fonts (Space Mono + Syne)

## Getting Started

```bash
git clone https://github.com/lucianasantori842-art/api-monitor-dashboard.git
cd api-monitor-dashboard
# Open index.html in your browser — no server needed
open index.html
```

## Connecting Real APIs

In `app.js`, replace the `APIS` array with your real endpoints:

```js
const APIS = [
  { id: 1, name: "My Auth API", url: "https://your-api.com/health" },
  ...
];
```

Then replace `simulateCheck()` with a real `fetch()` call:

```js
async function checkEndpoint(url) {
  const t0 = performance.now();
  try {
    await fetch(url, { method: "GET", signal: AbortSignal.timeout(5000) });
    const latency = Math.round(performance.now() - t0);
    return { status: latency > 800 ? "slow" : "up", latency };
  } catch {
    return { status: "down", latency: null };
  }
}
```

## License

MIT
