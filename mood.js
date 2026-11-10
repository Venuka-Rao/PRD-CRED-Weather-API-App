(function (global) {
  'use strict';

  // Deterministic mood engine.
  // Priority order matters: higher-priority conditions are evaluated first.
  // See README.md for the full rule table.
  var MOODS = {
    scorching: {
      id: 'scorching',
      label: 'Scorching',
      color: '#ff6b35',
      soft: 'rgba(255, 107, 53, 0.14)',
      description: 'Heat index is extreme. Seek shade, hydrate, and delay outdoor exertion.',
    },
    freezing: {
      id: 'freezing',
      label: 'Freezing',
      color: '#5aa9ff',
      soft: 'rgba(90, 169, 255, 0.14)',
      description: 'Wind chill is dangerously low. Cover exposed skin and limit time outside.',
    },
    muggy: {
      id: 'muggy',
      label: 'Muggy',
      color: '#e8b34b',
      soft: 'rgba(232, 179, 75, 0.14)',
      description: 'Humidity is oppressive. Find shade or an air-conditioned space.',
    },
    windy: {
      id: 'windy',
      label: 'Windy',
      color: '#9aa7b8',
      soft: 'rgba(154, 167, 184, 0.14)',
      description: 'Gusts are above 30 km/h. Secure loose objects and hold onto rails.',
    },
    pleasant: {
      id: 'pleasant',
      label: 'Pleasant',
      color: '#4ade80',
      soft: 'rgba(74, 222, 128, 0.14)',
      description: 'Golden conditions. Ideal for outdoor plans.',
    },
    comfortable: {
      id: 'comfortable',
      label: 'Comfortable',
      color: '#2dd4bf',
      soft: 'rgba(45, 212, 191, 0.14)',
      description: 'Mild and settled. A comfortable day overall.',
    },
    mixed: {
      id: 'mixed',
      label: 'Mixed',
      color: '#c084fc',
      soft: 'rgba(192, 132, 252, 0.14)',
      description: 'Conflicting signals. Layer up or adjust plans accordingly.',
    },
  };

  function computeMood(tempC, humidity, windKph) {
    tempC = Number(tempC);
    humidity = Number(humidity);
    windKph = Number(windKph);

    var mood;
    if (tempC >= 38) {
      mood = MOODS.scorching;
    } else if (tempC <= 5) {
      mood = MOODS.freezing;
    } else if (humidity >= 80 && tempC >= 28) {
      mood = MOODS.muggy;
    } else if (windKph >= 30) {
      mood = MOODS.windy;
    } else if (tempC >= 20 && tempC <= 30 && humidity <= 60 && windKph <= 20) {
      mood = MOODS.pleasant;
    } else if (tempC >= 15 && tempC <= 30 && humidity <= 75 && windKph <= 30) {
      mood = MOODS.comfortable;
    } else {
      mood = MOODS.mixed;
    }

    return {
      id: mood.id,
      label: mood.label,
      color: mood.color,
      soft: mood.soft,
      description: mood.description,
      tempC: tempC,
      humidity: humidity,
      windKph: windKph,
    };
  }

  global.WeatherMood = {
    MOODS: MOODS,
    computeMood: computeMood,
  };
})(typeof window !== 'undefined' ? window : this);
