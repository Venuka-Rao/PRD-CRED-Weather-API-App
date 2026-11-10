const WEATHER_API_URL = 'https://api.weatherapi.com/v1/current.json';

module.exports = async function handler(req, res) {
  // Allow same-origin requests from the dashboard and preflight checks.
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const query = req.query || {};
  const rawCity = query.city;
  const city = typeof rawCity === 'string' ? rawCity.trim() : '';
  if (!city) {
    res.status(400).json({ error: 'City is required' });
    return;
  }
  if (city.length > 100) {
    res.status(400).json({ error: 'City name must be 100 characters or fewer' });
    return;
  }

  const apiKey = process.env.WEATHERAPI_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Weather service is not configured' });
    return;
  }

  try {
    const url = WEATHER_API_URL + '?key=' + apiKey + '&q=' + encodeURIComponent(city);
    const upstream = await fetch(url);
    const body = await upstream.text();
    res.setHeader('Content-Type', 'application/json');
    res.status(upstream.status).send(body);
  } catch (err) {
    res.status(502).json({ error: 'Unable to reach the weather service' });
  }
};
