(function (global) {
  'use strict';

  var API_BASE = '';
  var REQUEST_TIMEOUT_MS = 10000;

  async function fetchWeather(city) {
    var url = API_BASE + '/api/weather?city=' + encodeURIComponent(city);
    var controller = new AbortController();
    var timeoutId = setTimeout(function () {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    var response;
    try {
      response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    } finally {
      clearTimeout(timeoutId);
    }

    var raw = await response.text();
    var data = null;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      data = null;
    }

    if (!response.ok) {
      var message =
        (data && data.error && data.error.message) ||
        'The weather service returned an error. Please try again.';
      throw new Error(message);
    }

    if (!data || !data.current) {
      throw new Error('The weather response was empty. Please try again.');
    }

    var cityName = (data.location && data.location.name) || city;
    return { data: data, raw: raw, city: cityName };
  }

  global.WeatherAPI = {
    fetchWeather: fetchWeather,
  };
})(typeof window !== 'undefined' ? window : this);
