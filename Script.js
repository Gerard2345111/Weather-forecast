const apiKey = "YOUR_API_KEY_HERE";
let unit = "metric";
let lastCity = "";
let chart;

const loader = document.getElementById("loader");
const currentWeather = document.getElementById("currentWeather");
const forecastDiv = document.getElementById("forecast");
const hourlyDiv = document.getElementById("hourlyForecast");
const alertBox = document.getElementById("alertBox");

document.getElementById("toggleTheme").onclick = () =>
  document.body.classList.toggle("dark");

function showLoader(v){ loader.style.display = v ? "block" : "none"; }

function updateTime(){
  const now = new Date();
  document.getElementById("timeBox").innerHTML =
    `<strong>${now.toLocaleTimeString()}</strong><br>${now.toDateString()}`;
}
setInterval(updateTime,1000);
updateTime();

function searchCity(){
  const city = cityInput.value;
  if(!city) return;
  lastCity = city;
  fetchWeather(city);
}

function refreshWeather(){
  if(lastCity) fetchWeather(lastCity);
}

function toggleUnit(){
  unit = unit === "metric" ? "imperial" : "metric";
  if(lastCity) fetchWeather(lastCity);
}

function useLocation(){
  navigator.geolocation.getCurrentPosition(pos=>{
    fetchWeatherByCoords(pos.coords.latitude,pos.coords.longitude);
  });
}

function fetchWeather(city){
  showLoader(true);
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${apiKey}`)
  .then(r=>r.json())
  .then(d=>{
    showLoader(false);
    displayCurrent(d);
    fetchForecast(city);
    showAlert(d);
  });
}

function fetchWeatherByCoords(lat,lon){
  showLoader(true);
  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`)
  .then(r=>r.json())
  .then(d=>{
    showLoader(false);
    lastCity=d.name;
    displayCurrent(d);
    fetchForecast(d.name);
    showAlert(d);
  });
}

function fetchForecast(city){
  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${apiKey}`)
  .then(r=>r.json())
  .then(data=>{
    hourlyDiv.innerHTML=data.list.slice(0,8).map(h=>`
      <div>
        ${new Date(h.dt_txt).getHours()}:00<br>
        <img src="https://openweathermap.org/img/wn/${h.weather[0].icon}.png">
        ${Math.round(h.main.temp)}°
      </div>`).join("");

    forecastDiv.innerHTML=`
      <div class="forecast">
        ${data.list.filter((_,i)=>i%8===0).slice(0,5).map(d=>`
          <div>
            ${new Date(d.dt_txt).toLocaleDateString("en",{weekday:"short"})}<br>
            <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}.png"><br>
            ${Math.round(d.main.temp)}°
          </div>`).join("")}
      </div>`;

    drawChart(data);
  });
}

function drawChart(data){
  const labels=data.list.slice(0,8).map(d=>new Date(d.dt_txt).getHours()+":00");
  const temps=data.list.slice(0,8).map(d=>d.main.temp);

  if(chart) chart.destroy();
  chart=new Chart(tempChart,{
    type:"line",
    data:{labels,datasets:[{label:"Temp",data:temps,tension:0.4}]}
  });
}

function weatherAdvice(cond,temp){
  if(cond.includes("Rain")) return "🌧 Carry an umbrella";
  if(cond.includes("Clear") && temp>30) return "☀ Stay hydrated";
  if(temp<10) return "🧥 Wear warm clothes";
  return "😊 Have a great day";
}

function displayCurrent(d){
  const icon=d.weather[0].icon;
  const sunrise=new Date(d.sys.sunrise*1000).toLocaleTimeString();
  const sunset=new Date(d.sys.sunset*1000).toLocaleTimeString();

  currentWeather.innerHTML=`
    <div class="weather-card">
      <h2>${d.name}</h2>
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png">
      <div class="temp">${Math.round(d.main.temp)}°</div>
      <p>${weatherAdvice(d.weather[0].main,d.main.temp)}</p>
    </div>`;

  extraInfo.innerHTML=`
    <div>🌡 Feels Like<br>${Math.round(d.main.feels_like)}°</div>
    <div>💧 Humidity<br>${d.main.humidity}%</div>
    <div>💨 Wind<br>${d.wind.speed}</div>
    <div>🌅 Sunrise<br>${sunrise}</div>
    <div>🌇 Sunset<br>${sunset}</div>
    <div>🧭 Pressure<br>${d.main.pressure}</div>`;
}

function showAlert(d){
  alertBox.style.display="block";
  alertBox.className="alert-box";

  if(d.main.temp>=35){
    alertBox.classList.add("alert-hot");
    alertBox.innerHTML="🔥 Heat Alert";
  }else if(d.weather[0].main.includes("Rain")){
    alertBox.classList.add("alert-rain");
    alertBox.innerHTML="🌧 Rain Alert";
  }else if(d.weather[0].main.includes("Thunder")){
    alertBox.classList.add("alert-storm");
    alertBox.innerHTML="⛈ Storm Alert";
  }else if(d.main.temp<=5){
    alertBox.classList.add("alert-cold");
    alertBox.innerHTML="❄ Cold Alert";
  }else{
    alertBox.style.display="none";
  }
}