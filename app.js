(function (global) {
  'use strict';

  // Top-12 trending-style city shortcuts.
  var CHIPS = [
    'New Delhi',
    'Mumbai',
    'Bengaluru',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Pune',
    'Patna',
    'Jaipur',
    'London',
    'Mangalore',
    'Ramanathapuram',
  ];

  var state = {
    data: null,
    raw: '',
    city: '',
    loading: false,
    requestId: 0,
    lastQuery: '',
  };

  var els = {};

  function init() {
    els.form = document.getElementById('search-form');
    els.input = document.getElementById('city-input');
    els.searchButton = document.getElementById('search-button');
    els.searchError = document.getElementById('search-error');
    els.chips = document.getElementById('city-chips');
    els.emptyView = document.getElementById('empty-view');
    els.loadingView = document.getElementById('loading-view');
    els.errorView = document.getElementById('error-view');
    els.errorMessage = document.getElementById('error-message');
    els.retryButton = document.getElementById('retry-button');
    els.weatherSection = document.getElementById('weather-section');
    els.metricsGrid = document.getElementById('metrics-grid');
    els.inspectorSection = document.getElementById('inspector-section');
    els.city = document.getElementById('w-city');
    els.region = document.getElementById('w-region');
    els.condition = document.getElementById('w-condition');
    els.icon = document.getElementById('w-icon');
    els.temp = document.getElementById('w-temp');
    els.unit = document.getElementById('w-unit');
    els.feels = document.getElementById('w-feels');
    els.time = document.getElementById('w-time');
    els.moodPanel = document.getElementById('mood-panel');
    els.moodBadge = document.getElementById('mood-badge');
    els.moodDescription = document.getElementById('mood-description');
    els.jsonRaw = document.getElementById('json-raw');
    els.jsonFormatted = document.getElementById('json-formatted');
    els.tabRaw = document.getElementById('tab-raw');
    els.tabFormatted = document.getElementById('tab-formatted');
    els.panelRaw = document.getElementById('panel-raw');
    els.panelFormatted = document.getElementById('panel-formatted');
    els.copyButton = document.getElementById('copy-json-button');
  }

  function setText(el, value) {
    if (el) el.textContent = value;
  }

  // ---------- view switching ----------

  function showState(view) {
    if (els.emptyView) els.emptyView.hidden = view !== 'empty';
    if (els.loadingView) els.loadingView.hidden = view !== 'loading';
    if (els.errorView) els.errorView.hidden = view !== 'error';
    if (els.weatherSection) els.weatherSection.hidden = view !== 'weather';
    if (els.inspectorSection) els.inspectorSection.hidden = view !== 'weather';
    if (els.metricsGrid) els.metricsGrid.hidden = view !== 'weather';
  }

  function setLoading(isLoading) {
    state.loading = isLoading;
    if (els.searchButton) els.searchButton.disabled = isLoading;
  }

  function showSearchError(message) {
    if (!els.searchError) return;
    els.searchError.textContent = message;
    els.searchError.hidden = false;
  }

  function hideSearchError() {
    if (!els.searchError) return;
    els.searchError.textContent = '';
    els.searchError.hidden = true;
  }

  // ---------- formatting helpers ----------

  function formatLocalTime(value) {
    if (!value) return 'Local time unavailable';
    var match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(value));
    if (!match) return String(value);
    var date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    var hours = Number(match[4]);
    var minutes = Number(match[5]);
    var ampm = hours >= 12 ? 'PM' : 'AM';
    var hours12 = hours % 12 === 0 ? 12 : hours % 12;
    var weekday = date.toLocaleString('en-US', { weekday: 'short' });
    var month = date.toLocaleString('en-US', { month: 'short' });
    var day = date.getDate();
    return weekday + ', ' + month + ' ' + day + ' · ' + hours12 + ':' + (minutes < 10 ? '0' : '') + minutes + ' ' + ampm;
  }

  function uvLabel(uv) {
    var value = Number(uv);
    if (value <= 2) return 'Low';
    if (value <= 5) return 'Moderate';
    if (value <= 7) return 'High';
    if (value <= 10) return 'Very High';
    return 'Extreme';
  }

  // ---------- rendering ----------

  function renderWeather(data) {
    var location = data.location || {};
    var current = data.current || {};

    setText(els.city, location.name || 'Unknown');
    setText(els.region, [location.region, location.country].filter(Boolean).join(', '));
    setText(els.condition, current.condition && current.condition.text ? current.condition.text : 'Unknown');

    var tempC = Number(current.temp_c);
    setText(els.temp, String(Math.round(tempC)));
    setText(els.unit, '°C');

    var feelsC = Number(current.feelslike_c);
    setText(els.feels, 'Feels like ' + Math.round(feelsC) + '°C');

    setText(els.time, 'Local time ' + formatLocalTime(location.localtime));

    var icon = current.condition ? current.condition.icon : '';
    if (icon) {
      els.icon.hidden = false;
      els.icon.src = icon.indexOf('//') === 0 ? 'https:' + icon : icon;
    }

    setText(document.getElementById('metric-feels'), String(Math.round(feelsC)));
    setText(document.getElementById('metric-humidity'), String(Math.round(Number(current.humidity) || 0)));
    setText(document.getElementById('metric-wind'), String(Math.round(Number(current.wind_kph) || 0)));
    setText(document.getElementById('metric-uv'), String(Math.round(Number(current.uv) || 0)));
    setText(document.getElementById('metric-cloud'), String(Math.round(Number(current.cloud) || 0)));
  }

  function renderMood(data) {
    var current = data.current || {};
    var mood = global.WeatherMood.computeMood(current.temp_c, current.humidity, current.wind_kph);

    setText(els.moodBadge, mood.label);
    setText(els.moodDescription, mood.description);
    if (els.moodPanel) {
      els.moodPanel.style.background = mood.soft;
      els.moodPanel.style.borderColor = mood.color;
    }
    if (els.moodBadge) {
      els.moodBadge.style.background = mood.color;
      els.moodBadge.style.color = '#14100e';
    }
  }

  // ---------- JSON inspector ----------

  function escapeHtml(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlightJson(text) {
    var pattern = /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(\.\d+)?([eE][+-]?\d+)?/g;
    return escapeHtml(text).replace(pattern, function (match) {
      var cssClass = 'json-number';
      if (match.charAt(0) === '"') {
        cssClass = match.charAt(match.length - 1) === ':' ? 'json-key' : 'json-string';
      } else if (/true|false/.test(match)) {
        cssClass = 'json-bool';
      } else if (/null/.test(match)) {
        cssClass = 'json-null';
      }
      return '<span class="' + cssClass + '">' + match + '</span>';
    });
  }

  function getActiveJsonText() {
    if (els.tabRaw && els.tabRaw.getAttribute('aria-selected') === 'true') {
      return els.jsonRaw ? els.jsonRaw.textContent : '';
    }
    return els.jsonFormatted ? els.jsonFormatted.textContent : '';
  }

  function setJsonText(which, text) {
    var el = which === 'raw' ? els.jsonRaw : els.jsonFormatted;
    if (!el) return;
    el.textContent = text;
    if (which === 'formatted') {
      el.innerHTML = highlightJson(text);
    }
  }

  function activateTab(which) {
    if (els.tabRaw) els.tabRaw.setAttribute('aria-selected', which === 'raw' ? 'true' : 'false');
    if (els.tabFormatted) els.tabFormatted.setAttribute('aria-selected', which === 'formatted' ? 'true' : 'false');
    if (els.panelRaw) els.panelRaw.hidden = which !== 'raw';
    if (els.panelFormatted) els.panelFormatted.hidden = which !== 'formatted';
  }

  function renderInspector(result) {
    setJsonText('raw', result.raw);
    setJsonText('formatted', JSON.stringify(result.data, null, 2));
    activateTab('formatted');
  }

  async function copyJson() {
    var text = getActiveJsonText();
    var copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch (err) {
      try {
        var area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        copied = document.execCommand('copy');
        document.body.removeChild(area);
      } catch (err2) {
        copied = false;
      }
    }
    var button = els.copyButton;
    if (button) {
      button.disabled = true;
      var original = button.textContent;
      button.textContent = 'Copied!';
      setTimeout(function () {
        button.disabled = false;
        button.textContent = original;
      }, 1600);
    }
  }

  // ---------- search flow ----------

  async function runSearch(city) {
    var trimmed = (city || '').trim();
    if (!trimmed) {
      return;
    }

    var requestId = ++state.requestId;
    state.loading = true;
    state.error = null;
    state.data = null;
    state.raw = '';
    state.city = trimmed;
    setLoading(true);
    showState('loading');

    try {
      var result = await WeatherAPI.fetchWeather(trimmed);
      if (requestId !== state.requestId) return;
      state.data = result.data;
      state.raw = result.raw;
      setActiveChip(result.city);
      renderWeather(result.data);
      renderMood(result.data);
      renderInspector(result);
      setLoading(false);
      showState('weather');
    } catch (err) {
      if (requestId !== state.requestId) return;
      state.error = err;
      setLoading(false);
      showState('error');
      if (els.errorMessage) els.errorMessage.textContent = err.message || 'Something went wrong while fetching the weather.';
    }
  }

  function submitCity(city) {
    var trimmed = (city || '').trim();
    if (!trimmed) {
      if (els.input) els.input.value = '';
      showSearchError('Please enter a city name.');
      if (els.input) els.input.focus();
      return;
    }
    hideSearchError();
    state.lastQuery = trimmed;
    runSearch(trimmed);
  }

  // ---------- chips ----------

  function renderChips() {
    if (!els.chips) return;
    els.chips.innerHTML = '';
    CHIPS.forEach(function (name) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.dataset.city = name;
      chip.textContent = name;
      chip.addEventListener('click', function () {
        if (els.input) els.input.value = name;
        if (els.chips) {
          var chips = els.chips.querySelectorAll('.chip');
          chips.forEach(function (c) {
            var active = c.dataset.city === name;
            c.classList.toggle('selected', active);
            if (active) c.setAttribute('aria-pressed', 'true');
            else c.removeAttribute('aria-pressed');
          });
        }
        runSearch(name);
      });
      els.chips.appendChild(chip);
    });
  }

  function setActiveChip(city) {
    if (!els.chips) return;
    var chips = els.chips.querySelectorAll('.chip');
    chips.forEach(function (chip) {
      var isActive = chip.dataset.city === city;
      chip.classList.toggle('selected', isActive);
      if (isActive) chip.setAttribute('aria-pressed', 'true');
      else chip.removeAttribute('aria-pressed');
    });
  }

  // ---------- events ----------

  function bindEvents() {
    if (els.form) {
      els.form.addEventListener('submit', function (event) {
        event.preventDefault();
        submitCity(els.input ? els.input.value : '');
      });
    }

    if (els.retryButton) {
      els.retryButton.addEventListener('click', function () {
        submitCity((els.input && els.input.value) || state.lastQuery || '');
      });
    }

    if (els.copyButton) {
      els.copyButton.addEventListener('click', function () {
        copyJson();
      });
    }

    if (els.tabRaw) {
      els.tabRaw.addEventListener('click', function () {
        activateTab('raw');
      });
    }
    if (els.tabFormatted) {
      els.tabFormatted.addEventListener('click', function () {
        activateTab('formatted');
      });
    }
  }

  // ---------- boot ----------

  function boot() {
    init();
    bindEvents();
    renderChips();
    showState('empty');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : this);
