# ATMOS — Weather, Decoded

A CRED-inspired premium weather dashboard built with the WeatherAPI current-weather
endpoint, a Vercel serverless proxy, and a vanilla HTML/CSS/JS frontend.

## Features

- **City search** — free-text search (Enter or Search button) plus a row of popular city chips.
- **Weather dashboard** — current conditions: temperature, condition + icon, feels-like,
  humidity, wind, UV index, cloud cover, local time. Secondary metrics live in compact cards.
- **Mood engine** — deterministic mood (`Scorching`, `Freezing`, `Muggy`, `Windy`, `Pleasant`,
  `Comfortable`, `Mixed`) derived from temperature, humidity and wind speed with documented priority.
- **API Inspector** — Raw JSON and Formatted (syntax-highlighted) JSON tabs with copy-to-clipboard.

## Architecture

```
api/weather.js   Vercel serverless function (Node.js) — proxies WeatherAPI, keeps key server-side
mood.js          Client-side deterministic mood engine
api.js           Client-side API request wrapper (calls /api/weather)
app.js           UI controller: rendering, search, chips, inspector, states
index.html       Markup
styles.css       Design system
```

The browser never talks to `api.weatherapi.com` directly; it calls the same-origin
Vercel endpoint `/api/weather?city=...`, which forwards to WeatherAPI using the
`WEATHERAPI_KEY` environment variable.

## Local development

```bash
vercel dev
```

Then open the local URL (e.g. `http://localhost:3000`) and search for a city.

## Deployment

Deployed on Vercel. Environment variable:

```
WEATHERAPI_KEY = <weatherapi-server-side-key>
```

## Mood rules

Priority order (first match wins):

| Priority | Condition | Mood |
|---|---|---|
| 1 | temp >= 38°C | Scorching |
| 2 | temp <= 5°C | Freezing |
| 3 | humidity >= 80% and temp >= 28°C | Muggy |
| 4 | wind >= 30 km/h | Windy |
| 5 | temp 20–30°C, humidity <= 60%, wind <= 20 km/h | Pleasant |
| 6 | temp 15–30°C, humidity <= 75%, wind <= 30 km/h | Comfortable |
| 7 | otherwise | Mixed |
