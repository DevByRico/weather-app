document.addEventListener("DOMContentLoaded", () => {
  const apiKey = "0054e0f11302fdf0da98864321869dbe";
  const userLang = navigator.language.split("-")[0];

  const weatherForm = document.getElementById("weatherForm") as HTMLFormElement;
  const weatherResult = document.getElementById("weatherResult") as HTMLElement;
  const toggleForecastBtn = document.getElementById("toggleForecast") as HTMLButtonElement;
  const forecastContainer = document.getElementById("forecastContainer") as HTMLElement;
  const themeSwitch = document.getElementById("themeSwitch") as HTMLInputElement;
  const locationInputField = document.getElementById("location") as HTMLInputElement;

  let currentCity = "";
  let currentCountry = "";

  toggleForecastBtn.addEventListener("click", () => {
    forecastContainer.classList.toggle("hidden");
    toggleForecastBtn.innerHTML = forecastContainer.classList.contains("hidden")
      ? "⛅ Show next days"
      : "🌥️ Hide next days";
  });

  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
    themeSwitch.checked = true;
  }

  themeSwitch.addEventListener("change", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
  });

  weatherForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const locationInput = locationInputField.value.trim();

    if (!locationInput) {
      weatherResult.innerHTML = `<p>⚠️ Please enter a city name.</p>`;
      return;
    }

    const query = encodeURIComponent(locationInput);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${apiKey}&units=metric&lang=${userLang}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("City not found");

      const data = await response.json();
      currentCity = data.name;
      currentCountry = data.sys.country;
      showWeather(data);
    } catch (error: any) {
      weatherResult.innerHTML = `<p>⚠️ ${error.message}</p>`;
    }
  });

  // 🔁 RESET TO LOCAL WEATHER if the search field is cleared
  locationInputField.addEventListener("input", () => {
    if (locationInputField.value.trim() === "") {
      weatherResult.innerHTML = "";
      forecastContainer.innerHTML = "";
      forecastContainer.classList.add("hidden");
      toggleForecastBtn.innerHTML = "⛅ Show next days";
      showLocalWeather();
    }
  });

  async function showLocalWeather() {
    const geoUrl = "https://ipapi.co/json/";

    try {
      const res = await fetch(geoUrl);
      if (!res.ok) throw new Error("Location fetch failed");

      const loc = await res.json();
      const lat = loc.latitude;
      const lon = loc.longitude;

      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=${userLang}`;
      const weatherRes = await fetch(weatherUrl);
      const weatherData = await weatherRes.json();

      currentCity = loc.city || weatherData.name;
      currentCountry = loc.country_name || weatherData.sys.country;

      const locationNote = document.createElement("p");
      locationNote.innerHTML = `📍 <em>Showing weather for your IP location: ${currentCity}, ${currentCountry}</em>`;
      locationNote.style.marginTop = "0.5rem";
      locationNote.style.fontStyle = "italic";
      locationNote.style.opacity = "0.8";
      weatherResult.prepend(locationNote);

      showWeather(weatherData);
    } catch (err) {
      console.error("Failed to load local weather:", err);
    }
  }

  function getWeatherEmoji(description: string): string {
    const lower = description.toLowerCase();
    if (lower.includes("clear")) return "☀️";
    if (lower.includes("cloud")) return "☁️";
    if (lower.includes("rain")) return "🌧️";
    if (lower.includes("storm") || lower.includes("thunder")) return "⛈️";
    if (lower.includes("snow")) return "❄️";
    if (lower.includes("mist") || lower.includes("fog")) return "🌫️";
    return "🌤️";
  }

  function setBackground(description: string) {
    const lower = description.toLowerCase();
    let bg = "#1e3a8a"; // default

    if (lower.includes("clear")) {
      bg = "linear-gradient(to top, #fbc2eb, #a6c1ee)";
    } else if (lower.includes("rain")) {
      bg = "linear-gradient(to top, #bdc3c7, #2c3e50)";
    } else if (lower.includes("cloud")) {
      bg = "linear-gradient(to top, #dfe9f3, #ffffff)";
    } else if (lower.includes("snow")) {
      bg = "linear-gradient(to top, #e0eafc, #cfdef3)";
    } else if (lower.includes("storm")) {
      bg = "linear-gradient(to top, #373B44, #4286f4)";
    }

    document.body.style.background = bg;
  }

  function showWeather(data: any) {
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    const description = data.weather[0].description;
    const capitalizedDescription = description.charAt(0).toUpperCase() + description.slice(1);
    const emoji = getWeatherEmoji(description);

    weatherResult.innerHTML = `
      <h2>${currentCity}, ${currentCountry}</h2>
      <img src="${iconUrl}" alt="Weather icon" />
      <p>${emoji} ${capitalizedDescription}</p>
      <p>🌡️ ${Math.round(data.main.temp)}°C</p>
      <p>💧 Humidity: ${data.main.humidity}%</p>
      <p>💨 Wind: ${Math.round(data.wind.speed)} m/s</p>
    `;

    weatherResult.classList.remove("fade");
    void weatherResult.offsetWidth;
    weatherResult.classList.add("fade");

    setBackground(description);
    showForecast(currentCity, currentCountry);
  }

  async function showForecast(city: string, countryCode: string) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
      city
    )},${countryCode}&appid=${apiKey}&units=metric&lang=${userLang}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      const dailyData = data.list.filter((item: any) => item.dt_txt.includes("12:00:00"));

      forecastContainer.innerHTML = dailyData
        .slice(0, 5)
        .map((item: any) => {
          const date = new Date(item.dt_txt);
          const day = date.toLocaleDateString(userLang, { weekday: "long" });
          const icon = item.weather[0].icon;
          const temp = Math.round(item.main.temp);
          const desc = item.weather[0].description;
          const emoji = getWeatherEmoji(desc);
          const capitalizedDesc = desc.charAt(0).toUpperCase() + desc.slice(1);
          return `
            <div class="forecast-day">
              <div><strong>${day}</strong></div>
              <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}" />
              <p>${emoji} ${capitalizedDesc}, ${temp}°C</p>
            </div>
          `;
        })
        .join("");
    } catch (error) {
      console.error("Failed to fetch forecast", error);
      forecastContainer.innerHTML = "<p>Forecast unavailable</p>";
    }
  }

  showLocalWeather();
});
