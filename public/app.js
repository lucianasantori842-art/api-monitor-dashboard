// ── API Monitor Dashboard v2 — Real Checks ────────────────────────────────
const INTERVAL_MS  = 15000; // 15s between checks (respectful to public APIs)
const HISTORY_SIZE = 20;

let state      = {};
let logEntries = [];
let firstLoad  = true;

// ── Init ──────────────────────────────────────────────────────────────────
async function init() {
  startClock();
  addLog("info", "System", "Dashboard started. Running first health check...");
  await fetchAndRender();
  setInterval(fetchAndRender, INTERVAL_MS);
}

// ── Clock ─────────────────────────────────────────────────────────────────
function startClock() {
  const el = document.getElementById("clock");
  const tick = () => { el.textContent = new Date().toTimeString().slice(0, 8); };
  tick();
  setInterval(tick, 1000);
}

// ── Fetch real results from backend ──────────────────────────────────────
async function fetchAndRender() {
  try {
    const res  = await fetch("/api/check");
    const data = await res.json();

    data.results.forEach(r => {
      const prev = state[r.id];

      // Init history if first time
      if (!prev) {
        state[r.id] = {
          ...r,
          history: Array(HISTORY_SIZE).fill(null),
          uptime:  Array(HISTORY_SIZE).fill(null),
        };
      } else {
        // Detect status changes for logging
        if (prev.status !== r.status) {
          if (r.status === "down")
            addLog("down", r.name, `Unreachable — HTTP ${r.httpCode || "timeout"}`);
          else if (r.status === "slow")
            addLog("slow", r.name, `High latency — ${r.latency}ms`);
          else if (r.status === "up" && prev.status !== "up")
            addLog("up", r.name, `Recovered — ${r.latency}ms (HTTP ${r.httpCode})`);
        }

        state[r.id] = {
          ...r,
          history: [...prev.history.slice(1), r.latency],
          uptime:  [...prev.uptime.slice(1),  r.status],
        };
      }

      if (firstLoad) {
        state[r.id].history = [...Array(HISTORY_SIZE - 1).fill(null), r.latency];
        state[r.id].uptime  = [...Array(HISTORY_SIZE - 1).fill(null), r.status];
        addLog(r.status, r.name,
          r.status === "down"
            ? `DOWN — ${r.error || "unreachable"}`
            : `${r.status.toUpperCase()} — ${r.latency}ms (HTTP ${r.httpCode})`
        );
      }
    });

    firstLoad = false;
    renderCards();
    updateSummary();

  } catch (err) {
    addLog("down", "System", `Failed to reach backend: ${err.message}`);
    document.getElementById("overall-status").textContent = "BACKEND OFFLINE";
    document.getElementById("overall-status").className   = "status-badge outage";
  }
}

// ── Render cards ──────────────────────────────────────────────────────────
function renderCards() {
  const grid = document.getElementById("apis-grid");

  // First render — build all cards
  if (grid.querySelector(".loading-state") || grid.children.length === 0) {
    grid.innerHTML = "";
    Object.values(state).forEach((s, i) => {
      const card = document.createElement("div");
      card.className = "api-card";
      card.id = `card-${s.id}`;
      card.style.animationDelay = `${i * 60}ms`;
      card.innerHTML = cardHTML(s.id);
      grid.appendChild(card);
    });
  } else {
    // Update existing cards
    Object.values(state).forEach(s => updateCard(s.id));
  }

  // Draw sparklines after DOM update
  setTimeout(() => Object.values(state).forEach(s => drawSparkline(s.id)), 50);
}

function cardHTML(id) {
  const s = state[id];
  if (!s) return "";
  const latencyText = s.latency !== null ? `${s.latency}ms` : "—";
  const httpText    = s.httpCode ? `HTTP ${s.httpCode}` : "—";

  return `
    <div class="api-card-top">
      <div>
        <div class="api-name">${s.name}</div>
        <div class="api-url">${s.url}</div>
      </div>
      <div class="api-status-dot dot-${s.status}"></div>
    </div>
    <div class="sparkline-wrap">
      <canvas id="spark-${id}" height="32"></canvas>
    </div>
    <div class="api-meta">
      <div class="api-latency">Latency: <span>${latencyText}</span></div>
      <div class="api-status-text status-${s.status}">${s.status.toUpperCase()}</div>
    </div>
    <div class="api-footer">
      <div class="uptime-bar">${uptimeBlocksHTML(s.uptime)}</div>
      <span>${httpText}</span>
    </div>
  `;
}

function uptimeBlocksHTML(uptime) {
  return uptime.map(v => {
    const cls = v === "up" ? "ok" : v === "slow" ? "slow" : v === "down" ? "fail" : "";
    return `<div class="uptime-block ${cls}"></div>`;
  }).join("");
}

function updateCard(id) {
  const card = document.getElementById(`card-${id}`);
  if (!card) return;
  card.innerHTML = cardHTML(id);
  drawSparkline(id);
}

// ── Sparkline canvas ──────────────────────────────────────────────────────
function drawSparkline(id) {
  const canvas = document.getElementById(`spark-${id}`);
  if (!canvas) return;
  const s = state[id];
  if (!s) return;

  const ctx     = canvas.getContext("2d");
  const history = s.history;

  canvas.width  = canvas.offsetWidth  || 260;
  canvas.height = canvas.offsetHeight || 32;
  const W = canvas.width, H = canvas.height;

  const vals = history.filter(v => v !== null);
  if (vals.length < 2) return;

  const min  = Math.min(...vals);
  const max  = Math.max(...vals) || 1;
  const padY = 4;
  const color = s.status === "up" ? "#00e5a0" : s.status === "slow" ? "#f5c542" : "#ff3b5c";

  ctx.clearRect(0, 0, W, H);

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, color + "30");
  grad.addColorStop(1, color + "00");

  ctx.beginPath();
  history.forEach((v, i) => {
    const x = (i / (HISTORY_SIZE - 1)) * W;
    const y = v !== null ? H - padY - ((v - min) / (max - min + 1)) * (H - padY * 2) : H;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(W, H); ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.5;
  ctx.lineJoin    = "round";
  let first = true;
  history.forEach((v, i) => {
    if (v === null) { first = true; return; }
    const x = (i / (HISTORY_SIZE - 1)) * W;
    const y = H - padY - ((v - min) / (max - min + 1)) * (H - padY * 2);
    first ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    first = false;
  });
  ctx.stroke();

  // Latest dot
  const lastIdx = history.reduce((acc, v, i) => v !== null ? i : acc, -1);
  if (lastIdx >= 0) {
    const lv = history[lastIdx];
    const x  = (lastIdx / (HISTORY_SIZE - 1)) * W;
    const y  = H - padY - ((lv - min) / (max - min + 1)) * (H - padY * 2);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

// ── Summary bar ───────────────────────────────────────────────────────────
function updateSummary() {
  const counts = { up: 0, slow: 0, down: 0 };
  let totalLatency = 0, latencyCount = 0;

  Object.values(state).forEach(s => {
    if (counts[s.status] !== undefined) counts[s.status]++;
    if (s.latency !== null) { totalLatency += s.latency; latencyCount++; }
  });

  document.getElementById("count-up").textContent    = counts.up;
  document.getElementById("count-slow").textContent  = counts.slow;
  document.getElementById("count-down").textContent  = counts.down;
  document.getElementById("avg-latency").textContent =
    latencyCount ? `${Math.round(totalLatency / latencyCount)} ms` : "— ms";

  const badge = document.getElementById("overall-status");
  if (counts.down > 0) {
    badge.textContent = `${counts.down} SERVICE${counts.down > 1 ? "S" : ""} DOWN`;
    badge.className   = "status-badge outage";
  } else if (counts.slow > 0) {
    badge.textContent = "DEGRADED PERFORMANCE";
    badge.className   = "status-badge degraded";
  } else {
    badge.textContent = "ALL SYSTEMS OPERATIONAL";
    badge.className   = "status-badge";
  }
}

// ── Event log ─────────────────────────────────────────────────────────────
function addLog(type, service, message) {
  const time = new Date().toTimeString().slice(0, 8);
  logEntries.unshift({ time, type, service, message });
  if (logEntries.length > 80) logEntries.pop();
  renderLog();
}

function renderLog() {
  const list = document.getElementById("log-list");
  list.innerHTML = logEntries.slice(0, 40).map(e => `
    <div class="log-entry">
      <span class="log-time">${e.time}</span>
      <span class="log-msg"><strong>${e.service}</strong> — ${e.message}</span>
      <span class="log-tag ${e.type}">${e.type.toUpperCase()}</span>
    </div>
  `).join("");
}

function clearLog() {
  logEntries = [];
  renderLog();
}

// ── Start ─────────────────────────────────────────────────────────────────
init();
