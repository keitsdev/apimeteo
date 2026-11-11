const weather_codes = {
  0: { name: "Céu Limpo", icons: { day: "clear.svg", night: "clear-night.svg" } },
  1: { name: "Predominantemente Limpo", icons: { day: "clear.svg", night: "clear-night.svg" } },
  2: { name: "Parcialmente Nublado", icons: { day: "partly-cloudy.svg", night: "partly-cloudy-night.svg" } },
  3: { name: "Nublado", icons: { day: "overcast.svg", night: "overcast.svg" } },
  45: { name: "Névoa", icons: { day: "fog.svg", night: "fog-night.svg" } },
  48: { name: "Nevoeiro Congelante", icons: { day: "rime-fog.svg", night: "rime-fog.svg" } },
  51: { name: "Chuvisco Leve", icons: { day: "light-drizzle.svg", night: "light-drizzle.svg" } },
  53: { name: "Chuvisco Moderado", icons: { day: "drizzle.svg", night: "drizzle.svg" } },
  55: { name: "Chuvisco Intenso", icons: { day: "heavy-drizzle.svg", night: "heavy-drizzle.svg" } },
  56: { name: "Chuvisco Leve com Congelamento", icons: { day: "drizzle.svg", night: "drizzle.svg" } },
  57: { name: "Chuvisco Congelante Intenso", icons: { day: "heavy-drizzle.svg", night: "heavy-drizzle.svg" } },
  61: { name: "Chuva Leve", icons: { day: "slight-rain.svg", night: "slight-rain-night.svg" } },
  63: { name: "Chuva Moderada", icons: { day: "rain.svg", night: "rain.svg" } },
  65: { name: "Chuva Forte", icons: { day: "heavy-rain.svg", night: "heavy-rain.svg" } },
  66: { name: "Chuva Congelante Fraca", icons: { day: "rain.svg", night: "rain.svg" } },
  67: { name: "Chuva Congelante Intensa", icons: { day: "heavy-rain.svg", night: "heavy-rain.svg" } },
  71: { name: "Leve Queda de Neve", icons: { day: "light-snow.svg", night: "light-snow-night.svg" } },
  73: { name: "Nevasca Moderada", icons: { day: "snow.svg", night: "snow.svg" } },
  75: { name: "Nevasca", icons: { day: "heavy-snow.svg", night: "heavy-snow.svg" } },
  77: { name: "Grãos de Neve", icons: { day: "snow-grains.svg", night: "snow-grains.svg" } },
  80: { name: "Chuvas Leves e Passageiras", icons: { day: "slight-rain-showers.svg", night: "slight-rain-showers-night.svg" } },
  81: { name: "Pancadas de Chuva Moderadas", icons: { day: "rain-showers.svg", night: "rain-showers.svg" } },
  82: { name: "Chuvas Intensas", icons: { day: "heavy-rain-showers.svg", night: "heavy-rain-showers.svg" } },
  85: { name: "Pancadas de Neve Fraca", icons: { day: "light-snow-showers.svg", night: "light-snow-showers.svg" } },
  86: { name: "Pancadas de Neve Intensa", icons: { day: "heavy-snow-showers.svg", night: "heavy-snow-showers.svg" } },
  95: { name: "Tempestade", icons: { day: "thunderstorm.svg", night: "thunderstorm.svg" } },
  96: { name: "Pequena Tempestade de Granizo", icons: { day: "hail.svg", night: "hail.svg" } },
  99: { name: "Tempestade de Granizo Intensa", icons: { day: "heavy-hail.svg", night: "heavy-hail.svg" } }
};

const searchBox = document.getElementById("search-box");
const weatherDetailsElem = document.getElementById("weather-details");
const locationTxt = document.getElementById("location");
const weatherCondIcon = document.getElementById("weather-condition-icon");
const weatherCondName = document.getElementById("weather-condition-name");
const temperatureTxt = document.getElementById("temperature");
const humidityTxt = document.getElementById("humidity");
const windSpeedTxt = document.getElementById("wind-speed");
const locationInput = document.getElementById("location-input");
const dailyForecastElems = document.getElementById("daily-forecast");
const errTxt = document.getElementById("errTxt");
const searchHistoryElem = document.getElementById("search-history");

const HISTORY_KEY = "weather_search_history";

function getSearchHistory() {
  const history = localStorage.getItem(HISTORY_KEY);
  return history ? JSON.parse(history) : [];
}

function saveToHistory(locationName) {
  let history = getSearchHistory();
  history = history.filter((item) => item.toLowerCase() !== locationName.toLowerCase());
  history.unshift(locationName);
  if (history.length > 5) {
    history = history.slice(0, 5);
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = getSearchHistory();
  searchHistoryElem.innerHTML = "";

  history.forEach((city) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "history-item";
    chip.textContent = city;

    chip.addEventListener("click", () => {
      locationInput.value = city;
      searchBox.dispatchEvent(new Event("submit"));
    });

    searchHistoryElem.appendChild(chip);
  });
}

async function getLocation(location) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=pt&format=json`
  );
  const data = await res.json();
  
  if (!data.results || data.results.length === 0) {
    throw new Error("Localização não encontrada");
  }

  const result = data.results[0];
  const formattedName = result.country ? `${result.name}, ${result.country}` : result.name;

  return {
    name: formattedName,
    lat: result.latitude,
    lon: result.longitude
  };
}

async function getWeather(location) {
  const { lat, lon, name } = await getLocation(location);
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
  );
  
  if (!res.ok) throw new Error("Erro ao obter dados meteorológicos");

  const data = await res.json();
  return {
    name,
    current: data.current,
    daily: data.daily
  };
}

searchBox.addEventListener("submit", async (e) => {
  e.preventDefault();
  weatherDetailsElem.classList.remove("active");
  dailyForecastElems.innerHTML = "";
  
  const query = locationInput.value.trim();

  if (query === "") {
    errTxt.textContent = "Por favor, digite uma localização.";
    return;
  }

  errTxt.textContent = "";

  try {
    const weather = await getWeather(query);
    const {
      temperature_2m,
      relative_humidity_2m,
      is_day,
      weather_code,
      wind_speed_10m
    } = weather.current;

    const {
      weather_code: daily_weather_code,
      temperature_2m_max,
      temperature_2m_min,
      time
    } = weather.daily;

    const weatherCondition = weather_codes[weather_code] || { name: "Desconhecido", icons: { day: "clear.svg", night: "clear-night.svg" } };
    const imgSrc = `https://arsentech.github.io/source-codes/weather-assets/${
      is_day ? weatherCondition.icons.day : weatherCondition.icons.night
    }`;

    locationTxt.textContent = weather.name;
    temperatureTxt.textContent = Math.round(temperature_2m);
    humidityTxt.textContent = relative_humidity_2m;
    windSpeedTxt.textContent = Math.round(wind_speed_10m);
    weatherCondName.textContent = weatherCondition.name;
    weatherCondIcon.src = imgSrc;

    for (let i = 0; i < 7; i++) {
      const weatherCond = weather_codes[daily_weather_code[i]] || { icons: { day: "clear.svg" } };
      const temperatureMax = Math.round(temperature_2m_max[i]);
      const temperatureMin = Math.round(temperature_2m_min[i]);
      
      const dateParts = time[i].split("-");
      const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const dayName = dateObj.toLocaleDateString("pt-BR", { weekday: "short" });
      const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

      const elem = document.createElement("div");
      elem.className = "card";
      elem.innerHTML = `
        <p><strong>${dayName.toUpperCase()}</strong></p>
        <img src="https://arsentech.github.io/source-codes/weather-assets/${weatherCond.icons.day}" alt="weather-icon" width="60" height="60"/>
        <div class="temps">
          <p class="temp" title="Temperatura Máxima">${temperatureMax}°C</p>
          <p class="temp" title="Temperatura Mínima">${temperatureMin}°C</p>
        </div>
        <p class="date">${formattedDate}</p>
      `;
      dailyForecastElems.appendChild(elem);
    }

    saveToHistory(weather.name);
    weatherDetailsElem.classList.add("active");
  } catch (error) {
    errTxt.textContent = error.message || "Localização não encontrada";
  }
});

renderHistory();