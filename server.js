const express = require("express");
const fetch   = require("node-fetch");
const cors    = require("cors");
const path    = require("path");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// ── Real public APIs to monitor ──────────────────────────────────────────
const APIS = [
  {
    id: 1,
    name: "GitHub API",
    url: "https://api.github.com",
    description: "GitHub REST API root"
  },
  {
    id: 2,
    name: "PokeAPI",
    url: "https://pokeapi.co/api/v2/pokemon/1",
    description: "Pokémon data API"
  },
  {
    id: 3,
    name: "JSONPlaceholder",
    url: "https://jsonplaceholder.typicode.com/posts/1",
    description: "Fake REST API for testing"
  },
  {
    id: 4,
    name: "Open Meteo",
    url: "https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current_weather=true",
    description: "Free weather API"
  },
  {
    id: 5,
    name: "CoinGecko",
    url: "https://api.coingecko.com/api/v3/ping",
    description: "Crypto market data API"
  },
  {
    id: 6,
    name: "REST Countries",
    url: "https://restcountries.com/v3.1/name/brazil",
    description: "Countries information API"
  },
  {
    id: 7,
    name: "The Dog API",
    url: "https://api.thedogapi.com/v1/breeds?limit=1",
    description: "Dog breeds data API"
  },
  {
    id: 8,
    name: "Open Library",
    url: "https://openlibrary.org/api/books?bibkeys=ISBN:0451526538&format=json",
    description: "Books metadata API"
  },
  {
    id: 9,
    name: "IP API",
    url: "http://ip-api.com/json/8.8.8.8",
    description: "IP geolocation API"
  }
];

// ── Health check endpoint ─────────────────────────────────────────────────
app.get("/api/check", async (req, res) => {
  const results = await Promise.all(
    APIS.map(async (api) => {
      const t0 = Date.now();
      try {
        const response = await fetch(api.url, {
          method: "GET",
          headers: { "User-Agent": "api-monitor-dashboard/2.0" },
          timeout: 6000,
        });
        const latency = Date.now() - t0;
        const status  = response.ok
          ? latency > 1500 ? "slow" : "up"
          : "down";

        return {
          id:          api.id,
          name:        api.name,
          url:         api.url,
          description: api.description,
          status,
          latency,
          httpCode:    response.status,
          checkedAt:   new Date().toISOString(),
        };
      } catch (err) {
        return {
          id:          api.id,
          name:        api.name,
          url:         api.url,
          description: api.description,
          status:      "down",
          latency:     null,
          httpCode:    null,
          error:       err.message,
          checkedAt:   new Date().toISOString(),
        };
      }
    })
  );

  res.json({ timestamp: new Date().toISOString(), results });
});

// ── List of monitored APIs ────────────────────────────────────────────────
app.get("/api/list", (req, res) => {
  res.json(APIS);
});

// ── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ API Monitor running at http://localhost:${PORT}`);
});
