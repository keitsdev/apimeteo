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
const coordinatesTxt = document.getElementById("coordinates");
const searchTimeTxt = document.getElementById("search-time");
const weatherCondIcon = document.getElementById("weather-condition-icon");
const weatherCondName = document.getElementById("weather-condition-name");
const temperatureTxt = document.getElementById("temperature");
const apparentTemperatureTxt = document.getElementById("apparent-temperature");
const humidityTxt = document.getElementById("humidity");
const windSpeedTxt = document.getElementById("wind-speed");
const windDirectionTxt = document.getElementById("wind-direction");
const uvIndexTxt = document.getElementById("uv-index");
const locationInput = document.getElementById("location-input");
const dailyForecastElems = document.getElementById("daily-forecast");
const errTxt = document.getElementById("errTxt");
const searchHistoryElem = document.getElementById("search-history");

const disambiguationBox = document.getElementById("disambiguation-box");
const locationListElem = document.getElementById("location-list");

const HISTORY_KEY = "weather_search_history";

function getWindDirection(degrees) {
  const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

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

async function fetchLocations(location) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=5&language=pt&format=json`
  );
  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("Localização não encontrada");
  }

  return data.results.map((item) => {
    const regionInfo = [item.admin1, item.country].filter(Boolean).join(", ");
    return {
      name: regionInfo ? `${item.name}, ${regionInfo}` : item.name,
      lat: item.latitude,
      lon: item.longitude
    };
  });
}

async function getWeatherByCoords(lat, lon, name) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`
  );

  if (!res.ok) throw new Error("Erro ao obter dados meteorológicos");

  const data = await res.json();
  return {
    name,
    lat,
    lon,
    current: data.current,
    daily: data.daily
  };
}

function displayWeatherDetails(weather) {
  const {
    temperature_2m,
    apparent_temperature,
    relative_humidity_2m,
    is_day,
    weather_code,
    wind_speed_10m,
    wind_direction_10m
  } = weather.current;

  const {
    weather_code: daily_weather_code,
    temperature_2m_max,
    temperature_2m_min,
    uv_index_max,
    time
  } = weather.daily;

  const weatherCondition = weather_codes[weather_code] || { name: "Desconhecido", icons: { day: "clear.svg", night: "clear-night.svg" } };
  const imgSrc = `https://arsentech.github.io/source-codes/weather-assets/${
    is_day ? weatherCondition.icons.day : weatherCondition.icons.night
  }`;

  const now = new Date();
  const formattedDate = now.toLocaleDateString("pt-BR");
  const formattedTime = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  locationTxt.textContent = weather.name;
  if (coordinatesTxt) {
    coordinatesTxt.textContent = `Lat: ${weather.lat.toFixed(2)}° | Lon: ${weather.lon.toFixed(2)}°`;
  }
  if (searchTimeTxt) {
    searchTimeTxt.textContent = `Consulta realizada em: ${formattedDate} às ${formattedTime}`;
  }
  temperatureTxt.textContent = Math.round(temperature_2m);
  if (apparentTemperatureTxt) {
    apparentTemperatureTxt.textContent = Math.round(apparent_temperature);
  }
  humidityTxt.textContent = relative_humidity_2m;
  windSpeedTxt.textContent = Math.round(wind_speed_10m);
  if (windDirectionTxt) {
    windDirectionTxt.textContent = getWindDirection(wind_direction_10m);
  }
  if (uvIndexTxt) {
    const todayUv = uv_index_max && uv_index_max[0] ? uv_index_max[0].toFixed(1) : "0";
    uvIndexTxt.textContent = todayUv;
  }

  weatherCondName.textContent = weatherCondition.name;
  weatherCondIcon.src = imgSrc;

  dailyForecastElems.innerHTML = "";
  for (let i = 0; i < 7; i++) {
    const weatherCond = weather_codes[daily_weather_code[i]] || { icons: { day: "clear.svg" } };
    const temperatureMax = Math.round(temperature_2m_max[i]);
    const temperatureMin = Math.round(temperature_2m_min[i]);

    const dateParts = time[i].split("-");
    const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const dayName = dateObj.toLocaleDateString("pt-BR", { weekday: "short" });
    const cardDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

    const elem = document.createElement("div");
    elem.className = "card";
    elem.innerHTML = `
      <p><strong>${dayName.toUpperCase()}</strong></p>
      <img src="https://arsentech.github.io/source-codes/weather-assets/${weatherCond.icons.day}" alt="weather-icon" width="60" height="60"/>
      <div class="temps">
        <p class="temp" title="Temperatura Máxima">${temperatureMax}°C</p>
        <p class="temp" title="Temperatura Mínima">${temperatureMin}°C</p>
      </div>
      <p class="date">${cardDate}</p>
    `;
    dailyForecastElems.appendChild(elem);
  }

  saveToHistory(weather.name);
  weatherDetailsElem.classList.add("active");
}

function showDisambiguationList(locations) {
  locationListElem.innerHTML = "";
  locations.forEach((loc) => {
    const btn = document.createElement("button");
    btn.className = "location-btn";
    btn.textContent = loc.name;
    btn.addEventListener("click", async () => {
      disambiguationBox.classList.add("hidden");
      try {
        const weather = await getWeatherByCoords(loc.lat, loc.lon, loc.name);
        displayWeatherDetails(weather);
      } catch (error) {
        errTxt.textContent = error.message || "Erro ao carregar clima.";
      }
    });
    locationListElem.appendChild(btn);
  });
  disambiguationBox.classList.remove("hidden");
}

searchBox.addEventListener("submit", async (e) => {
  e.preventDefault();
  weatherDetailsElem.classList.remove("active");
  disambiguationBox.classList.add("hidden");
  dailyForecastElems.innerHTML = "";

  const query = locationInput.value.trim();

  if (query === "") {
    errTxt.textContent = "Por favor, digite uma localização.";
    return;
  }

  errTxt.textContent = "";

  try {
    const locations = await fetchLocations(query);

    if (locations.length === 1) {
      const weather = await getWeatherByCoords(locations[0].lat, locations[0].lon, locations[0].name);
      displayWeatherDetails(weather);
    } else {
      showDisambiguationList(locations);
    }
  } catch (error) {
    errTxt.textContent = error.message || "Localização não encontrada";
  }
});

renderHistory();