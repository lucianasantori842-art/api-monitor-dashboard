# 🟢 API Monitor Dashboard v2

Dashboard de monitoramento de APIs em tempo real com chamadas **reais** a APIs públicas. Backend Node.js + Express com frontend vanilla JS.

## Demo

Monitora 9 APIs públicas reais a cada 15 segundos:

| API | URL |
|-----|-----|
| GitHub API | api.github.com |
| PokeAPI | pokeapi.co |
| JSONPlaceholder | jsonplaceholder.typicode.com |
| Open Meteo | api.open-meteo.com |
| CoinGecko | api.coingecko.com |
| REST Countries | restcountries.com |
| The Dog API | api.thedogapi.com |
| Open Library | openlibrary.org |
| IP API | ip-api.com |

## Features

- ✅ **Chamadas HTTP reais** — latência e status code verdadeiros
- 📈 **Sparklines** — histórico de latência por endpoint (Canvas API)
- 🟩 **Uptime blocks** — últimas 20 verificações visuais
- 📋 **Event log** — log de mudanças de status com timestamp
- ⚡ **Backend proxy** — evita CORS e centraliza as verificações
- 📱 **Responsivo** — funciona em mobile e desktop

## Tech Stack

- **Backend**: Node.js + Express + node-fetch
- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Canvas API
- **Fonts**: Space Mono + Syne (Google Fonts)

## Como rodar

```bash
# 1. Clone o repositório
git clone https://github.com/lucianasantori842-art/api-monitor-dashboard.git
cd api-monitor-dashboard

# 2. Instale as dependências
npm install

# 3. Inicie o servidor
npm start

# 4. Abra no navegador
# http://localhost:3000
```

## Estrutura

```
├── server.js          # Backend Express (proxy + health checks)
├── package.json
└── public/
    ├── index.html     # Dashboard UI
    ├── style.css      # Dark theme styles
    └── app.js         # Frontend logic + sparklines
```

## Adicionando suas próprias APIs

Em `server.js`, adicione entradas no array `APIS`:

```js
{
  id: 10,
  name: "Minha API",
  url: "https://minha-api.com/health",
  description: "Descrição opcional"
}
```

## Deploy

Compatível com **Railway**, **Render**, **Fly.io** e **Heroku** — só rodar `npm start`.

## License

MIT
