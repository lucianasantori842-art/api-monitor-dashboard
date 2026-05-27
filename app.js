// ── API Monitor Dashboard ──────────────────────────────────────────────────
// Simulates real-world API health monitoring with latency, uptime, sparklines.

const APIS = [
  { id: 1, name: "Auth Service",       url: "https://auth.internal/health" },
  { id: 2, name: "Payment Gateway",    url: "https://payments.api/ping" },
  { id: 3, name: "User Service",       url: "https://users.internal/status" },
  { id: 4, name: "Notification API",   url: "https://notify.srv/health" },
  { id: 5, name: "Storage Service",    url: "https://storage.cdn/ping" },
  { id: 6, name: "Analytics Engine",   url: "https://analytics.srv/health" },
  { id: 7, name: "Search API",         url: "https://search.internal/ping" },
  { id: 8, name: "Email Service",      url: "https://mail.srv/status" },
  { id: 9, name: "Cache Layer",        url: "https://redis.internal/ping" },
];

const INTERVAL_MS = 4000;
const HISTORY_SIZE = 20;

let state = {};
let logEntries = [];

// ── Init ──────────────────────────────────────────────────────────────────
function init() {
  APIS.forEach(api => {
    state[api.id] = {
      ...api,
      status: "checking",
      latency: null,
      history: Array(HISTORY_SIZE).fill(null),
      uptime: Array(20).fill(null),
    };
  });

  renderCards();
  startClock();
  addLog("info", "System", "Dashboard initialized. Starting health checks...");
  checkAll();
  setInterval(checkAll, INTERVAL_MS);
}

// ── Clock ─────────────────────────────────────────────────────────────────
function startClock() {
  const el = document.getElementById("clock");
  function tick() {
    const now = new Date();
    el.textContent = now.toTimeString().slice(0, 8);
  }
  tick();
  setInterval(tick, 1000);
}

// ── Simulate API check ────────────────────────────────────────────────────
function simulateCheck(api) {
  // Weighted random: 78% up, 14% slow, 8% down
  const roll = Math.random();
  let status, latency;

  // Inject occasional cascading failure for realism
  const isCritical = api.name === "Auth Service" || api.name === "Payment Gateway";

  if (roll < 0.08) {
    status = "down";
    latency = null;
  } else if (roll < 0.22) {
    status = "slow";
    latency = Math.round(800 + Math.random() * 2200);
  } else {
    status = "up";
    // Realistic latency range: 20ms–350ms
    const base = isCritical ? 30 : 60;
    latency = Math.round(base + Math.random() * 280);
  }

  return { status, latency };
}

function checkAll() {
  APIS.forEach(api => {
    setTimeout(() => {
      const prev = state[api.id].status;
      const { status, latency } = simulateCheck(api);

      // Update history
      state[api.id].history = [...state[api.id].history.slice(1), latency];
      state[api.id].uptime  = [...state[api.id].uptime.slice(1), status];
      state[api.id].status  = status;
      state[api.id].latency = latency;

      // Log state changes
      if (prev !== "checking" && prev !== status) {
        if (status === "down")  addLog("down",  api.name, `Endpoint unreachable`);
        if (status === "slow")  addLog("slow",  api.name, `High latency detected — ${latency}ms`);
        if (status === "up" && prev !== "up") addLog("up", api.name, `Recovered — ${latency}ms`);
      }

      updateCard(api.id);
    }, Math.random() * 1200); // stagger checks
  });

  setTimeout(updateSummary, 1400);
}

// ── Render cards ──────────────────────────────────────────────────────────
function renderCards() {
  const grid = document.getElementById("apis-grid");
  grid.innerHTML = "";
  APIS.forEach((api, i) => {
    const card = document.createElement("div");
    card.className = "api-card";
    card.id = `card-${api.id}`;
    card.style.animationDelay = `${i * 60}ms`;
    card.innerHTML = cardHTML(api.id);
    grid.appendChild(card);
  });
}

function cardHTML(id) {
  const s = state[id];
  const latencyText = s.latency !== null ? `${s.latency}ms` : "—";
  const statusClass = `status-${s.status}`;
  const dotClass    = `dot-${s.status}`;

  return `
    <div class="api-card-top">
      <div>
        <div class="api-name">${s.name}</div>
        <div class="api-url">${s.url}</div>
      </div>
      <div class="api-status-dot ${dotClass}"></div>
    </div>
    <div class="sparkline-wrap">
      <canvas id="spark-${id}" height="32"></canvas>
    </div>
    <div class="api-meta">
      <div class="api-latency">Latency: <span>${latencyText}</span></div>
      <div class="api-status-text ${statusClass}">${s.status.toUpperCase()}</div>
    </div>
    <div class="api-footer">
      <div class="uptime-bar">${uptimeBlocksHTML(s.uptime)}</div>
      <span>Last 20 checks</span>
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

// ── Sparkline ─────────────────────────────────────────────────────────────
function drawSparkline(id) {
  const canvas = document.getElementById(`spark-${id}`);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const history = state[id].history;
  const status  = state[id].status;

  canvas.width  = canvas.offsetWidth  || 260;
  canvas.height = canvas.offsetHeight || 32;
  const W = canvas.width, H = canvas.height;

  const vals = history.filter(v => v !== null);
  if (vals.length < 2) return;

  const min  = Math.min(...vals);
  const max  = Math.max(...vals) || 1;
  const padY = 4;

  const color = status === "up" ? "#00e5a0" : status === "slow" ? "#f5c542" : "#ff3b5c";

  ctx.clearRect(0, 0, W, H);

  // Fill area
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, color + "30");
  grad.addColorStop(1, color + "00");

  ctx.beginPath();
  history.forEach((v, i) => {
    const x = (i / (HISTORY_SIZE - 1)) * W;
    const y = v !== null
      ? H - padY - ((v - min) / (max - min + 1)) * (H - padY * 2)
      : H;
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

  APIS.forEach(api => {
    const s = state[api.id];
    if (s.status !== "checking") counts[s.status]++;
    if (s.latency !== null) { totalLatency += s.latency; latencyCount++; }
  });

  document.getElementById("count-up").textContent   = counts.up;
  document.getElementById("count-slow").textContent = counts.slow;
  document.getElementById("count-down").textContent = counts.down;
  document.getElementById("avg-latency").textContent =
    latencyCount ? `${Math.round(totalLatency / latencyCount)} ms` : "-- ms";

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
  const now = new Date().toTimeString().slice(0, 8);
  logEntries.unshift({ time: now, type, service, message });
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
