const weatherapp = document.querySelector(".weatherapp");
const cityInput = document.querySelector(".cityInput");
const card = document.querySelector(".card");
const apikey = API_key;
const submitBtn = weatherapp.querySelector('button[type="submit"]');

const unitToggle = document.querySelector(".unitToggle");
const recentBox = document.querySelector("#recent");
const resultsBox = document.querySelector("#results");

renderRecentSearches();

let units = localStorage.getItem("units") || "metric";

function unitSymbol() {
    return units === "metric" ? "°C" : "°F";
}

unitToggle.textContent = unitSymbol();

unitToggle.addEventListener("click", () => {
    units = (units === "metric") ? "imperial" : "metric";
    localStorage.setItem("units", units);
    unitToggle.textContent = unitSymbol();
});


const navButtons = document.querySelectorAll(".navBtn");
const pages = document.querySelectorAll(".page");

function showPage(pageId){
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");

  navButtons.forEach(b => b.classList.remove("active"));
  document.querySelector(`.navBtn[data-page="${pageId}"]`).classList.add("active");
}
navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    showPage(btn.dataset.page);
  });
});
weatherapp.addEventListener("submit", async (event) => {
  event.preventDefault();

  const query = cityInput.value.trim();
  if(!query){
    displayError("Please enter a city");
    return;
  }

  try{
    // loading on
    submitBtn.disabled = true;
    submitBtn.textContent = "Loading...";

    const places = await getCitySuggestions(query);

    if(places.length === 0){
      displayError("No matching cities found");
      return;
    }

    // If only one result, auto-pick it
    if(places.length === 1){
      resultsBox.style.display = "none";
      await fetchAndDisplayByPlace(places[0]);
      return;
    }

    // Otherwise show dropdown
    showSuggestions(places);

  } catch(err){
    console.error(err);
    displayError(err.message || "Something went wrong");
  } finally{
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
});
async function getWeatherData(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apikey}&units=${units}`;



    const response = await fetch(apiUrl);
    
    if(!response.ok){
    if(response.status === 404){
        throw new Error("City not found. Check the spelling and try again.");
    }
    if(response.status === 401){
        throw new Error("API key error (401).");
    }
    throw new Error("Could not fetch weather data.");
}
    return await response.json();
}
function displayWeatherInfo(data){

    const existingError = card.querySelector(".errorDisplay");
    if (existingError) existingError.remove();

    const {name: city, 
           main: {temp, humidity}, 
           weather: [{description, id}]} = data

    const { dt, timezone, sys: { sunrise, sunset } } = data;



    card.textContent = "";
    card.style.display = "flex";

    const cityDisplay = document.createElement("h1");
    const tempDisplay = document.createElement("p");
    const humidityDisplay = document.createElement("p");
    const descDisplay = document.createElement("p");
    const weatherEmoji = document.createElement("p");
    const localTime = formatCityTime(dt, timezone);
    const sunriseTime = formatCityTime(sunrise, timezone);
    const sunsetTime = formatCityTime(sunset, timezone);
    const extraInfo = document.createElement("div");
    extraInfo.classList.add("extraInfo");





    cityDisplay.textContent = city;
    tempDisplay.textContent = `${temp.toFixed(1)}${unitSymbol()}`;
    humidityDisplay.textContent = `Humidity: ${humidity}%`;
    descDisplay.textContent = description;
    weatherEmoji.textContent = getWeatherEmoji(id);

    cityDisplay.classList.add("CityDisplay");
    tempDisplay.classList.add("TempDisplay");
    humidityDisplay.classList.add("humidityDisplay");
    descDisplay.classList.add("descDisplay");
    weatherEmoji.classList.add("weatherEmoji");

    extraInfo.innerHTML = `
  <p><b>Local time:</b> ${localTime}</p>
  <p><b>Sunrise:</b> ${sunriseTime}</p>
  <p><b>Sunset:</b> ${sunsetTime}</p>
`;

    card.appendChild(cityDisplay);
    card.appendChild(tempDisplay);
    card.appendChild(humidityDisplay);
    card.appendChild(descDisplay);
    card.appendChild(weatherEmoji);
    card.appendChild(extraInfo);



}
function getWeatherEmoji(weatherId){

    switch(true){
        case (weatherId >= 200 && weatherId < 300):
            return "⛈";
        case (weatherId >= 300 && weatherId < 400):
            return "🌧";
        case (weatherId >= 500 && weatherId < 600):
            return "🌧";
        case (weatherId >= 600 && weatherId < 700):
            return "❄";
        case (weatherId >= 700 && weatherId < 800):
            return "🌫";
        case (weatherId === 800):
            return "☀";
        case (weatherId >= 801 && weatherId < 810):
            return "☁";
        default:
            return "❓";
    }
}
function displayError(message){
    resultsBox.style.display = "none";
    card.textContent = "";
    card.style.display = "flex";

    const errorDisplay = document.createElement("p");
    errorDisplay.textContent = message;
    errorDisplay.classList.add("errorDisplay");

    card.appendChild(errorDisplay);
}
function getRecentSearches(){
    return JSON.parse(localStorage.getItem("recentCities")) || [];
}
function saveRecentSearch(city){
    let cities = getRecentSearches();

    // remove duplicates (case-insensitive)
    cities = cities.filter(c => c.toLowerCase() !== city.toLowerCase());

    // add to front
    cities.unshift(city);

    // keep only 5
    cities = cities.slice(0, 5);

    localStorage.setItem("recentCities", JSON.stringify(cities));
    renderRecentSearches();
}
function renderRecentSearches(){
    const cities = getRecentSearches();
    recentBox.innerHTML = "";

    if(cities.length === 0) return;

    cities.forEach(city => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = city;

        btn.addEventListener("click", async () => {
            cityInput.value = city;
            try{
                submitBtn.disabled = true;
                submitBtn.textContent = "Loading...";

                const weatherData = await getWeatherData(city);
                displayWeatherInfo(weatherData);
            } catch(err){
                displayError(err.message);
            } finally{
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit";
            }
        });

        recentBox.appendChild(btn);
    });
}
function getCityLocalTimeString(timezoneOffsetSeconds) {
  const nowUtcMs = Date.now() + new Date().getTimezoneOffset() * 60_000; // convert local -> UTC
  const cityMs = nowUtcMs + timezoneOffsetSeconds * 1000;
  const d = new Date(cityMs);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
async function getCitySuggestions(query){
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apikey}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error("Could not fetch city suggestions");

  const data = await res.json();

  // Ireland first
  data.sort((a,b) => (b.country === "IE") - (a.country === "IE"));
  return data;
}
function showSuggestions(places){
  resultsBox.innerHTML = "";
  resultsBox.style.display = "block";

  places.forEach(place => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "result-item";

    const parts = [place.name];
    if(place.state) parts.push(place.state);
    parts.push(place.country);

    btn.textContent = parts.join(", ");

    btn.addEventListener("click", async () => {
      resultsBox.style.display = "none";
      cityInput.value = place.name;

      try{
        submitBtn.disabled = true;
        submitBtn.textContent = "Loading...";
        await fetchAndDisplayByPlace(place);
      } catch(err){
        console.error(err);
        displayError(err.message || "Something went wrong");
      } finally{
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit";
      }
    });

    resultsBox.appendChild(btn);
  });
}
async function fetchAndDisplayByPlace(place){
  const weatherData = await getWeatherByCoords(place.lat, place.lon);
  displayWeatherInfo(weatherData);
}
async function getWeatherByCoords(lat, lon){
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apikey}&units=${units}`;
  const response = await fetch(apiUrl);

  if(!response.ok){
    if(response.status === 401) throw new Error("API key error (401)");
    if(response.status === 429) throw new Error("Rate limit hit (429)");
    throw new Error("Could not fetch weather data");
  }

  return await response.json();
}
function formatCityTime(utcSeconds, timezoneOffsetSeconds){
    const ms = (utcSeconds + timezoneOffsetSeconds) * 1000;
    const d = new Date(ms);

    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");

    return `${hh}:${mm}`;
}
