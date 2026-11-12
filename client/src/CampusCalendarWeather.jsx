
import { useEffect, useState } from "react";

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=24.14&longitude=83.18&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia%2FKolkata";

function getWeatherInfo(code, isDay = 1) {
  if (code === 0) {
    return { label: "Clear sky", icon: isDay ? "☀️" : "🌙" };
  }
  if ([1, 2].includes(code)) {
    return { label: "Mostly clear", icon: isDay ? "🌤️" : "☁️" };
  }
  if (code === 3) return { label: "Overcast", icon: "☁️" };
  if ([45, 48].includes(code)) return { label: "Foggy", icon: "🌫️" };
  if ([51, 53, 55, 56, 57].includes(code)) {
    return { label: "Drizzle", icon: "🌦️" };
  }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { label: "Rain", icon: "🌧️" };
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { label: "Snow", icon: "❄️" };
  }
  if ([95, 96, 99].includes(code)) {
    return { label: "Thunderstorm", icon: "⛈️" };
  }
  return { label: "Conditions unavailable", icon: "🌡️" };
}

function CampusCalendarWeather() {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      try {
        const response = await fetch(WEATHER_URL);
        if (!response.ok) throw new Error("Weather service unavailable");

        const data = await response.json();
        if (!data.current) throw new Error("Weather data unavailable");

        if (!cancelled) {
          setWeather(data.current);
          setWeatherError("");
          setLastUpdated(new Date());
        }
      } catch {
        if (!cancelled) {
          setWeatherError("Weather data load nahi hua. Internet check karke retry karo.");
        }
      }
    }

    loadWeather();
    const intervalId = setInterval(loadWeather, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const monthName = visibleMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const selectedLabel = selectedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const weatherInfo = weather
    ? getWeatherInfo(weather.weather_code, weather.is_day)
    : null;

  function changeMonth(amount) {
    setVisibleMonth(new Date(year, month + amount, 1));
  }

  function isSameDay(a, b) {
    return (
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()
    );
  }

  return (
    <div className="campus-widgets-container">
      {/* LIVE CALENDAR */}
      <section className="campus-widget calendar-widget">
        <div className="campus-widget-header">
          <div>
            <span className="campus-widget-eyebrow">PLAN YOUR DAY</span>
            <h2>Campus Calendar</h2>
            <p>Explore dates and plan your schedule</p>
          </div>
          <div className="campus-widget-icon calendar-icon">▦</div>
        </div>

        <div className="calendar-live-toolbar">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
          >
            ‹
          </button>
          <strong>{monthName}</strong>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        <div className="calendar-live-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div className="calendar-weekday" key={day}>
              {day}
            </div>
          ))}

          {Array.from({ length: firstWeekday }, (_, index) => (
            <div className="calendar-empty-day" key={`empty-${index}`} />
          ))}

          {Array.from({ length: daysInMonth }, (_, index) => {
            const dayNumber = index + 1;
            const date = new Date(year, month, dayNumber);
            const isToday = isSameDay(date, today);
            const isSelected = isSameDay(date, selectedDate);

            return (
              <button
                type="button"
                key={dayNumber}
                className={[
                  "calendar-day",
                  isToday ? "is-today" : "",
                  isSelected ? "is-selected" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => setSelectedDate(date)}
                aria-label={date.toLocaleDateString("en-IN")}
                aria-pressed={isSelected}
              >
                {dayNumber}
              </button>
            );
          })}
        </div>

        <div className="calendar-selected-info">
          <span className="calendar-selected-dot" />
          <div>
            <strong>{isSameDay(selectedDate, today) ? "Today" : "Selected date"}</strong>
            <p>{selectedLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelectedDate(now);
            }}
          >
            Today
          </button>
        </div>
      </section>

      {/* LIVE WEATHER */}
      <section className="campus-widget weather-widget">
        <div className="campus-widget-header">
          <div>
            <span className="campus-widget-eyebrow">LIVE CONDITIONS</span>
            <h2>Campus Weather</h2>
            <p>Bishrampur, Palamu, Jharkhand</p>
          </div>
          <div className="campus-widget-icon weather-icon">☀</div>
        </div>

        {weather ? (
          <>
            <div className="weather-display">
              <div className="weather-sun">{weatherInfo.icon}</div>
              <div className="weather-temperature">
                <h3>
                  {Math.round(weather.temperature_2m)}
                  <span>°C</span>
                </h3>
                <p>{weatherInfo.label}</p>
                <p>Feels like {Math.round(weather.apparent_temperature)}°C</p>
              </div>
            </div>

            <div className="weather-status">
              <div className="weather-status-item">
                <span>💧</span>
                <div>
                  <small>HUMIDITY</small>
                  <strong>{weather.relative_humidity_2m}%</strong>
                </div>
              </div>
              <div className="weather-status-item">
                <span>🌬️</span>
                <div>
                  <small>WIND SPEED</small>
                  <strong>{weather.wind_speed_10m} km/h</strong>
                </div>
              </div>
            </div>

            <p className="weather-note">
              {lastUpdated
                ? `Last updated: ${lastUpdated.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Loading latest weather..."}
              {" · Refreshes every 10 minutes"}
            </p>
          </>
        ) : (
          <div className="weather-loading">
            <div className="weather-loading-icon">🌤️</div>
            <strong>
              {weatherError ? "Weather unavailable" : "Getting live weather..."}
            </strong>
            <p>
              {weatherError || "Fetching current conditions for Bishrampur."}
            </p>
            {weatherError && (
              <button
                type="button"
                className="weather-retry-btn"
                onClick={() => {
                  setWeatherError("");
                  setLastUpdated(null);
                  fetch(WEATHER_URL)
                    .then((response) => {
                      if (!response.ok) throw new Error();
                      return response.json();
                    })
                    .then((data) => {
                      if (!data.current) throw new Error();
                      setWeather(data.current);
                      setLastUpdated(new Date());
                    })
                    .catch(() => {
                      setWeatherError("Weather load nahi hua. Thodi der baad try karo.");
                    });
                }}
              >
                Retry
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default CampusCalendarWeather;
