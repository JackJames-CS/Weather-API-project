const API_KEY = "7011db12ffdef36c0bb2d541a740a01d";

async function fetchWeather() {
  const city = document.getElementById("cityInput").value.trim();
  const errorEl = document.getElementById("error");
  const cityEl = document.getElementById("city");
  const weatherEl = document.getElementById("weather");
  

  // reset UI
  errorEl.textContent = "";
  cityEl.textContent = "";
  weatherEl.innerHTML = "";

  if (!city) {
    errorEl.textContent = "Please enter a city name.";
    return;
  }

  try {
    // units=metric gives Celsius
    const url =
      `https://api.openweathermap.org/data/2.5/weather` +
      `?q=${encodeURIComponent(city)},IE` +
      `&appid=${API_KEY}` +
      `&units=metric`;

    const res = await fetch(url);

    // OpenWeather sends JSON even on errors
    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.message
        ? `Error: ${data.message}`
        : "Could not fetch weather.";
      return;
    }

    // display
    const temp = data.main.temp;
    const feels = data.main.feels_like;
    const desc = data.weather[0].description;
    const wind = data.wind.speed;

    cityEl.textContent = `${data.name}, ${data.sys.country}`;
    weatherEl.innerHTML = `
      <p><strong>${desc}</strong></p>
      <p>Temp: ${temp}°C (feels like ${feels}°C)</p>
      <p>Wind: ${wind} m/s</p>
    `;
  } catch (err) {
    errorEl.textContent = "Network error. Try again.";
    console.error(err);
  }
}
